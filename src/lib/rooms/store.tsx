import { Unsubscribe } from 'firebase/firestore';
import {
  createContext,
  createEffect,
  onCleanup,
  ParentComponent,
  useContext,
} from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

import { RoomData } from '@/types/room';
import { useUserStore } from '../user';
import { subscribeToRooms } from './repository';

interface RoomsState {
  rooms: RoomData[];
  selectedRoomId: string | null;
  loading: boolean;
  error: string | null;
}

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

  setSelectedRoomId(id: string) {
    this.setState('selectedRoomId', id);
  }

  upsertRoom(room: RoomData): void {
    this.setState('rooms', (prev) => {
      const index = prev.findIndex((r) => r.id === room.id);
      if (index < 0) {
        return [...prev, room];
      } else {
        return [...prev.slice(0, index), room, ...prev.slice(index + 1)];
      }
    });
  }

  removeRoom(id: string): void {
    this.setState('rooms', (prev) => {
      return prev.filter((r) => r.id !== id);
    });
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
  let unsubscribe: Unsubscribe | null = null;

  const roomsStore = new RoomsStore(state, setState);

  createEffect(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    if (!userStore.ip || userStore.loading || userStore.error) {
      setState({ loading: false, error: userStore.error });
      return;
    }

    setState({ loading: true, error: null });

    unsubscribe = subscribeToRooms(
      userStore.ip,
      (rooms) => {
        setState('rooms', rooms);
      },
      (roomIds) => {
        roomIds.forEach((id) => {
          roomsStore.removeRoom(id);
        });
      },
      (error) => {
        setState('error', error);
      }
    );

    setState('loading', false);
  });

  onCleanup(() => {
    if (unsubscribe) {
      unsubscribe();
    }
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
