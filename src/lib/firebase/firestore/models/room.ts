import { DocumentData, DocumentSnapshot } from 'firebase/firestore';

import { Result } from '@/lib/result';
import { RoomData } from '@/types/room';
import { FirestoreDocument } from './base';

export class FirestoreRoomDocument extends FirestoreDocument<RoomData> {
  data: RoomData;

  constructor(snapshot: DocumentSnapshot) {
    super(snapshot);
    const data = snapshot.data();
    if (!data) {
      throw new Error(`Document with id "${snapshot.id}" has no data.`);
    }
    this.data = this.#parseData(data);
  }

  static fromSnapshot(
    snapshot: DocumentSnapshot
  ): Result<FirestoreRoomDocument, Error> {
    try {
      const roomDoc = new FirestoreRoomDocument(snapshot);
      return Result.ok(roomDoc);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return Result.err(error);
    }
  }

  #parseData(data: DocumentData): RoomData {
    if (!('name' in data) || typeof data.name !== 'string') {
      throw new Error('Room document is missing a valid "name" field.');
    }

    return {
      name: data.name,
    };
  }
}
