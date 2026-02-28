import {
  Component,
  createMemo,
  ErrorBoundary,
  Match,
  Show,
  Suspense,
  Switch,
  createSignal,
} from 'solid-js';

import { CryptoServiceProvider } from '@/core/crypto';
import { ChatArea, RoomMessagesStoreProvider } from '@/features/messages';
import {
  InfoSidebar,
  RoomPassphrasePrompt,
  RoomsListSidebar,
  RoomsStoreProvider,
  useRoomsStore,
} from '@/features/rooms';
import { UserStoreProvider } from '@/features/user';
import { MessageCircle, TriangleAlert } from '@/ui/icons';
import styles from './App.module.css';

const App: Component = () => (
  <ErrorBoundary fallback={(err) => <_AppErrorFallback error={err} />}>
    <Suspense fallback={<_AppLoadingFallback />}>
      <CryptoServiceProvider>
        <UserStoreProvider>
          <RoomsStoreProvider>
            <RoomMessagesStoreProvider>
              <_AppContent />
            </RoomMessagesStoreProvider>
          </RoomsStoreProvider>
        </UserStoreProvider>
      </CryptoServiceProvider>
    </Suspense>
  </ErrorBoundary>
);

export default App;

const _AppContent: Component = () => {
  const roomsStore = useRoomsStore();

  const [openSidebar, setOpenSidebar] = createSignal<'rooms' | 'info' | null>(
    null
  );

  const isInfoSidebarOpen = () =>
    openSidebar() === 'info' && roomsStore.selectedRoom() !== null;
  const isRoomsSidebarOpen = () => {
    return openSidebar() === 'rooms' || roomsStore.selectedRoom() === null;
  };

  const handleToggleRoomsSidebar = () => {
    const isRoomsSidebarOpen = openSidebar() === 'rooms';
    isRoomsSidebarOpen ? setOpenSidebar(null) : setOpenSidebar('rooms');
  };

  const handleToggleInfoSidebar = () => {
    const isInfoSidebarOpen = openSidebar() === 'info';
    isInfoSidebarOpen ? setOpenSidebar(null) : setOpenSidebar('info');
  };

  return (
    <div class={styles.app}>
      <Show when={isRoomsSidebarOpen() || isInfoSidebarOpen()}>
        <div class={styles.overlay} onclick={() => setOpenSidebar(null)} />
      </Show>

      <RoomsListSidebar
        isOpen={isRoomsSidebarOpen()}
        onCloseSidebar={() => setOpenSidebar(null)}
      />
      <main class={styles.centerPane}>
        <Switch>
          <Match when={roomsStore.pendingJoinRoom()}>
            {(room) => (
              <div class={styles.centerState}>
                <RoomPassphrasePrompt
                  room={room()}
                  isSubmitting={roomsStore.isCheckingRoomAccess()}
                  error={roomsStore.joinError()}
                  onSubmit={(passphrase) =>
                    roomsStore.submitPendingRoomPassphrase(passphrase)
                  }
                  onCancel={() => roomsStore.cancelPendingJoinRoom()}
                />
              </div>
            )}
          </Match>

          <Match when={!roomsStore.selectedRoom()}>
            <_NoRoomSelectedState />
          </Match>

          <Match when={roomsStore.selectedRoom()}>
            <ChatArea
              onToggleRoomsSidebar={handleToggleRoomsSidebar}
              onToggleInfoSidebar={handleToggleInfoSidebar}
            />
          </Match>
        </Switch>
      </main>
      <InfoSidebar isOpen={isInfoSidebarOpen()} />
    </div>
  );
};

const _NoRoomSelectedState: Component = () => (
  <div class={styles.centerState}>
    <div class={styles.emptyIcon}>
      <MessageCircle size={64} strokeWidth={1.5} />
    </div>
    <h3 class={styles.centerTitle}>Welcome to Chatter-Lan</h3>
    <p class={styles.centerDescription}>
      Choose a room from the sidebar to start chatting or create your own room.
    </p>
  </div>
);

const _AppErrorFallback: Component<{ error: unknown }> = (props) => {
  const errorString = createMemo(() =>
    props.error instanceof Error ? props.error.toString() : String(props.error),
  );
  const errorStack = createMemo(() =>
    props.error instanceof Error ? props.error.stack : undefined,
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
