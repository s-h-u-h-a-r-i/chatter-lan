import {
  createContext,
  createEffect,
  onCleanup,
  ParentComponent,
  useContext,
} from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

import { FirestoreSubscriptionManager } from '@/core/firebase';
import { useUserStore } from '../user';
import * as roomRepo from './room.repository';
import { RoomData } from './room.types';

interface RoomsState {
  rooms: RoomData[];
  selectedRoomId: string | null;
  loading: boolean;
  error: string | null;
}

const ROOMS_SUBSCRIPTION_KEY = 'rooms' as const;

class RoomsStore {
  constructor(
    private state: RoomsState,
    private setState: SetStoreFunction<RoomsState>
  ) {}

  get rooms(): ReadonlyArray<RoomData> {
    return this.state.rooms;
  }

  get selectedRoom(): Readonly<RoomData> | null {
    return (
      this.state.rooms.find((r) => r.id === this.state.selectedRoomId) ?? null
    );
  }

  get loading(): boolean {
    return this.state.loading;
  }

  get error(): string | null {
    return this.state.error;
  }

  setSelectedRoomId(id: string | null) {
    this.setState('selectedRoomId', id);
  }
}

const RoomsStoreContext = createContext<RoomsStore>();

const RoomsStoreProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<RoomsState>({
    rooms: [],
    selectedRoomId: null,
    loading: true,
    error: null,
  });
  const userStore = useUserStore();
  const subscriptionManager = new FirestoreSubscriptionManager();

  const roomsStore = new RoomsStore(state, setState);

  createEffect(() => {
    subscriptionManager.unsubscribe(ROOMS_SUBSCRIPTION_KEY);

    setState({ error: null, loading: true });

    if (userStore.loading) return;
    if (!userStore.ip) {
      setState({
        loading: false,
        error: userStore.error || 'Failed to load user context.',
      });
      return;
    }

    const onUpsert = (rooms: RoomData[]) => {
      setState('loading', false);
      setState('rooms', (prev) => {
        const updatedRooms = [...prev];
        rooms.forEach((incomingRoom) => {
          const index = updatedRooms.findIndex((r) => r.id === incomingRoom.id);
          if (index >= 0) {
            updatedRooms[index] = incomingRoom;
          } else {
            updatedRooms.push(incomingRoom);
          }
        });
        return updatedRooms;
      });
    };

    const onRemove = (roomIds: string[]) => {
      setState('rooms', (prev) => prev.filter((r) => !roomIds.includes(r.id)));
    };

    const onError = (error: string) => {
      setState('error', error);
      setState('loading', false);
    };

    subscriptionManager.subscribe(
      ROOMS_SUBSCRIPTION_KEY,
      roomRepo.subscribeToRooms(userStore.ip, onUpsert, onRemove, onError)
    );
  });

  onCleanup(() => {
    subscriptionManager.clear();
  });

  return (
    <RoomsStoreContext.Provider value={roomsStore}>
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
