import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  ErrorBoundary,
  Show,
  Suspense,
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
import { TriangleAlert } from '@/ui/icons';
import styles from './App.module.css';

const App: Component = () => (
  <ErrorBoundary fallback={(err) => <_AppErrorFallback error={err} />}>
    <Suspense fallback={<_AppLoadingFallback />}>
      <CryptoServiceProvider>
        <UserStoreProvider>
          <RoomsStoreProvider>
            <MessagesStoreProvider>
              <_AppContent />
            </MessagesStoreProvider>
          </RoomsStoreProvider>
        </UserStoreProvider>
      </CryptoServiceProvider>
    </Suspense>
  </ErrorBoundary>
);

export default App;

const _AppContent: Component = () => {
  const roomsStore = useRoomsStore();
  const cryptoService = useCryptoService();

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
    </div>
  );
};

const _AppErrorFallback: Component<{ error: unknown }> = (props) => {
  const errorString = createMemo(() =>
    props.error instanceof Error ? props.error.toString() : String(props.error)
  );
  const errorStack = createMemo(() =>
    props.error instanceof Error ? props.error.stack : undefined
  );

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div class={styles.fallback}>
      <div class={styles.fallbackContent}>
        <div class={styles.errorIcon}>
          <TriangleAlert />
        </div>
        <h1 class={styles.errorTitle}>Something went wrong</h1>
        <p class={styles.errorMessage}>
          We're sorry, but something unexpected happened
          <br />
          Please try refreshing the page.
        </p>
        <button onClick={handleRefresh} class={styles.refreshButton}>
          Refresh Page
        </button>
        <Show when={import.meta.env.DEV}>
          <details class={styles.errorDetails}>
            <summary>Error Details (Dev Only)</summary>
            <pre>{errorString()}</pre>
            <Show when={errorStack()}>
              <pre>{errorStack()}</pre>
            </Show>
          </details>
        </Show>
      </div>
    </div>
  );
};

const _AppLoadingFallback: Component = () => (
  <div class={styles.fallback}>
    <div class={styles.fallbackContent}>
      <div class={styles.loadingSpinner}>
        <div class={styles.spinner} />
      </div>
      <h1 class={styles.loadingTitle}>Loading...</h1>
      <p class={styles.loadingMessage}>Please wait while we set things up</p>
    </div>
  </div>
);
