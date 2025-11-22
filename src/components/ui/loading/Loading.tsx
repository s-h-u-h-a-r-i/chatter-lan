import { Component } from "solid-js";

import styles from "./Loading.module.css";

const Loading: Component<{ message: string }> = (props: {
  message: string;
}) => {
  return (
    <div class={styles.container}>
      <div class={styles.spinner}></div>
      <p class={styles.messaeg}>{props.message}</p>
    </div>
  );
};

export default Loading;
