import { Component, For, Show } from 'solid-js';

import { BookUser, Hash, Search } from '@/lib/icons';
import { useRoomsStore } from '@/lib/rooms';
import styles from './shared.module.css';

export const RoomsSidebar: Component<{ isOpen: boolean }> = (props) => {
  const roomsStore = useRoomsStore();

  return (
    <div
      class={`${styles.sidebar} ${styles.roomsSidebar}`}
      classList={{
        [styles.open]: props.isOpen,
      }}>
      <div class={styles.header}>
        <div class={styles.headerContent}>
          <BookUser class={styles.logo} size={28} strokeWidth={2} />
          <h2>Rooms</h2>
        </div>
        <div class={styles.searchContainer}>
          <Search class={styles.searchIcon} size={16} />
          <input
            type="text"
            name="room-search"
            placeholder="Search rooms..."
            class={styles.searchInput}
          />
        </div>
      </div>
      <div class={styles.roomList}>
        <For each={roomsStore.rooms}>
          {(room) => (
            <button
              class={styles.roomItem}
              classList={{
                [styles.active]: room.id === roomsStore.selectedRoom?.id,
              }}
              onClick={() => roomsStore.setSelectedRoomId(room.id)}>
              <div class={styles.roomIcon}>
                <Hash size={18} strokeWidth={2.5} />
              </div>
              <div class={styles.roomContent}>
                <div class={styles.roomName}>{room.name}</div>
                <div class={styles.roomLastMessage}>{room.lastMessage}</div>
              </div>
              <Show when={room.unreadCount > 0}>
                <div class={styles.unreadBadge}>{room.unreadCount}</div>
              </Show>
            </button>
          )}
        </For>
      </div>
    </div>
  );
};
