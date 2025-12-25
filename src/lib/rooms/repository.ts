import {
  collection,
  onSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';

import { firestore, fsPaths } from '../firebase';
import { RoomData } from './types';

export function subscribeToRooms(
  ip: string,
  onUpsert: (rooms: RoomData[]) => void,
  onRemove: (roomIds: string[]) => void,
  onError: (error: string) => void
): Unsubscribe {
  const roomsRef = collection(firestore, fsPaths.rooms.ips.collection(ip).path);

  return onSnapshot(
    roomsRef,
    (snapshot) => {
      const roomsToUpsert: RoomData[] = [];
      const roomsToRemove: string[] = [];
      snapshot.docChanges().forEach((change) => {
        switch (change.type) {
          case 'added':
          case 'modified': {
            try {
              const converted = _toRoomData(change.doc);
              roomsToUpsert.push(converted);
            } catch (error) {
              console.warn('Failed to convert room:', error);
            }
            break;
          }
          case 'removed':
            roomsToRemove.push(change.doc.id);
            break;
          default:
            console.warn(`New change type (${change.type}) added?`);
            break;
        }
      });
      if (roomsToUpsert.length > 0) onUpsert(roomsToUpsert);
      if (roomsToRemove.length > 0) onRemove(roomsToRemove);
    },
    (error) => {
      console.error('Error subscribing to rooms:', error);
      onError(error.message);
    }
  );
}

function _toRoomData(docSnap: QueryDocumentSnapshot): RoomData {
  const data = docSnap.data();

  if (typeof data.name !== 'string') {
    throw new Error(`Invalid data in room '${docSnap.ref.path}'`);
  }

  if (!(data.createdAt instanceof Timestamp)) {
    throw new Error(
      `Invalid or missing 'createdAt' in room '${docSnap.ref.path}'`
    );
  }

  return {
    id: docSnap.id,
    name: data.name,
    createdAt: data.createdAt.toDate(),
  };
}
