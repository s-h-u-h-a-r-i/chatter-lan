import { Component, createMemo, For, Show } from 'solid-js';

import { useRoomsStore } from '@/features/room';
import { useUserStore } from '@/features/user';
import { Info, Menu, MessageCircle } from '@/ui/icons';
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
      <Show when={roomsStore.selectedRoom()} fallback={<_EmptyState />}>
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
                  <div
                    class={styles.message}
                    classList={{
                      [styles.ownMessage]: message.senderId === userStore.uid(),
                    }}>
                    <Show when={message.senderId !== userStore.uid()}>
                      <div class={styles.avatar}>
                        {message.senderName.charAt(0).toUpperCase()}
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </>
        )}
      </Show>
    </div>
  );
};

const _EmptyState: Component = (props) => (
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
