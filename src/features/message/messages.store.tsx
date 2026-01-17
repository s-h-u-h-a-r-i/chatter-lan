import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  ParentComponent,
  useContext,
} from 'solid-js';

import { FirestoreSubscriptionManager } from '@/core/firebase';
import { useRoomsStore } from '../room';
import { useUserStore } from '../user';
import * as messageRepo from './message.repository';
import { MessageData } from './message.types';

// =====================================================================
// Types
// =====================================================================

type MessagesByRoomId = Record<string, Accessor<MessageData[]>>;
type ErrorsByRoomId = Record<string, Accessor<string | null>>;

interface MessagesStoreContext {
  messages(roomId: string): MessageData[];
  error(roomId: string): string | null;
}

const MessagesStoreContext = createContext<MessagesStoreContext>();

// =====================================================================
// Provider Component
// =====================================================================

const MessagesStoreProvider: ParentComponent = (props) => {
  const userStore = useUserStore();
  const roomsStore = useRoomsStore();

  const messagesSubscription = useMessagesSubscription(
    userStore.ip,
    roomsStore.roomIds
  );

  const context: MessagesStoreContext = {
    messages(roomId) {
      return messagesSubscription.messagesByRoom[roomId]?.() ?? [];
    },
    error(roomId) {
      return messagesSubscription.errorsByRoom[roomId]?.() ?? null;
    },
  };

  return (
    <MessagesStoreContext.Provider value={context}>
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

// =====================================================================
// Messages Subscription Hook
// =====================================================================

function useMessagesSubscription(
  ipAccessor: Accessor<string>,
  roomIdsAccessor: Accessor<string[]>
) {
  const subscriptions = new FirestoreSubscriptionManager();

  const messagesByRoom: MessagesByRoomId = {};
  const errorsByRoom: ErrorsByRoomId = {};

  createEffect(() => {
    const currentIp = ipAccessor();
    const currentRoomIds = new Set(roomIdsAccessor());
    const subscribedRoomIds = new Set(subscriptions.keys);

    // * Remove subscriptions for rooms that no longer exist
    subscribedRoomIds.forEach((roomId) => {
      if (currentRoomIds.has(roomId)) return;
      subscriptions.unsubscribe(roomId);
      delete messagesByRoom[roomId];
      delete errorsByRoom[roomId];
    });

    // * Add subscriptions for new rooms
    currentRoomIds.forEach((roomId) => {
      if (subscriptions.has(roomId)) return;
      const [messages, setMessages] = createSignal<MessageData[]>([]);
      const [error, setError] = createSignal<string | null>(null);

      messagesByRoom[roomId] = messages;
      errorsByRoom[roomId] = error;

      subscriptions.subscribe(
        roomId,
        messageRepo.subscribeToMessages({
          ip: currentIp,
          roomId,
          onUpsert(incoming) {
            setMessages((prev) => mergeMessages(prev, incoming));
          },
          onRemove(ids) {
            setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
          },
          onError(err) {
            setError(err);
            subscriptions.unsubscribe(roomId);
          },
        })
      );
    });
  });

  onCleanup(() => {
    subscriptions.clear();
  });

  return {
    messagesByRoom,
    errorsByRoom,
  };
}

// =====================================================================
// Utilities
// =====================================================================

function mergeMessages(
  prev: MessageData[],
  incoming: MessageData[]
): MessageData[] {
  const map = new Map(prev.map((m) => [m.id, m]));
  incoming.forEach((m) => map.set(m.id, m));
  return [...map.values()].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
}
