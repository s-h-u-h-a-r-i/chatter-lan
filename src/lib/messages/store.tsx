import { Unsubscribe } from 'firebase/firestore';
import {
  createContext,
  createEffect,
  onCleanup,
  ParentComponent,
  useContext,
} from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

import { useRoomsStore } from '../rooms';
import { useUserStore } from '../user';
import { subscribeToMessages } from './repository';
import { MessageData } from './types';

interface MessagesState {
  messagesByRoom: Record<string, MessageData[]>;
  loadingByRoom: Record<string, boolean>;
  errorsByRoom: Record<string, string | null>;
}

class MessagesStore {
  constructor(
    private state: MessagesState,
    private setState: SetStoreFunction<MessagesState>
  ) {}

  getMessagesForRoom(roomId: string): ReadonlyArray<MessageData> {
    return this.state.messagesByRoom[roomId] ?? [];
  }

  isLoading(roomId: string): boolean {
    return this.state.loadingByRoom[roomId] ?? false;
  }

  getError(roomId: string): string | null {
    return this.state.errorsByRoom[roomId] ?? null;
  }
}

const MessagesStoreContext = createContext<MessagesStore>();

const MessagesStoreProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<MessagesState>({
    messagesByRoom: {},
    loadingByRoom: {},
    errorsByRoom: {},
  });
  const userStore = useUserStore();
  const roomsStore = useRoomsStore();
  const subscriptions = new Map<string, Unsubscribe>();

  const messagesStore = new MessagesStore(state, setState);

  createEffect(() => {
    const userIp = userStore.ip;
    if (userStore.loading || userIp === null) return;
    if (roomsStore.loading) return;

    const currentRoomIds = new Set(roomsStore.rooms.map((r) => r.id));
    const subscribedRoomIds = new Set(subscriptions.keys());

    // * Unsubscribe from rooms that no longer exist
    subscribedRoomIds.forEach((roomId) => {
      if (!currentRoomIds.has(roomId)) {
        const unsubscribe = subscriptions.get(roomId);
        if (unsubscribe) {
          unsubscribe();
          subscriptions.delete(roomId);
        }
        setState('messagesByRoom', roomId, []);
        setState('loadingByRoom', roomId, false);
        setState('errorsByRoom', roomId, null);
      }
    });

    // * Subscribe to new rooms
    currentRoomIds.forEach((roomId) => {
      if (!subscriptions.has(roomId)) {
        setState('loadingByRoom', roomId, true);
        setState('errorsByRoom', roomId, null);

        const unsubscribe = subscribeToMessages({
          ip: userIp,
          roomId: roomId,
          onUpdate(messages) {
            setState('messagesByRoom', roomId, (prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMessages = messages.filter(
                (m) => !existingIds.has(m.id)
              );
              return [...prev, ...newMessages].sort(
                (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
              );
            });
          },
          onRemove(messageIds) {
            setState('messagesByRoom', roomId, (prev) =>
              prev.filter((m) => !messageIds.includes(m.id))
            );
          },
          onError(error) {
            setState('errorsByRoom', roomId, error);
          },
        });

        subscriptions.set(roomId, unsubscribe);
        setState('loadingByRoom', roomId, false);
      }
    });
  });

  onCleanup(() => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
    subscriptions.clear();
  });

  return (
    <MessagesStoreContext.Provider value={messagesStore}>
      {props.children}
    </MessagesStoreContext.Provider>
  );
};

function useMessagesStore() {
  const context = useContext(MessagesStoreContext);
  if (!context) {
    throw new Error(
      'useMessagesStore must be used within a MessagesStoreProvider'
    );
  }
  return context;
}

export { MessagesStoreProvider, useMessagesStore };
