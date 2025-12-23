import { Component } from 'solid-js';

import styles from './App.module.css';
import { InfoSidebar, RoomsSidebar } from './components';

const App: Component = (props) => {
  return (
    <div class={styles.app}>
      <RoomsSidebar />
      <InfoSidebar />
    </div>
  );
};

export default App;
