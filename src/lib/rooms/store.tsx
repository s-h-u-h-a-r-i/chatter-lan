import {
  createContext,
  createEffect,
  onCleanup,
  ParentComponent,
  useContext,
} from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

import { firestore, fsPaths } from '@/lib/firebase';
import { RoomData } from '@/types/room';
import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { useUserStore } from '../user';

interface RoomsState {
  rooms: RoomData[];
  loading: boolean;
  error: string | null;
}

class RoomsStore {
  constructor(
    private state: RoomsState,
    private setState: SetStoreFunction<RoomsState>
  ) {}

  get rooms(): ReadonlyArray<RoomData> {
    return Object.freeze(this.state.rooms);
  }

  get loading(): boolean {
    return this.state.loading;
  }

  get error(): string | null {
    return this.state.error;
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
    loading: true,
    error: null,
  });
  const userStore = useUserStore();
  let unsubscribe: Unsubscribe | null = null;

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

    const roomsRef = collection(
      firestore,
      fsPaths.rooms.ips.collection(userStore.ip).path
    );

    unsubscribe = onSnapshot(
      roomsRef,
      (snapshot) => {
        const rooms: RoomData[] = [];
        snapshot.forEach((doc) => {
          rooms.push({
            id: doc.id,
            ...doc.data(),
          } as RoomData);
        });
        setState({ rooms, loading: false, error: null });
      },
      (error) => {
        setState({ loading: false, error: error.message });
      }
    );
  });

  onCleanup(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  const context = new RoomsStore(state, setState);

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
