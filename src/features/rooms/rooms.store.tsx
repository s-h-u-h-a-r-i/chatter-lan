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
import { RoomData } from './schemas';

// #region Types & Constants

interface RoomsStore {
  rooms: Accessor<RoomData[]>;
  roomIds: Accessor<string[]>;
  selectedRoom: Accessor<RoomData | null>;
  selectedRoomId: Accessor<string | null>;
  error: Accessor<string | null>;

  selectRoomById: Setter<string | null>;
  createRoom(name: string, passphrase: string): Promise<void>;
}

const ROOMS_SUBSCRIPTION_KEY = 'rooms' as const;

const RoomsStoreContext = createContext<RoomsStore>();

// #endregion Types & Constants

// #region Provider Component

export const RoomsStoreProvider: ParentComponent = (props) => {
  const userStore = useUserStore();
  const cryptoService = useCryptoService();
  const roomsSubscription = _useRoomsSubscription(userStore.ip);

  const [rawSelectedRoomId, setRawSelectedRoomId] = createSignal<string | null>(
    null
  );

  const selectedRoom = createMemo(() => {
    const id = rawSelectedRoomId();
    if (!id) return null;
    return roomsSubscription.rooms().find((r) => r.id === id) ?? null;
  });

  const selectedRoomId = createMemo(() => {
    const room = selectedRoom();
    return room ? room.id : null;
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

  const context: RoomsStore = {
    rooms: roomsSubscription.rooms,
    roomIds: roomsSubscription.roomIds,
    selectedRoom,
    selectedRoomId,
    error: roomsSubscription.error,
    selectRoomById: setRawSelectedRoomId,
    createRoom,
  };

  return (
    <RoomsStoreContext.Provider value={context}>
      {props.children}
    </RoomsStoreContext.Provider>
  );
};

export function useRoomsStore() {
  const context = useContext(RoomsStoreContext);
  if (!context) {
    throw new Error('useRoomsStore must be used within a RoomsStoreProvider');
  }
  return context;
}

// #endregion Provider Component

// #region Rooms Subscription Hook

function _useRoomsSubscription(ipAccessor: Accessor<string>) {
  const subscriptions = new FirestoreSubscriptionManager();

  const [rooms, setRooms] = createSignal<RoomData[]>([]);
  const [error, setError] = createSignal<string | null>(null);

  const roomIds = createMemo(() => rooms().map((r) => r.id));

  createEffect(() => {
    const ip = ipAccessor();

    subscriptions.unsubscribe(ROOMS_SUBSCRIPTION_KEY);

    setRooms([]);
    setError(null);

    subscriptions.subscribe(
      ROOMS_SUBSCRIPTION_KEY,
      roomRepo.subscribeToRooms(
        ip,
        _createRoomUpsertHandler(setRooms),
        _createRoomRemoveHandler(setRooms),
        (err) => setError(err)
      )
    );
  });

  onCleanup(() => subscriptions.clear());

  return {
    rooms,
    roomIds,
    error,
  };
}

// #endregion Rooms Subscription Hook

// #region Subscription Handlers

function _createRoomUpsertHandler(setRooms: Setter<RoomData[]>) {
  return (incoming: RoomData[]) => {
    setRooms((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      incoming.forEach((room) => map.set(room.id, room));
      return [...map.values()];
    });
  };
}

function _createRoomRemoveHandler(setRooms: Setter<RoomData[]>) {
  return (roomIds: string[]) => {
    setRooms((prev) => prev.filter((r) => !roomIds.includes(r.id)));
  };
}

// #endregion Subscription Handlers
