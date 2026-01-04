import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  Show,
} from 'solid-js';

import { CryptoServiceProvider, useCryptoService } from '@/core/crypto';
import { ChatArea, MessagesStoreProvider } from '@/features/message';
import {
  InfoSidebar,
  RoomPassphraseModal,
  RoomsListSidebar,
  RoomsStoreProvider,
  useRoomsStore,
} from '@/features/room';
import {
  UserNameModal,
  UserStoreProvider,
  useUserStore,
} from '@/features/user';
import styles from './App.module.css';

const AppContent: Component = () => {
  const roomsStore = useRoomsStore();
  const cryptoService = useCryptoService();
  const userStore = useUserStore();

  const [openSidebar, setOpenSidebar] = createSignal<'rooms' | 'info' | null>(
    null
  );
  const [pendingRoomId, setPendingRoomId] = createSignal<string | null>(null);

  const isInfoSidebarOpen = () =>
    openSidebar() === 'info' && roomsStore.selectedRoom() !== null;
  const isRoomsSidebarOpen = () => {
    return openSidebar() === 'rooms' || roomsStore.selectedRoom() === null;
  };
  const pendingRoom = createMemo(() => {
    const id = pendingRoomId();
    if (!id) return null;
    return roomsStore.rooms().find((r) => r.id === id) ?? null;
  });

  const handleToggleRoomsSidebar = () => {
    const isRoomsSidebarOpen = openSidebar() === 'rooms';
    isRoomsSidebarOpen ? setOpenSidebar(null) : setOpenSidebar('rooms');
  };

  const handleToggleInfoSidebar = () => {
    const isInfoSidebarOpen = openSidebar() === 'info';
    isInfoSidebarOpen ? setOpenSidebar(null) : setOpenSidebar('info');
  };

  createEffect(() => {
    const selectedRoom = roomsStore.selectedRoom();
    if (selectedRoom && !pendingRoomId()) {
      cryptoService.hasKey(selectedRoom.id).then((isInitialized) => {
        if (!isInitialized) setPendingRoomId(selectedRoom.id);
      });
    } else if (!selectedRoom && pendingRoomId()) {
      setPendingRoomId(null);
    }
  });

  return (
    <div class={styles.app}>
      <Show when={isRoomsSidebarOpen() || isInfoSidebarOpen()}>
        <div class={styles.overlay} onclick={() => setOpenSidebar(null)} />
      </Show>

      <RoomsListSidebar
        isOpen={isRoomsSidebarOpen()}
        onCloseSidebar={() => setOpenSidebar(null)}
      />
      <ChatArea
        onToggleRoomsSidebar={handleToggleRoomsSidebar}
        onToggleInfoSidebar={handleToggleInfoSidebar}
      />
      <InfoSidebar isOpen={isInfoSidebarOpen()} />

      <Show when={pendingRoom()}>
        {(room) => (
          <RoomPassphraseModal
            isOpen={true}
            room={room()}
            onSuccess={() => {
              setPendingRoomId(null);
            }}
            onCancel={() => {
              roomsStore.setSelectedRoomId(null);
              setPendingRoomId(null);
            }}
          />
        )}
      </Show>

      <UserNameModal
        isOpen={!userStore.name()}
        currentName={userStore.name()}
        onSubmit={userStore.setName}
      />
    </div>
  );
};

const App: Component = () => {
  return (
    <CryptoServiceProvider>
      <UserStoreProvider>
        <RoomsStoreProvider>
          <MessagesStoreProvider>
            <AppContent />
          </MessagesStoreProvider>
        </RoomsStoreProvider>
      </UserStoreProvider>
    </CryptoServiceProvider>
  );
};

export default App;
