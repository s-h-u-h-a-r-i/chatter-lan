import { Component, createEffect, createSignal, Show } from 'solid-js';

import { cryptoService } from '@/core/crypto';
import { ChatArea, MessagesStoreProvider } from '@/features/messages';
import {
  InfoSidebar,
  RoomPassphraseModal,
  RoomsSidebar,
  RoomsStoreProvider,
  useRoomsStore,
} from '@/features/rooms';
import { UserStoreProvider } from '@/features/user';
import styles from './App.module.css';

const AppContent: Component = () => {
  const [openSidebar, setOpenSidebar] = createSignal<'room' | 'info' | null>(
    null
  );
  const [pendingRoomId, setPendingRoomId] = createSignal<string | null>(null);
  const roomsStore = useRoomsStore();

  const roomsSidebarOpen = () => openSidebar() === 'room';
  const infoSidebarOpen = () => openSidebar() === 'info';
  const pendingRoom = () => {
    const id = pendingRoomId();
    if (!id) return null;
    return roomsStore.rooms.find((r) => r.id === id) ?? null;
  };

  createEffect(() => {
    const selectedRoom = roomsStore.selectedRoom;
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
      <RoomsSidebar isOpen={roomsSidebarOpen()} />
      <ChatArea />
      <InfoSidebar isOpen={infoSidebarOpen()} />
      <Show when={pendingRoom()}>
        {(room) => (
          <RoomPassphraseModal
            isOpen={true}
            roomId={room().id}
            roomName={room().name}
            roomSalt={room().salt}
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
    <UserStoreProvider>
      <RoomsStoreProvider>
        <MessagesStoreProvider>
          <AppContent />
        </MessagesStoreProvider>
      </RoomsStoreProvider>
    </UserStoreProvider>
  );
};

export default App;
