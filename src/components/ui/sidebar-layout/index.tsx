import { Component, JSX } from 'solid-js';

import styles from './index.module.css';

export const SidebarLayout: Component<{
  children: JSX.Element;
  location: 'left' | 'right';
  isOpen: boolean;
  header: JSX.Element;
}> = (props) => {
  return (
    <aside
      class={`${styles.sidebar} ${styles[props.location]}`}
      classList={{ [styles.open]: props.isOpen }}>
      <header class={styles.header}>{props.header}</header>

      {props.children}
    </aside>
  );
};
