import { type Component, createSignal, onMount } from "solid-js";

import { userStore } from "@/stores/user";
import styles from "./UserNameInput.module.css";

const UserNameInput: Component = () => {
  const [localInput, setLocalInput] = createSignal<string>("");

  onMount(() => {
    setLocalInput(userStore.userName ?? "");
  });

  const saveUserName = (e: Event): void => {
    e.preventDefault();

    const newUserName = localInput();
    if (newUserName.trim() !== "") {
      userStore.userName = newUserName;
    }
  };

  return (
    <div class={styles.container}>
      <h1 class={styles.title}>Enter Username</h1>
      <input
        type="text"
        class={styles.input}
        placeholder="Enter your username..."
        value={localInput()}
        onInput={(e) => setLocalInput(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            saveUserName(e);
          }
        }}
      />
      <button
        type="button"
        class={`${styles.button} btn btn-primary`}
        onClick={(e) => saveUserName(e)}>
        Save
      </button>
    </div>
  );
};

export default UserNameInput;
