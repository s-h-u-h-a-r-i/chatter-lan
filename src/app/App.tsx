import { Component, createSignal } from 'solid-js';

import { RoomsStoreProvider } from '@/stores/rooms';
import { UserStoreProvider } from '@/stores/user';

import styles from './App.module.css';
import { ChatArea, InfoSidebar, RoomsSidebar } from './components';

const App: Component = () => {
  const [openSidebar, setOpenSidebar] = createSignal<'room' | 'info' | null>(
    null
  );
  const roomsSidebarOpen = () => openSidebar() === 'room';
  const infoSidebarOpen = () => openSidebar() === 'info';

  return (
    <div class={styles.app}>
      <UserStoreProvider>
        <RoomsStoreProvider>
          <RoomsSidebar isOpen={roomsSidebarOpen()} />
          <ChatArea />
          <InfoSidebar isOpen={infoSidebarOpen()} />
        </RoomsStoreProvider>
      </UserStoreProvider>
    </div>
  );
};

export default App;
