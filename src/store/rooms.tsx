import { createContext, ParentComponent, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

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

interface RoomsStore {
  readonly rooms: RoomEntry[];
  readonly selectedRoom: RoomEntry | null;
  loading: boolean;
  get error(): string | null;
  set error(error: string);
  set selectedRoomId(id: string | null);
  upsertRoom(entry: RoomEntry): void;
  removeRoom(id: string): void;
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

  const context: RoomsStore = {
    get rooms(): RoomEntry[] {
      return state.rooms;
    },
    get loading(): boolean {
      return state.loading;
    },
    get error(): string | null {
      return state.error;
    },
    get selectedRoom(): RoomEntry | null {
      if (!state.selectedRoomId) return null;
      const found = findRoomIndexAndEntry(state.rooms, state.selectedRoomId);
      if (!found) return null;
      return found[1];
    },

    set loading(loading: boolean) {
      setState('loading', loading);
    },
    set error(error: string) {
      setState('error', error);
    },
    set selectedRoomId(id: string) {
      setState('selectedRoomId', id);
    },

    upsertRoom(entry: RoomEntry): void {
      setState('rooms', (rooms) => {
        const found = findRoomIndexAndEntry(rooms, entry.id);
        if (!found) {
          return [...rooms, entry];
        } else {
          const [index] = found;
          return [...rooms.slice(0, index), entry, ...rooms.slice(index + 1)];
        }
      });
    },

    removeRoom(id: string): void {
      setState('rooms', (rooms) => {
        const found = findRoomIndexAndEntry(rooms, id);
        if (!found) return rooms;
        const [index] = found;
        return [...rooms.slice(0, index), ...rooms.slice(index + 1)];
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

export { RoomsStoreProvider, useRoomsStore, type RoomEntry };
