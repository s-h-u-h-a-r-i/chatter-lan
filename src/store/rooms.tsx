import { createContext, ParentComponent, useContext } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

import { RoomData } from '@/types/room';

interface RoomEntry {
  id: string;
  data: RoomData;
}

interface RoomsState {
  rooms: RoomEntry[];
  selectedRoomId: string | null;
  loading: boolean;
  error: string | null;
}

class RoomsStore {
  constructor(
    private state: RoomsState,
    private setState: SetStoreFunction<RoomsState>
  ) {}

  get rooms(): RoomEntry[] {
    return this.state.rooms;
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

  set error(msg: string) {
    this.setState('error', msg);
  }

  set selectedRoomId(id: string | null) {
    this.setState('selectedRoomId', id);
  }

  get selectedRoom(): RoomEntry | null {
    const selectedRoomId = this.state.selectedRoomId;
    const rooms = this.state.rooms;
    if (!selectedRoomId) return null;
    const found = this.#findRoomIndexAndEntry(rooms, selectedRoomId);
    return found ? found[1] : null;
  }

  upsertRoom(entry: RoomEntry): void {
    this.setState('rooms', (rooms) => {
      const found = this.#findRoomIndexAndEntry(rooms, entry.id);
      if (!found) {
        return [...rooms, entry];
      }
      const [index] = found;
      return [...rooms.slice(0, index), entry, ...rooms.slice(index + 1)];
    });
  }

  removeRoom(id: string): void {
    this.setState('rooms', (rooms) => {
      const found = this.#findRoomIndexAndEntry(rooms, id);
      if (!found) return rooms;
      const [index] = found;
      return [...rooms.slice(0, index), ...rooms.slice(index + 1)];
    });
  }

  #findRoomIndexAndEntry(
    rooms: RoomEntry[],
    id: string
  ): [number, RoomEntry] | null {
    const index = rooms.findIndex((room) => room.id === id);
    if (index < 0) return null;
    return [index, rooms[index]];
  }
}

const RoomsStoreContext = createContext<RoomsStore>();

const RoomsStoreProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<RoomsState>({
    rooms: [],
    selectedRoomId: null,
    loading: false,
    error: null,
  });

  const findRoomIndexAndEntry = (
    rooms: RoomEntry[],
    id: string
  ): [number, RoomEntry] | null => {
    const index = rooms.findIndex((room) => room.id === id);
    if (index < 0) return null;
    return [index, rooms[index]];
  };

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

export { RoomsStoreProvider, useRoomsStore, type RoomEntry };
