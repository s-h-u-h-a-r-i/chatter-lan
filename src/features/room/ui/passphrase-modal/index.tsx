import { Component, createSignal } from 'solid-js';

import { cryptoService } from '@/core/crypto';
import { Modal } from '@/ui/modal';
import styles from './index.module.css';

type FormSubmitEvent = SubmitEvent & {
  currentTarget: HTMLFormElement;
  target: Element;
};

export const RoomPassphraseModal: Component<{
  isOpen: boolean;
  roomId: string;
  roomName: string;
  roomSalt: string;
  onSuccess(): void;
  onCancel(): void;
}> = (props) => {
  const [passphrase, setPassphrase] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const handleSubmit = async (e: FormSubmitEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const saltBytes = Uint8Array.from(atob(props.roomSalt), (c) =>
        c.charCodeAt(0)
      );
      await cryptoService.init(props.roomId, passphrase(), saltBytes);
      props.onSuccess();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to initialize room. Please check your passphrase.'
      );
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
      title={`Enter passphrase for ${props.roomName}`}
      closeOnOverlayClick={false}
      closeOnEscape={true}>
      <form onSubmit={handleSubmit} class={styles.form}></form>
    </Modal>
  );
};
