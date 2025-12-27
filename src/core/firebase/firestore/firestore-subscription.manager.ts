import { Unsubscribe } from 'firebase/firestore';

export class FirestoreSubscriptionManager {
  #subscriptions = new Map<string, Unsubscribe>();

  get keys(): string[] {
    return Array.from(this.#subscriptions.keys());
  }

  get size(): number {
    return this.#subscriptions.size;
  }

  has(key: string): boolean {
    return this.#subscriptions.has(key);
  }

  subscribe(key: string, unsubscribe: Unsubscribe): void {
    this.unsubscribe(key);
    this.#subscriptions.set(key, unsubscribe);
  }

  unsubscribe(key: string): void {
    const unsubscribe = this.#subscriptions.get(key);
    if (!unsubscribe) return;
    unsubscribe();
    this.#subscriptions.delete(key);
  }

  unsubscribeMany(keys: string[]): void {
    keys.forEach((key) => this.unsubscribe(key));
  }

  clear(): void {
    this.#subscriptions.forEach((unsubscribe) => unsubscribe());
    this.#subscriptions.clear();
  }
}
