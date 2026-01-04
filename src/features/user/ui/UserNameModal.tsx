import { Component, createMemo, createSignal, Show } from 'solid-js';

import { TextInput } from '@/ui/inputs';
import { Modal } from '@/ui/modal';
import styles from './UserNameModal.module.css';

type FormSubmitEvent = SubmitEvent & {
  currentTarget: HTMLFormElement;
  target: Element;
};

export const UserNameModal: Component<{
  isOpen: boolean;
  currentName: string | null;
  onSubmit(name: string): void;
}> = (props) => {
  const [name, setName] = createSignal(props.currentName ?? '');
  const [error, setError] = createSignal<string | null>(null);

  const trimmedName = createMemo(() => name().trim());
  const submitBtnDisabled = createMemo(
    () => trimmedName().length < 2 || trimmedName().length > 50
  );

  let nameInputRef: HTMLInputElement | undefined;

  const handleSubmit = (e: FormSubmitEvent) => {
    e.preventDefault();
    const name = trimmedName();

    if (!name) {
      setError('Username is required');
      return;
    }

    if (name.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    if (name.length > 50) {
      setError('Username must be less than 50 characters');
      return;
    }

    props.onSubmit(name);
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={() => {}}
      title="Set Your Username"
      closeOnOverlayClick={false}
      closeOnEscape={false}>
      <form onSubmit={handleSubmit} class={styles.form}>
        <div class={styles.formGroup}>
          <label for="username" class={styles.label}>
            Username
          </label>
          <TextInput
            ref={nameInputRef}
            id="username"
            name="username"
            placeholder="Enter your username..."
            value={name()}
            onInput={(value) => {
              setName(value);
              setError(null);
            }}
            hasError={!!error()}
          />
        </div>
        <Show when={error()}>
          <div class={styles.error}>{error()}</div>
        </Show>
        <div class={styles.actions}>
          <button
            type="submit"
            class={styles.submitButton}
            disabled={submitBtnDisabled()}>
            Continue
          </button>
        </div>
      </form>
    </Modal>
  );
};
