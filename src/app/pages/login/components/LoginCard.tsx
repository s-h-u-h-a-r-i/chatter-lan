import { Component, createSignal, onMount } from 'solid-js';

import styles from './LoginCard.module.css';

interface LoginCardProps {
  username: string | null;
  saveUsername(newName: string): void;
}

const LoginCard: Component<LoginCardProps> = (props) => {
  const [input, setInput] = createSignal<string>('');

  onMount(() => {
    setInput(props.username ?? '');
  });

  const saveUsername = (e: Event) => {
    e.preventDefault();

    const newUsername = input();
    const trimmed = newUsername;
    if (trimmed) {
      props.saveUsername(trimmed);
    }
  };

  return (
    <div class={styles.card}>
      <h1 class={styles.title}>Enter Username</h1>
      <input
        type="text"
        name="username"
        aria-label="Username"
        placeholder="Enter any username..."
        class={styles.input}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            saveUsername(e);
          }
        }}
      />
      <button
        type="button"
        class={`${styles.button} btn btn-primary`}
        onClick={saveUsername}>
        Save
      </button>
    </div>
  );
};

export { LoginCard };
