import { Component } from 'solid-js';

import { Info } from '@/lib/icons';
import styles from './shared.module.css';

const EmptyInfoState: Component = () => {
  return <></>;
};

export const InfoSidebar: Component<{ isOpen: boolean }> = (props) => {
  return (
    <div
      class={`${styles.sidebar} ${styles.infoSidebar}`}
      classList={{
        [styles.open]: props.isOpen,
      }}>
      <div class={styles.header}>
        <Info class={styles.logo} size={20} strokeWidth={2} />
        <h2>Room Info</h2>
      </div>
    </div>
  );
};
