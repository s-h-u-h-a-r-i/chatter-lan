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

interface RoomsActions {}

const RoomsStoreContext = createContext<[RoomsState, RoomsActions]>();

const RoomsStoreProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<RoomsState>({
    rooms: [],
    loading: false,
    error: null,
  });

  const actions: RoomsActions = {};

  return (
    <RoomsStoreContext.Provider value={[state, setState]}>
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
