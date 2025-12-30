import { Component, createSignal, Show } from 'solid-js';

import { Modal } from '@/ui/modal';
import { useRoomsStore } from '../rooms.store';
import styles from './CreateRoomModal.module.css';

type FormSubmitEvent = SubmitEvent & {
  currentTarget: HTMLFormElement;
  target: Element;
};

export const CreateRoomModal: Component<{
  isOpen: boolean;
  onClose(): void;
}> = (props) => {
  const roomsStore = useRoomsStore();

  const [roomName, setRoomName] = createSignal('');
  const [passphrase, setPassphrase] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const handleSubmit = async (e: FormSubmitEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const name = roomName().trim();
    const pp = passphrase();

    if (!name) {
      setError('Room name is required');
      setIsSubmitting(false);
      return;
    }

    if (!pp) {
      setError('Passphrase is required');
      setIsSubmitting(false);
      return;
    }

    try {
      await roomsStore.createRoom(name, pp);
      setRoomName('');
      setPassphrase('');
      props.onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create room. Please try again.'
      );
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setRoomName('');
    setPassphrase('');
    setError(null);
    props.onClose();
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="Create New Room"
      closeOnOverlayClick={true}
      closeOnEscape={true}>
      <form onSubmit={handleSubmit} class={styles.form}>
        <div class={styles.formGroup}>
          <label for="room-name" class={styles.label}>
            Room Name
          </label>
          <input
            id="room-name"
            type="text"
            name="room-name"
            placeholder="Enter room name..."
            class={styles.input}
            value={roomName()}
            onInput={(e) => setRoomName(e.currentTarget.value)}
            disabled={isSubmitting()}
          />
        </div>
        <div class={styles.formGroup}>
          <label for="passphrase" class={styles.label}>
            Passphrase
          </label>
          <input
            type="password"
            name="passphrase"
            id="passphrase"
            placeholder="Enter passphrase..."
            class={styles.input}
            value={passphrase()}
            onInput={(e) => setPassphrase(e.currentTarget.value)}
            disabled={isSubmitting()}
          />
        </div>
        <Show when={error()}>
          <div class={styles.error}>{error()}</div>
        </Show>
        <div class={styles.actions}>
          <button
            type="button"
            class={styles.cancelButton}
            onClick={handleClose}
            disabled={isSubmitting()}>
            Cancel
          </button>
          <button
            type="submit"
            class={styles.submitButton}
            disabled={isSubmitting() || !roomName().trim()}>
            {isSubmitting() ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
