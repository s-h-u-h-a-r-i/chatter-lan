import { Component, createSignal } from 'solid-js';

import { RoomsStoreProvider } from '@/stores/rooms';
import styles from './App.module.css';
import { ChatArea, InfoSidebar, RoomsSidebar } from './components';

const App: Component = (props) => {
  const [openSidebar, setOpenSidebar] = createSignal<'room' | 'info' | null>(
    null
  );
  const roomsSidebarOpen = () => openSidebar() === 'room';
  const infoSidebarOpen = () => openSidebar() === 'info';

  return (
    <div class={styles.app}>
      <RoomsStoreProvider>
        <RoomsSidebar isOpen={roomsSidebarOpen()} />
        <ChatArea />
        <InfoSidebar isOpen={infoSidebarOpen()} />
      </RoomsStoreProvider>
    </div>
  );
};

export default App;
