import { Component } from 'solid-js';

import styles from './TextInput.module.css';

export const TextInput: Component<{
  id?: string;
  name: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  hideText?: boolean;
  class?: string;
  ref?: HTMLInputElement | ((el: HTMLInputElement) => void) | undefined;
  onInput?(value: string): void;
  onBlur?(value: string): void;
}> = (props) => {
  const onInput = props.onInput;
  const onBlur = props.onBlur;

  return (
    <input
      ref={props.ref}
      id={props.id}
      type={props.hideText ? 'password' : 'text'}
      name={props.name}
      class={`${styles.input} ${props.class ? props.class : ''}`}
      classList={{
        [styles.error]: props.hasError,
      }}
      placeholder={props.placeholder}
      disabled={props.disabled ?? false}
      value={props.value ?? ''}
      onInput={onInput ? (e) => onInput(e.currentTarget.value) : undefined}
      onBlur={onBlur ? (e) => onBlur(e.currentTarget.value) : undefined}
    />
  );
};
