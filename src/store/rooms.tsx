import { createContext, ParentComponent, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

import { RoomData } from '@/types/room';

interface RoomEntry {
  id: string;
  data: RoomData;
}

interface RoomsState {
  rooms: RoomEntry[];
  loading: boolean;
  error: string | null;
}

interface RoomsActions {
  setLoading(loading: boolean): void;
  setError(error: string | null): void;
  upsertRoom(entry: RoomEntry): void;
  removeRoom(id: string): void;
}

const RoomsStoreContext = createContext<[RoomsState, RoomsActions]>();

const RoomsStoreProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<RoomsState>({
    rooms: [],
    loading: false,
    error: null,
  });

  const findRoomIndexAndEntry = (id: string): [number, RoomEntry] | null => {
    const rooms = state.rooms;
    const index = rooms.findIndex((room) => room.id === id);
    if (index < 0) return null;
    return [index, rooms[index]];
  };

  const actions: RoomsActions = {
    setLoading(loading) {
      setState('loading', loading);
    },
    setError(error) {
      setState('error', error);
    },

    upsertRoom(entry) {
      setState('rooms', (rooms) => {
        const index = rooms.findIndex((r) => r.id === entry.id);
        if (index < 0) {
          return [...rooms, entry];
        } else {
          return [...rooms.slice(0, index), entry, ...rooms.slice(index + 1)];
        }
      });
    },

    removeRoom(id) {
      setState('rooms', (rooms) => {
        const index = rooms.findIndex((room) => room.id === id);
        if (index < 0) return rooms;
        return [...rooms.slice(0, index), ...rooms.slice(index + 1)];
      });
    },
  };

  return (
    <RoomsStoreContext.Provider value={[state, actions]}>
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
