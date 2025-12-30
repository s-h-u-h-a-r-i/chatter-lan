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

import { cryptoService } from '@/core/crypto';
import { FirestoreSubscriptionManager } from '@/core/firebase';
import { useUserStore } from '../user';
import * as roomRepo from './room.repository';
import { RoomData } from './room.types';

interface RoomsStoreContext {
  rooms: Accessor<RoomData[]>;
  selectedRoom: Accessor<RoomData | null>;
  loading: Accessor<boolean>;
  error: Accessor<string | null>;

  setSelectedRoomId: Setter<string | null>;
  createRoom(name: string, passphrase: string): Promise<void>;
}

const ROOMS_SUBSCRIPTION_KEY = 'rooms' as const;

const RoomsStoreContext = createContext<RoomsStoreContext>();

const RoomsStoreProvider: ParentComponent = (props) => {
  const userStore = useUserStore();
  const subscriptions = new FirestoreSubscriptionManager();

  const [rooms, setRooms] = createSignal<RoomData[]>([]);
  const [selectedRoomId, setSelectedRoomId] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  const selectedRoom = createMemo(() => {
    const id = selectedRoomId();
    if (!id) return null;
    return rooms().find((r) => r.id === id) ?? null;
  });

  createEffect(() => {
    const ip = userStore.ip();

    subscriptions.unsubscribe(ROOMS_SUBSCRIPTION_KEY);
    setLoading(true);
    setError(null);

    if (userStore.loading()) return;

    if (!ip) {
      setLoading(false);
      setError(userStore.error() ?? 'Failed to load user context.');
      return;
    }

    subscriptions.subscribe(
      ROOMS_SUBSCRIPTION_KEY,
      roomRepo.subscribeToRooms(
        ip,
        _createRoomUpsert(setRooms, setLoading),
        _createRoomRemove(setRooms),
        _createError(setError, setLoading)
      )
    );
  });

  onCleanup(() => subscriptions.clear());

  const context: RoomsStoreContext = {
    rooms,
    selectedRoom,
    loading,
    error,

    setSelectedRoomId,
    async createRoom(name, passphrase) {
      const ip = userStore.ip();
      if (!ip) throw new Error('User IP is not available');

      const roomId = crypto.randomUUID();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltBase64 = btoa(String.fromCharCode(...salt));

      await cryptoService.init(roomId, passphrase, salt);
      const verificationToken = 'ROOM_VERIFICAITON';
      const encrypted = await cryptoService.encrypt(roomId, verificationToken);

      await roomRepo.createRoom({
        roomId,
        ip,
        name,
        saltBase64,
        verificationToken: encrypted.ciphertext,
        verificationIV: encrypted.iv,
      });
    },
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

function _createRoomUpsert(
  setRooms: Setter<RoomData[]>,
  setLoading: Setter<boolean>
) {
  return (incoming: RoomData[]) => {
    setLoading(false);
    setRooms((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      incoming.forEach((room) => map.set(room.id, room));
      return [...map.values()];
    });
  };
}

function _createRoomRemove(setRooms: Setter<RoomData[]>) {
  return (roomIds: string[]) => {
    setRooms((prev) => prev.filter((r) => !roomIds.includes(r.id)));
  };
}

function _createError(
  setError: Setter<string | null>,
  setLoading: Setter<boolean>
) {
  return (err: string) => {
    setError(err);
    setLoading(false);
  };
}
