import { Component } from 'solid-js';

import styles from './Sidebars.module.css';

export const LeftSidebar: Component = () => {
  return (
    <>
      <div class={styles.section}>
        <h3 class={styles.title}>Rooms</h3>
      </div>
    </>
  );
};
