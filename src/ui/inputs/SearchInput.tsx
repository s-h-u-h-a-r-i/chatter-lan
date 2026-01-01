import { debounce } from '@solid-primitives/scheduled';
import { Component } from 'solid-js';

import { Search } from '@/ui/icons';
import styles from './SearchInput.module.css';

export const SearchInput: Component<{
  name: string;
  placeholder?: string;
  class?: string;
  onSearch?(value: string): void;
  debounceWait?: number;
}> = (props) => {
  const debouncedSearch = debounce((value: string) => {
    props.onSearch?.(value.trim());
  }, props.debounceWait ?? 0);

  const onSearch = props.onSearch;

  return (
    <div class={`${styles.container} ${props.class ? props.class : ''}`}>
      <Search class={styles.icon} size={16} />
      <input
        type="text"
        name={props.name}
        placeholder={props.placeholder}
        class={styles.input}
        onInput={
          onSearch ? (e) => debouncedSearch(e.currentTarget.value) : undefined
        }
      />
    </div>
  );
};
