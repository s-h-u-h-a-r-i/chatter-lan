import { TextInput } from '@/ui/inputs';
import { Component, createEffect, createSignal, Show } from 'solid-js';
import { RoomData } from '../schemas';
import styles from './PassphrasePrompt.module.css';

type FormSubmitEvent = SubmitEvent & {
  currentTarget: HTMLFormElement;
  target: Element;
};

export const RoomPassphrasePrompt: Component<{
  room: RoomData;
  isSubmitting: boolean;
  error: string | null;
  onSubmit(passphrase: string): Promise<void>;
  onCancel(): void;
}> = (props) => {
  const [passphrase, setPassphrase] = createSignal('');

  let passphraseInputRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (!props.error) return;
    queueMicrotask(() => {
      passphraseInputRef?.focus();
    });
  });

  const handleSubmit = async (e: FormSubmitEvent) => {
    e.preventDefault();

    try {
      await props.onSubmit(passphrase());
      setPassphrase('');
    } catch {
      // Error state is controlled by the store.
    }
  };

  const handleCancel = () => {
    setPassphrase('');
    props.onCancel();
  };

  return (
    <form onSubmit={handleSubmit} class={styles.form}>
      <h2 class={styles.title}>Enter passphrase</h2>
      <div class={styles.formGroup}>
        <TextInput
          ref={passphraseInputRef}
          id="passphrase"
          name="passphrase"
          placeholder={`Passphrase for "${props.room.name}"`}
          value={passphrase()}
          onInput={setPassphrase}
          disabled={props.isSubmitting}
          hideText
        />
      </div>
      <Show when={props.error}>
        <div class={styles.error}>{props.error}</div>
      </Show>
      <div class={styles.actions}>
        <button
          type="button"
          class={styles.cancelButton}
          onClick={handleCancel}
          disabled={props.isSubmitting}>
          Cancel
        </button>
        <button
          type="submit"
          class={styles.submitButton}
          disabled={props.isSubmitting || !passphrase()}>
          {props.isSubmitting ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    </form>
  );
};
