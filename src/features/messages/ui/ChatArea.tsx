import {
  Component,
  createMemo,
  createResource,
  createSignal,
  For,
  Show,
  Suspense,
} from 'solid-js';

import { useCryptoService } from '@/core/crypto';
import { RoomData, useRoomsStore } from '@/features/rooms';
import { useUserStore } from '@/features/user';
import { Info, Menu, MessageCircle, Send } from '@/ui/icons';
import { TextInput } from '@/ui/inputs';
import { decryptMessageContent } from '../message.crypto';
import { RoomMessage, useRoomMessagesStore } from '../room-messages.store';
import { MessageData } from '../schemas';
import styles from './ChatArea.module.css';

type FormSubmitEvent = SubmitEvent & {
  currentTarget: HTMLFormElement;
  target: Element;
};

export const ChatArea: Component<{
  onToggleRoomsSidebar(): void;
  onToggleInfoSidebar(): void;
}> = (props) => {
  const roomsStore = useRoomsStore();
  const userStore = useUserStore();
  const roomMessagesStore = useRoomMessagesStore();

  const [inputValue, setInputValue] = createSignal('');

  const trimmedInputValue = createMemo(() => inputValue().trim());

  let inputRef: HTMLInputElement | undefined;

  const handleSubmit = async (e: FormSubmitEvent) => {
    e.preventDefault();
    const trimmed = trimmedInputValue();
    if (!trimmed) return;
    setInputValue('');
    await roomMessagesStore.sendMessage(trimmed);
  };

  return (
    <div class={styles.container}>
      <Show when={roomsStore.selectedRoom()}>
        {(room) => (
          <>
            <div class={styles.header}>
              <button
                type="button"
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
                type="button"
                class={styles.toggleButton}
                onClick={props.onToggleInfoSidebar}
                aria-label="Show room info">
                <Info size={20} strokeWidth={2} />
              </button>
            </div>

            <div class={styles.messagesArea}>
              <Show when={roomMessagesStore.error()}>
                {(error) => <div class={styles.error}>Error: {error()}</div>}
              </Show>

              <Show
                when={roomMessagesStore.messages().length > 0}
                fallback={<_EmptyRoomState roomName={room().name} />}>
                <For each={roomMessagesStore.messages()}>
                  {(message) => (
                    <Message
                      room={room()}
                      message={message}
                      uid={userStore.uid()}
                    />
                  )}
                </For>
              </Show>
            </div>

            <form class={styles.inputArea} onSubmit={handleSubmit}>
              <TextInput
                ref={inputRef}
                name="chat-message"
                value={inputValue()}
                placeholder="Type your message…"
                disabled={false}
                hasError={false}
                onInput={setInputValue}
              />
              <button
                type="submit"
                title="Send message"
                class={styles.sendButton}
                disabled={!trimmedInputValue()}>
                <Send size={18} strokeWidth={2} />
              </button>
            </form>
          </>
        )}
      </Show>
    </div>
  );
};

const Message: Component<{
  message: RoomMessage;
  room: RoomData;
  uid: string;
}> = (props) => {
  return (
    <div
      class={styles.message}
      classList={{
        [styles.ownMessage]: props.message.senderId === props.uid,
        [styles.messageEnter]: props.message.status === 'sending',
        [styles.pendingMessage]: props.message.status === 'sending',
        [styles.failedMessage]: props.message.status === 'failed',
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
            {props.message.status === 'confirmed' ? (
              <_ConfirmedMessageText
                message={props.message}
                roomId={props.room.id}
                roomSalt={props.room.salt}
              />
            ) : (
              props.message.plainText
            )}
          </div>
          <div class={styles.timestamp}>
            {props.message.createdAt.toLocaleDateString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            <Show when={props.message.status === 'sending'}>
              <span class={styles.messageStatus}> • Sending...</span>
            </Show>
            <Show when={props.message.status === 'failed'}>
              <span class={styles.messageStatus}> • Failed to send</span>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

const _ConfirmedMessageText: Component<{
  message: MessageData;
  roomId: string;
  roomSalt: string;
}> = (props) => {
  const cryptoService = useCryptoService();
  const [decryptedContent] = createResource(
    () => ({
      roomId: props.roomId,
      cryptoService,
      encryptedContent: props.message.encryptedContent,
      roomSalt: props.roomSalt,
    }),
    (params) => decryptMessageContent(params),
  );

  return <Suspense fallback={<span>...</span>}>{decryptedContent()}</Suspense>;
};

const _EmptyRoomState: Component<{ roomName: string }> = (props) => (
  <div class={styles.emptyRoomState}>
    <div class={styles.emptyRoomIcon}>
      <MessageCircle size={40} strokeWidth={1.75} />
    </div>
    <h3 class={styles.emptyRoomTitle}>No messages yet</h3>
    <p class={styles.emptyRoomDescription}>
      Be the first to send a message in "{props.roomName}".
    </p>
  </div>
);
