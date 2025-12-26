import { Component, createSignal } from 'solid-js';

import { ChatArea, MessagesStoreProvider } from '@/features/messages';
import {
  InfoSidebar,
  RoomsSidebar,
  RoomsStoreProvider,
} from '@/features/rooms';
import { UserStoreProvider } from '@/features/user';
import styles from './App.module.css';

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
