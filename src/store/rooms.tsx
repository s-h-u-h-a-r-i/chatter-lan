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
  addRoom(room: RoomEntry): void;
  removeRoom(id: string): void;
  findRoomById(id: string): RoomEntry | null;
}

const RoomsStoreContext = createContext<[RoomsState, RoomsActions]>();

const RoomsStoreProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<RoomsState>({
    rooms: [],
    loading: false,
    error: null,
  });

  /**
   * ### Locate a room entry and its index by identifier
   * Addr\esses the need to efficiently access both the position and data
   * of a specific room in the current state using its unique identifier.
   *
   * @param id Unique identifier for the room to locate
   */
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

    addRoom(room) {
      const existingRoom = findRoomIndexAndEntry(room.id);

      if (existingRoom === null) {
        setState('rooms', state.rooms.length, room);
      } else {
        setState('rooms', existingRoom[0], room);
      }
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
