import { Component, createMemo, createSignal, For } from 'solid-js';

import { BookUser, Hash, Search } from '@/ui/icons';
import { SidebarLayout } from '@/ui/layouts';
import { debounce } from '@solid-primitives/scheduled';
import { useRoomsStore } from '../../rooms.store';
import styles from './index.module.css';

const Header: Component<{ setSearchTerm(searchTerm: string): void }> = (
  props
) => {
  const debouncedSearch = debounce((value: string) => {
    props.setSearchTerm(value.trim().toLowerCase());
  }, 250);

  return (
    <>
      <div class={styles.header}>
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
          onInput={(e) => debouncedSearch(e.currentTarget.value)}
        />
      </div>
    </>
  );
};

export const RoomsSidebar: Component<{ isOpen: boolean }> = (props) => {
  const [searchTerm, setSearchTerm] = createSignal('');
  const roomsStore = useRoomsStore();

  const filteredRooms = createMemo(() => {
    return roomsStore.rooms.filter((r) => {
      return r.name.toLowerCase().includes(searchTerm());
    });
  });

  return (
    <SidebarLayout
      location="left"
      isOpen={props.isOpen}
      header={<Header setSearchTerm={setSearchTerm} />}>
      <div class={styles.roomList}>
        <For each={filteredRooms()}>
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
                {/* <div class={styles.roomLastMessage}>{room.lastMessage}</div> */}
              </div>
              {/* <Show when={room.unreadCount > 0}>
                <div class={styles.unreadBadge}>{room.unreadCount}</div>
              </Show> */}
            </button>
          )}
        </For>
      </div>
    </SidebarLayout>
  );
};
