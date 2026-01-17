import {
  Accessor,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  ParentComponent,
  Setter,
  useContext,
} from 'solid-js';

import { useCryptoService } from '@/core/crypto';
import { FirestoreSubscriptionManager } from '@/core/firebase';
import { useUserStore } from '../user';
import * as roomRepo from './room.repository';
import { RoomData } from './room.types';

// =====================================================================
// Types & Constants
// =====================================================================

interface RoomsStoreContext {
  rooms: Accessor<RoomData[]>;
  selectedRoom: Accessor<RoomData | null>;
  error: Accessor<string | null>;

  setSelectedRoomId: Setter<string | null>;
  createRoom(name: string, passphrase: string): Promise<void>;
}

const ROOMS_SUBSCRIPTION_KEY = 'rooms' as const;

const RoomsStoreContext = createContext<RoomsStoreContext>();

// =====================================================================
// Provider Component
// =====================================================================

const RoomsStoreProvider: ParentComponent = (props) => {
  const userStore = useUserStore();
  const cryptoService = useCryptoService();
  const roomsSubscription = useRoomsSubscription(userStore.ip);

  const [selectedRoomId, setSelectedRoomId] = createSignal<string | null>(null);

  const selectedRoom = createMemo(() => {
    const id = selectedRoomId();
    if (!id) return null;
    return roomsSubscription.rooms().find((r) => r.id === id) ?? null;
  });

  const createRoom = async (name: string, passphrase: string) => {
    const ip = userStore.ip();
    const roomId = crypto.randomUUID();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = btoa(String.fromCharCode(...salt));

    await cryptoService.init(roomId, passphrase, salt);
    const verificationToken = 'ROOM_VERIFICATION';
    const encrypted = await cryptoService.encrypt(roomId, verificationToken);

    await roomRepo.createRoom({
      roomId,
      ip,
      name,
      saltBase64,
      verificationToken: encrypted.ciphertext,
      verificationIV: encrypted.iv,
    });
  };

  const context: RoomsStoreContext = {
    rooms: roomsSubscription.rooms,
    selectedRoom,
    error: roomsSubscription.error,
    setSelectedRoomId,
    createRoom,
  };

  return (
    <RoomsStoreContext.Provider value={context}>
      {props.children}
    </RoomsStoreContext.Provider>
  );
};

function useRoomsStore() {
  const context = useContext(RoomsStoreContext);
  if (!context) {
    throw new Error('useRoomsStore must be used within a RoomsStoreProvider');
  }
  return context;
}

export { RoomsStoreProvider, useRoomsStore };

// =====================================================================
// Rooms Subscription Hook
// =====================================================================

function useRoomsSubscription(ipAccessor: Accessor<string>) {
  const subscriptions = new FirestoreSubscriptionManager();

  const [rooms, setRooms] = createSignal<RoomData[]>([]);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    const ip = ipAccessor();

    subscriptions.unsubscribe(ROOMS_SUBSCRIPTION_KEY);

    setRooms([]);
    setError(null);

    subscriptions.subscribe(
      ROOMS_SUBSCRIPTION_KEY,
      roomRepo.subscribeToRooms(
        ip,
        createRoomUpsertHandler(setRooms),
        createRoomRemoveHandler(setRooms),
        (err) => setError(err)
      )
    );
  });

  onCleanup(() => subscriptions.clear());

  return {
    rooms,
    error,
  };
}

// =====================================================================
// Subscription Handlers
// =====================================================================

function createRoomUpsertHandler(setRooms: Setter<RoomData[]>) {
  return (incoming: RoomData[]) => {
    setRooms((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      incoming.forEach((room) => map.set(room.id, room));
      return [...map.values()];
    });
  };
}

function createRoomRemoveHandler(setRooms: Setter<RoomData[]>) {
  return (roomIds: string[]) => {
    setRooms((prev) => prev.filter((r) => !roomIds.includes(r.id)));
  };
}
