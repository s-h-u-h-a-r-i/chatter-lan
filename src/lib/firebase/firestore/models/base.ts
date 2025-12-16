import { DocumentSnapshot } from 'firebase/firestore';

export abstract class FirestoreDocument<T> {
  #snapshot: DocumentSnapshot;

  abstract readonly data: T;

  constructor(snapshot: DocumentSnapshot) {
    this.#snapshot = snapshot;
  }

  get id(): string {
    return this.#snapshot.id;
  }

  update() {}
}
