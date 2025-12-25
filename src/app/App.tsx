import { Component, createSignal } from 'solid-js';

import { RoomsStoreProvider } from '@/lib/rooms';
import { UserStoreProvider } from '@/lib/user';

import { MessagesStoreProvider } from '@/lib/messages';
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
          <MessagesStoreProvider>
            <RoomsSidebar isOpen={roomsSidebarOpen()} />
            <ChatArea />
            <InfoSidebar isOpen={infoSidebarOpen()} />
          </MessagesStoreProvider>
        </RoomsStoreProvider>
      </UserStoreProvider>
    </div>
  );
};

export default App;
