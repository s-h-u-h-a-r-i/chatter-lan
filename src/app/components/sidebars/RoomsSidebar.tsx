import { BookUser } from 'lucide-solid';
import { Component } from 'solid-js';

import { BookUser, Search } from '@/lib/icons';
import styles from './shared.module.css';

export const RoomsSidebar: Component<{ isOpen: boolean }> = (props) => {
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
      </div>
    </div>
  );
};
