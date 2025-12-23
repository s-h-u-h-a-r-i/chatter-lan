import { createContext, ParentComponent, useContext } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

import { RoomData } from '@/types/room';

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

  set loading(loading: boolean) {
    this.setState('loading', loading);
  }

  set error(msg: string | null) {
    this.setState('error', msg);
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
