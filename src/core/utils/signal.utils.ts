import { Accessor } from 'solid-js';

export function required<T>(
  signal: Accessor<T | undefined>,
  name: string
): Accessor<T> {
  return () => {
    const value = signal();
    if (value === undefined) throw new Error(`${name} not initialized`);
    return value;
  };
}
