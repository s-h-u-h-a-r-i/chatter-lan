import { ParentComponent } from 'solid-js';

import { LeftSidebar, RightSidebar } from './components';
import styles from './index.module.css';

const Rooms: ParentComponent = (props) => {
  return (
    <>
      <aside class={`${styles.sidebar} ${styles.leftSidebar}`}>
        <LeftSidebar />
      </aside>
      <main class={styles.main}>{props.children}</main>
      <aside class={`${styles.sidebar} ${styles.rightSidebar}`}>
        <RightSidebar />
      </aside>
    </>
  );
};

export default Rooms;
