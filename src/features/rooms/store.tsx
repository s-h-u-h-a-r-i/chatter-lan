import { Unsubscribe } from 'firebase/firestore';
import {
  createContext,
  createEffect,
  onCleanup,
  ParentComponent,
  useContext,
} from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

import { useUserStore } from '../user';
import { subscribeToRooms } from './repository';
import { RoomData } from './types';

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
  let unsubscribe: Unsubscribe | null = null;

  const roomsStore = new RoomsStore(state, setState);

  createEffect(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    setState({ error: null, loading: true });

    if (userStore.loading) return;
    if (!userStore.ip) {
      setState({
        loading: false,
        error: userStore.error || 'Failed to load user context.',
      });
      return;
    }

    unsubscribe = subscribeToRooms(
      userStore.ip,
      (rooms) => {
        setState('loading', false);
        setState('rooms', (prev) => {
          const updatedRooms = [...prev];
          rooms.forEach((incomingRoom) => {
            const index = updatedRooms.findIndex(
              (r) => r.id === incomingRoom.id
            );
            if (index >= 0) {
              updatedRooms[index] = incomingRoom;
            } else {
              updatedRooms.push(incomingRoom);
            }
          });
          return updatedRooms;
        });
      },
      (roomIds) => {
        setState('rooms', (prev) =>
          prev.filter((r) => !roomIds.includes(r.id))
        );
      },
      (error) => {
        // * No need to reset error to null in prior callbacks since
        // * receiving an error here indicates the observer will stop,
        // * and no further updates will occur.
        setState('error', error);
        setState('loading', false);
      }
    );
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
