import { DocumentSnapshot } from "firebase/firestore";

export abstract class FirestoreDocument {
  constructor(public readonly snapshot: DocumentSnapshot) {}

  get id(): string {
    return this.snapshot.id;
  }

  get exists(): boolean {
    return this.snapshot.exists();
  }

  get isFromCache(): boolean {
    return this.snapshot.metadata.fromCache;
  }

  get hasPendingWrites(): boolean {
    return this.snapshot.metadata.hasPendingWrites;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      exists: this.exists,
    };
  }
}
