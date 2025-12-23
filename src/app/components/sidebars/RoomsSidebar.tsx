import { Component } from 'solid-js';

import styles from './shared.module.css';

export const RoomsSidebar: Component = () => {
  return <div class={`${styles.sidebar} ${styles.roomsSidebar}`}></div>;
};
