import { Component, JSX, onCleanup, onMount, Show } from 'solid-js';

import styles from './Modal.module.css';

export const Modal: Component<{
  isOpen: boolean;
  onClose(): void;
  children: JSX.Element;
  title?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}> = (props) => {
  const handleOverlayClick = (e: MouseEvent) => {
    if (props.closeOnOverlayClick === false || e.target !== e.currentTarget) {
      return;
    }
    props.onClose();
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (props.closeOnEscape === false || e.key !== 'Escape' || !props.isOpen) {
      return;
    }
    props.onClose();
  };

  onMount(() => {
    document.addEventListener('keydown', handleEscape);
  });

  onCleanup(() => {
    document.removeEventListener('keydown', handleEscape);
  });

  return (
    <Show when={props.isOpen}>
      <div
        class={styles.overlay}
        onClick={handleOverlayClick}
        aria-hidden="true"
        role="presentation"
        tabindex="-1"
        data-modal-overlay>
        <div
          class={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={props.title ? 'modal-title' : undefined}
          tabindex="0"
          onClick={(e) => e.stopPropagation()}>
          <Show when={props.title}>
            <div class={styles.header}>
              <h2 class={styles.title} id="modal-title" tabindex="-1">
                {props.title}
              </h2>
            </div>
          </Show>
          <div class={styles.content}>{props.children}</div>
        </div>
      </div>
    </Show>
  );
};
