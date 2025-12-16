import { DocumentData } from 'firebase/firestore';

import { Result } from '@/lib/result';
import { RoomData } from '@/types/room';
import { FirestoreDocument } from './base';

export class FirestoreRoomDocument extends FirestoreDocument<RoomData> {
  protected _parseData(docData: DocumentData): RoomData {
    if (!('name' in docData) || typeof docData.name !== 'string') {
      throw new Error('Room document is missing a valid "name" field.');
    }

    return {
      name: docData.name,
    };
  }

  protected _validateBeforeUpdate(data: RoomData): Result<undefined, Error> {
    if (data.name && typeof data.name === 'string') return Result.ok(undefined);
    return Result.err(new Error('Room name must be a non-empty string.'));
  }
}
