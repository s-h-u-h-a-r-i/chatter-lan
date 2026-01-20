import {
  Accessor,
  createContext,
  createEffect,
  createMemo,
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
// Types & Constants
// =====================================================================

interface MessagesStoreContext {
  current: Accessor<{
    roomId: string;
    messages: MessageData[];
    error: string | null;
  } | null>;
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
    roomsStore.selectedRoomId
  );

  const context: MessagesStoreContext = {
    current: createMemo(() => {
      const roomId = roomsStore.selectedRoomId();
      if (!roomId) return null;

      return {
        roomId,
        messages: messagesSubscription.messages(),
        error: messagesSubscription.error(),
      };
    }),
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
  selectedRoomIdAccessor: Accessor<string | null>
) {
  const CURRENT_ROOM_KEY = 'current_room' as const;
  const subscriptions = new FirestoreSubscriptionManager();

  const [messages, setMessages] = createSignal<MessageData[]>([]);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    const currentIp = ipAccessor();
    const selectedRoomId = selectedRoomIdAccessor();

    subscriptions.unsubscribe(CURRENT_ROOM_KEY);

    setMessages([]);
    setError(null);

    if (!selectedRoomId) return;

    subscriptions.subscribe(
      CURRENT_ROOM_KEY,
      messageRepo.subscribeToMessages({
        ip: currentIp,
        roomId: selectedRoomId,
        onUpsert(incoming) {
          setMessages((prev) => mergeMessages(prev, incoming));
        },
        onRemove(ids) {
          setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
        },
        onError(err) {
          setError(err);
          subscriptions.unsubscribe(CURRENT_ROOM_KEY);
        },
      })
    );
  });

  onCleanup(() => {
    subscriptions.clear();
  });

  return {
    messages,
    error,
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
