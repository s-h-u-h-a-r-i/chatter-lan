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
import { UserStoreProvider } from '@/features/user';
import styles from './App.module.css';

const AppContent: Component = () => {
  const roomsStore = useRoomsStore();
  const cryptoService = useCryptoService();

  const [openSidebar, setOpenSidebar] = createSignal<'room' | 'info' | null>(
    null
  );
  const [pendingRoomId, setPendingRoomId] = createSignal<string | null>(null);

  const isInfoSidebarOpen = () => openSidebar() === 'info';
  const isRoomsSidebarOpen = () => {
    return openSidebar() === 'room' || roomsStore.selectedRoom() === null;
  };
  const pendingRoom = createMemo(() => {
    const id = pendingRoomId();
    if (!id) return null;
    return roomsStore.rooms().find((r) => r.id === id) ?? null;
  });

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
      <RoomsListSidebar isOpen={isRoomsSidebarOpen()} />
      <ChatArea />
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
