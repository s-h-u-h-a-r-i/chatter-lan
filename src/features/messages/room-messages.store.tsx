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

import { useCryptoService } from '@/core/crypto';
import { useRoomsStore } from '../rooms';
import { useUserStore } from '../user';
import { encryptMessageContent } from './message.crypto';
import * as messageRepo from './message.repository';
import { MessageData } from './schemas';

// =====================================================================
// Types
// =====================================================================

type PendingMessageStatus = 'sending' | 'failed';

type PendingMessage = {
  id: string;
  createdAt: Date;
  senderId: string;
  senderName: string;
  plainText: string;
  status: PendingMessageStatus;
};

export type RoomMessage = MessageData | PendingMessage;

interface RoomMessagesStore {
  messages: Accessor<RoomMessage[]>;
  error: Accessor<string | null>;
  sendMessage(plainText: string): Promise<void>;
}

const RoomMessagesStoreContext = createContext<RoomMessagesStore>();

// =====================================================================
// Provider Component
// =====================================================================

export const RoomMessagesStoreProvider: ParentComponent = (props) => {
  const userStore = useUserStore();
  const roomsStore = useRoomsStore();
  const cryptoService = useCryptoService();

  const [messages, setMessages] = createSignal<RoomMessage[]>([]);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    const roomId = roomsStore.selectedRoomId();
    const ip = userStore.ip();

    setMessages([]);
    setError(null);

    if (!roomId) {
      return;
    }

    const unsubscribe = messageRepo.subscribeToMessages({
      ip,
      roomId,
      onUpsert(incoming) {
        setMessages((prev) => _upsertConfirmedMessages(prev, incoming));
      },
      onRemove(ids) {
        setMessages((prev) => prev.filter((message) => !ids.includes(message.id)));
      },
      onError(err) {
        setError(err);
      },
    });

    onCleanup(() => {
      unsubscribe();
      setMessages([]);
      setError(null);
    });
  });

  const sendMessage = async (plainText: string): Promise<void> => {
    const room = roomsStore.selectedRoom();
    if (!room) {
      setError('No room selected');
      return;
    }

    const ip = userStore.ip();
    const roomId = room.id;
    const senderId = userStore.uid();
    const senderName = userStore.name();
    const messageId = crypto.randomUUID();

    setMessages((prev) =>
      _sortMessagesByCreatedAt([
        ...prev,
        {
      id: messageId,
      createdAt: new Date(),
      senderId,
      senderName,
      plainText,
      status: 'sending',
        },
      ]),
    );

    try {
      const encryptedContent = await encryptMessageContent({
        roomId,
        cryptoService,
        plainText,
      });

      if (!encryptedContent) {
        throw new Error('Failed to encrypt message');
      }

      await messageRepo.createMessage(ip, roomId, messageId, {
        encryptedContent,
        senderId,
        senderName,
      });

      await messageRepo.waitForMessageConfirmation({
        ip,
        roomId,
        messageId,
        timeoutMs: 10_000,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      setMessages((prev) =>
        prev.map((entry) =>
          entry.id === messageId && entry.status !== 'confirmed'
            ? { ...entry, status: 'failed' as const }
            : entry,
        ),
      );
      console.error('Failed to send message', err);
    }
  };

  const context: RoomMessagesStore = {
    messages,
    error,
    sendMessage,
  };

  return (
    <RoomMessagesStoreContext.Provider value={context}>
      {props.children}
    </RoomMessagesStoreContext.Provider>
  );
};

export function useRoomMessagesStore() {
  const context = useContext(RoomMessagesStoreContext);
  if (!context) {
    throw new Error(
      'useRoomMessagesStore must be used within a RoomMessagesStoreProvider',
    );
  }
  return context;
}

// =====================================================================
// Helpers
// =====================================================================

function _upsertConfirmedMessages(
  prev: RoomMessage[],
  incoming: MessageData[],
): RoomMessage[] {
  const map = new Map(prev.map((m) => [m.id, m]));
  incoming.forEach((m) => {
    map.set(m.id, m);
  });
  return _sortMessagesByCreatedAt([...map.values()]);
}

function _sortMessagesByCreatedAt(messages: RoomMessage[]): RoomMessage[] {
  return messages.sort((a, b) => {
    const diff = a.createdAt.getTime() - b.createdAt.getTime();
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}
