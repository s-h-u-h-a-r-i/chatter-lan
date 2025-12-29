import {
  Component,
  createEffect,
  JSX,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';

import styles from './Modal.module.css';

export const Modal: Component<{
  isOpen: boolean;
  onClose(): void;
  children: JSX.Element;
  title?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}> = (props) => {
  let modalRef: HTMLDivElement | undefined;
  let overlayRef: HTMLDivElement | undefined;

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

  createEffect(() => {
    if (!props.isOpen || !modalRef) return;
    requestAnimationFrame(() => {
      const autoFocusElement = modalRef.querySelector(
        '[autofocus]'
      ) as HTMLElement;

      if (autoFocusElement) {
        autoFocusElement.focus();
        return;
      }

      const firstInput = modalRef.querySelector(
        'input:not([type="hidden"]), textarea, select'
      ) as HTMLDivElement;

      if (firstInput) {
        firstInput.focus();
        return;
      }

      const firstFocusable = modalRef.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusable) {
        firstFocusable.focus();
        return;
      }

      modalRef.focus();
    });
  });

  return (
    <Show when={props.isOpen}>
      <div
        ref={overlayRef}
        class={styles.overlay}
        onClick={handleOverlayClick}
        role="presentation"
        tabindex="-1"
        data-modal-overlay>
        <div
          ref={modalRef}
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
