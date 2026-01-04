import { Component, createSignal, Show } from 'solid-js';

import { useCryptoService } from '@/core/crypto';
import { TextInput } from '@/ui/inputs';
import { Modal } from '@/ui/modal';
import { RoomData } from '../room.types';
import styles from './PassphraseModal.module.css';

type FormSubmitEvent = SubmitEvent & {
  currentTarget: HTMLFormElement;
  target: Element;
};

export const RoomPassphraseModal: Component<{
  isOpen: boolean;
  room: RoomData;
  onSuccess(): void;
  onCancel(): void;
}> = (props) => {
  const cryptoService = useCryptoService();

  const [passphrase, setPassphrase] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  let passphraseInputRef: HTMLInputElement | undefined;

  const handleSubmit = async (e: FormSubmitEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const saltBytes = Uint8Array.from(atob(props.room.salt), (c) =>
        c.charCodeAt(0)
      );
      await cryptoService.init(props.room.id, passphrase(), saltBytes);

      await cryptoService.decrypt(props.room.id, {
        ciphertext: props.room.verificationToken,
        iv: props.room.verificationIV,
        salt: props.room.salt,
      });

      props.onSuccess();
    } catch (error) {
      await cryptoService.removeKey(props.room.id).catch(() => {});
      console.warn(error);
      setError('Failed to join room. Please check your passphrase.');
      queueMicrotask(() => {
        passphraseInputRef?.focus();
      });
    }

    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setPassphrase('');
    setError(null);
    props.onCancel();
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleCancel}
      title={`Enter passphrase for "${props.room.name}"`}
      closeOnOverlayClick={false}
      closeOnEscape={true}>
      <form onSubmit={handleSubmit} class={styles.form}>
        <div class={styles.formGroup}>
          <label for="passphrase" class={styles.label}>
            Passphrase
          </label>
          <TextInput
            ref={passphraseInputRef}
            id="passphrase"
            name="passphrase"
            placeholder="Enter passphrase..."
            value={passphrase()}
            onInput={setPassphrase}
            disabled={isSubmitting()}
            hideText
          />
        </div>
        <Show when={error()}>
          <div class={styles.error}>{error()}</div>
        </Show>
        <div class={styles.actions}>
          <button
            type="button"
            class={styles.cancelButton}
            onClick={handleCancel}
            disabled={isSubmitting()}>
            Cancel
          </button>
          <button
            type="submit"
            class={styles.submitButton}
            disabled={isSubmitting() || !passphrase()}>
            {isSubmitting() ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
