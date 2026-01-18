import {
  Component,
  createMemo,
  createResource,
  For,
  Show,
  Suspense,
} from 'solid-js';

import { useCryptoService } from '@/core/crypto';
import { useRoomsStore } from '@/features/room';
import { RoomData } from '@/features/room/room.types';
import { useUserStore } from '@/features/user';
import { Info, Menu, MessageCircle } from '@/ui/icons';
import { decryptMessageContent } from '../message.crypto';
import { MessageData } from '../message.types';
import { useMessagesStore } from '../messages.store';
import styles from './ChatArea.module.css';

export const ChatArea: Component<{
  onToggleRoomsSidebar(): void;
  onToggleInfoSidebar(): void;
}> = (props) => {
  const roomsStore = useRoomsStore();
  const messagesStore = useMessagesStore();
  const userStore = useUserStore();
  const cryptoService = useCryptoService();

  const placeHolderMessages = createMemo(() => {
    const userId = userStore.uid();
    return Array.from({ length: 20 }, (_, index) => {
      const isUser = index % 2 === 0;
      return {
        id: index.toString(),
        encryptedContent: {
          ciphertext: `test ${index}`,
          iv: 'whatever',
        },
        createdAt: new Date(),
        senderId: isUser ? userId : '456',
        senderName: isUser ? 'You' : 'Other',
      } satisfies MessageData;
    });
  });

  return (
    <div class={styles.container}>
      <Show when={roomsStore.selectedRoom()} fallback={<EmptyState />}>
        {(room) => (
          <>
            <div class={styles.header}>
              <button
                class={styles.toggleButton}
                onClick={props.onToggleRoomsSidebar}
                aria-label="Open rooms menu">
                <Menu size={20} strokeWidth={2} />
              </button>
              <div class={styles.headerContent}>
                <div class={styles.roomIcon}>
                  <MessageCircle size={20} strokeWidth={2} />
                </div>
                <h2 class={styles.roomName}>{room().name}</h2>
              </div>
              <button
                class={styles.toggleButton}
                onClick={props.onToggleInfoSidebar}
                aria-label="Show room info">
                <Info size={20} strokeWidth={2} />
              </button>
            </div>

            <div class={styles.messagesArea}>
              <For each={placeHolderMessages()}>
                {/* <For each={messagesStore.messages(room().id)}> */}
                {(message) => (
                  <Message
                    room={room()}
                    message={message}
                    uid={userStore.uid()}
                  />
                )}
              </For>
            </div>
          </>
        )}
      </Show>
    </div>
  );
};

const Message: Component<{
  message: MessageData;
  room: RoomData;
  uid: string;
}> = (props) => {
  const cryptoService = useCryptoService();

  const [decryptedContent] = createResource(
    () => ({
      roomId: props.room.id,
      cryptoService: cryptoService,
      encryptedContent: props.message.encryptedContent,
      roomSalt: props.room.salt,
    }),
    (params) => decryptMessageContent(params)
  );

  return (
    <div
      class={styles.message}
      classList={{
        [styles.ownMessage]: props.message.senderId === props.uid,
      }}>
      <Show when={props.message.senderId !== props.uid}>
        <div class={styles.avatar}>
          {props.message.senderName.charAt(0).toUpperCase()}
        </div>
      </Show>
      <div class={styles.messageContent}>
        <Show when={props.message.senderId !== props.uid}>
          <div class={styles.sender}>{props.message.senderName}</div>
        </Show>
        <div class={styles.messageBubble}>
          <div class={styles.messageText}>
            <Suspense fallback={<span>...</span>}>
              {/* {decryptedContent()} */}
              {props.message.encryptedContent.ciphertext}
            </Suspense>
          </div>
          <div class={styles.timestamp}>
            {props.message.createdAt.toLocaleDateString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState: Component = (props) => (
  <div class={styles.emptyState}>
    <div class={styles.emptyIcon}>
      <MessageCircle size={64} strokeWidth={1.5} />
    </div>
    <h3>Welcome to Chatter-Lan</h3>
    <p>
      Choose a room from the sidebar to start chatting or create your own room
    </p>
  </div>
);
