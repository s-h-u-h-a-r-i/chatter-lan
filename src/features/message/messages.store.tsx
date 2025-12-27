import {
  createContext,
  createEffect,
  onCleanup,
  ParentComponent,
  useContext,
} from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

import { FirestoreSubscriptionManager } from '@/core/firebase';
import { cryptoService, CryptoService, EncryptedData } from '../../core/crypto';
import { useRoomsStore } from '../room';
import { useUserStore } from '../user';
import * as messageRepo from './message.repository';
import { EncryptedMessageContent, MessageData } from './message.types';

interface MessagesState {
  messagesByRoom: Record<string, MessageData[]>;
  loadingByRoom: Record<string, boolean>;
  errorsByRoom: Record<string, string | null>;
}

class MessagesStore {
  constructor(
    private state: MessagesState,
    private setState: SetStoreFunction<MessagesState>,
    private cryptoService: CryptoService
  ) {}

  getMessagesForRoom(roomId: string): ReadonlyArray<MessageData> {
    return this.state.messagesByRoom[roomId] ?? [];
  }

  async decryptMessage(params: {
    roomId: string;
    messageId: string;
    encryptedContent: EncryptedMessageContent;
    roomSalt: string;
  }): Promise<string | null> {
    try {
      const encrypted: EncryptedData = {
        ciphertext: params.encryptedContent.ciphertext,
        iv: params.encryptedContent.iv,
        salt: params.roomSalt,
      };
      return await this.cryptoService.decrypt(params.roomId, encrypted);
    } catch (error) {
      console.error(
        `Failed to decrypt message with id '${params.messageId}':`,
        error
      );
      return null;
    }
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
  const subscriptionManager = new FirestoreSubscriptionManager();

  const messagesStore = new MessagesStore(state, setState, cryptoService);

  createEffect(() => {
    const userIp = userStore.ip;
    if (userStore.loading || userIp === null) return;
    if (roomsStore.loading) return;

    const currentRoomIds = new Set(roomsStore.rooms.map((r) => r.id));
    const subscribedRoomIds = new Set(subscriptionManager.keys);

    // * Unsubscribe from rooms that no longer exist
    subscribedRoomIds.forEach((roomId) => {
      if (!currentRoomIds.has(roomId)) {
        subscriptionManager.unsubscribe(roomId);
        // * Delete keys by reconstructing the objects without those keys
        setState('messagesByRoom', (prev) => {
          const { [roomId]: _, ...rest } = prev;
          return rest;
        });
        setState('loadingByRoom', (prev) => {
          const { [roomId]: _, ...rest } = prev;
          return rest;
        });
        setState('errorsByRoom', (prev) => {
          const { [roomId]: _, ...rest } = prev;
          return rest;
        });
      }
    });

    // * Subscribe to new rooms
    currentRoomIds.forEach((roomId) => {
      if (!subscriptionManager.has(roomId)) {
        setState('messagesByRoom', roomId, []);
        setState('loadingByRoom', roomId, true);
        setState('errorsByRoom', roomId, null);

        const onUpsert = (messages: MessageData[]) => {
          setState('loadingByRoom', roomId, false);
          setState('messagesByRoom', roomId, (prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMessages = messages.filter((m) => !existingIds.has(m.id));
            return [...prev, ...newMessages].sort(
              (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
            );
          });
        };

        const onRemove = (messageIds: string[]) => {
          setState('messagesByRoom', roomId, (prev) => {
            const existing = prev ?? [];
            return existing.filter((m) => !messageIds.includes(m.id));
          });
        };

        const onError = (error: string) => {
          setState('errorsByRoom', roomId, error);
          setState('loadingByRoom', roomId, false);
          subscriptionManager.unsubscribe(roomId);
        };

        subscriptionManager.subscribe(
          roomId,
          messageRepo.subscribeToMessages({
            ip: userIp,
            roomId: roomId,
            onUpsert,
            onRemove,
            onError,
          })
        );
      }
    });
  });

  onCleanup(() => {
    subscriptionManager.clear();
    cryptoService.destroy();
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
