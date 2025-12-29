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
import { cryptoService } from '../../core/crypto';
import { useRoomsStore } from '../room';
import { useUserStore } from '../user';
import * as messageRepo from './message.repository';
import { MessageData } from './message.types';

type MessagesByRoomId = Record<string, Accessor<MessageData[]>>;
type LoadingByRoomId = Record<string, Accessor<boolean>>;
type ErrorsByRoomId = Record<string, Accessor<string | null>>;

interface MessagesStoreContext {
  messages(roomId: string): MessageData[];
  loading(roomId: string): boolean;
  error(roomId: string): string | null;
}

const MessagesStoreContext = createContext<MessagesStoreContext>();

const MessagesStoreProvider: ParentComponent = (props) => {
  const userStore = useUserStore();
  const roomsStore = useRoomsStore();
  const subscriptions = new FirestoreSubscriptionManager();

  const messagesByRoom: MessagesByRoomId = {};
  const loadingByRoom: LoadingByRoomId = {};
  const errorsByRoom: ErrorsByRoomId = {};

  createEffect(() => {
    if (userStore.loading() || roomsStore.loading()) return;
    const ip = userStore.ip();
    if (!ip) return;

    const currentRoomIds = new Set(roomsStore.rooms().map((r) => r.id));
    const subscribedRoomIds = new Set(subscriptions.keys);

    // * Unsubscribe removed rooms
    subscribedRoomIds.forEach((roomId) => {
      if (currentRoomIds.has(roomId)) return;

      subscriptions.unsubscribe(roomId);
      delete messagesByRoom[roomId];
      delete loadingByRoom[roomId];
      delete errorsByRoom[roomId];
    });

    // * Subscribe to new rooms
    currentRoomIds.forEach((roomId) => {
      if (subscriptions.has(roomId)) return;

      const [messages, setMessages] = createSignal<MessageData[]>([]);
      const [loading, setLoading] = createSignal(true);
      const [error, setError] = createSignal<string | null>(null);

      messagesByRoom[roomId] = messages;
      loadingByRoom[roomId] = loading;
      errorsByRoom[roomId] = error;

      subscriptions.subscribe(
        roomId,
        messageRepo.subscribeToMessages({
          ip,
          roomId,
          onUpsert(incoming) {
            setLoading(false);
            setMessages((prev) => _mergeMessages(prev, incoming));
          },
          onRemove(ids) {
            setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
          },
          onError(err) {
            setError(err);
            setLoading(false);
            subscriptions.unsubscribe(roomId);
          },
        })
      );
    });
  });

  onCleanup(() => {
    subscriptions.clear();
    cryptoService.destroy();
  });

  const context: MessagesStoreContext = {
    messages(roomId) {
      return messagesByRoom[roomId]?.() ?? [];
    },
    loading(roomId) {
      return loadingByRoom[roomId]?.() ?? false;
    },
    error(roomId) {
      return errorsByRoom[roomId]?.() ?? null;
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

function _mergeMessages(
  prev: MessageData[],
  incoming: MessageData[]
): MessageData[] {
  const map = new Map(prev.map((m) => [m.id, m]));
  incoming.forEach((m) => map.set(m.id, m));
  return [...map.values()].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
}
