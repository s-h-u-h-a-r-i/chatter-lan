import {
  Accessor,
  createContext,
  createEffect,
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

interface RoomMessagesStore {
  messages: Accessor<MessageData[]>;
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

  const [messages, setMessages] = createSignal<MessageData[]>([]);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    const roomId = roomsStore.selectedRoomId();
    const ip = userStore.ip();

    if (!roomId) return;

    const unsubscribe = messageRepo.subscribeToMessages({
      ip,
      roomId,
      onUpsert(incoming) {
        setMessages((prev) => _mergeMessages(prev, incoming));
      },
      onRemove(ids) {
        setMessages((prev) => prev.filter((msg) => !ids.includes(msg.id)));
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
      throw new Error('No room selected');
    }

    const encryptedContent = await encryptMessageContent({
      roomId: room.id,
      cryptoService,
      plainText,
    });

    if (!encryptedContent) {
      throw new Error('Failed to encrypt message');
    }

    await messageRepo.createMessage(userStore.ip(), room.id, {
      encryptedContent,
      senderId: userStore.uid(),
      senderName: userStore.name(),
    });
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

function _mergeMessages(
  prev: MessageData[],
  incoming: MessageData[],
): MessageData[] {
  const map = new Map(prev.map((m) => [m.id, m]));
  incoming.forEach((m) => {
    map.set(m.id, m);
  });
  // Sort messages in ascending order by creation time (oldest first)
  return [...map.values()].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
}
