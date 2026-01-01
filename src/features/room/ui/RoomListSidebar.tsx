import { Component, createMemo, createSignal, For } from 'solid-js';

import { BookUser, Hash, Plus } from '@/ui/icons';
import { SearchInput } from '@/ui/inputs';
import { SidebarLayout } from '@/ui/layouts';
import { useRoomsStore } from '../rooms.store';
import { CreateRoomModal } from './CreateRoomModal';
import styles from './RoomListSidebar.module.css';

const Header: Component<{ setSearchTerm(searchTerm: string): void }> = (
  props
) => (
  <>
    <div class={styles.header}>
      <BookUser class={styles.logo} size={28} strokeWidth={2} />
      <h2>Rooms</h2>
    </div>
    <SearchInput
      name="room-search"
      placeholder="Search rooms..."
      onSearch={(value) => props.setSearchTerm(value.toLowerCase())}
    />
  </>
);

export const RoomsListSidebar: Component<{ isOpen: boolean }> = (props) => {
  const roomsStore = useRoomsStore();

  const [searchTerm, setSearchTerm] = createSignal('');
  const [isCreateModalOpen, setIsCreateModalOpen] = createSignal(false);

  const filteredRooms = createMemo(() => {
    return roomsStore.rooms().filter((r) => {
      return r.name.toLowerCase().includes(searchTerm());
    });
  });

  return (
    <>
      <SidebarLayout
        location="left"
        isOpen={props.isOpen}
        header={<Header setSearchTerm={setSearchTerm} />}>
        <div class={styles.createButtonContainer}>
          <button
            class={styles.createButton}
            onClick={() => setIsCreateModalOpen(true)}>
            <Plus class={styles.createbuttonIcon} size={18} strokeWidth={2.5} />
            <span>Create Room</span>
          </button>
        </div>
        <div class={styles.roomList}>
          <For each={filteredRooms()}>
            {(room) => (
              <button
                class={styles.roomItem}
                classList={{
                  [styles.active]: room.id === roomsStore.selectedRoom()?.id,
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
      <CreateRoomModal
        isOpen={isCreateModalOpen()}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};
