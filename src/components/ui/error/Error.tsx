import { type Component } from "solid-js";

import styles from "./Error.module.css";

const ErrorMessage: Component<{ message: string }> = (props) => (
  <div class={styles.container}>
    <div class={styles.icon}>⚠️</div>
    <h1 class={styles.title}>Error</h1>
    <p class={styles.message}>{props.message}</p>
  </div>
);

export default ErrorMessage;
