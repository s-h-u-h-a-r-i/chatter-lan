import { Component } from 'solid-js';

import styles from './Sidebars.module.css';

export const RightSidebar: Component = () => {
  return (
    <>
      <div class={styles.section}>
        <h3 class={styles.title}>More Info</h3>
      </div>
    </>
  );
};
