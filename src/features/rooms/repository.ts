import {
  addDoc,
  collection,
  CollectionReference,
  onSnapshot,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';

import { firestore, fsPaths } from '../firebase';
import { RoomData } from './types';

export async function createRoom(params: {
  ip: string;
  name: string;
  salt: Uint8Array;
}): Promise<string> {
  const roomsRef = _getRoomsCollectionRef(params.ip);

  const saltBase64 = btoa(String.fromCharCode(...params.salt));

  const docRef = await addDoc(roomsRef, {
    name: params.name,
    createdAt: serverTimestamp(),
    salt: saltBase64,
  });

  return docRef.id;
}

export function subscribeToRooms(
  ip: string,
  onUpsert: (rooms: RoomData[]) => void,
  onRemove: (roomIds: string[]) => void,
  onError: (error: string) => void
): Unsubscribe {
  const roomsRef = _getRoomsCollectionRef(ip);

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
            const _exhaustiveCheck: never = change.type;
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

function _getRoomsCollectionRef(ip: string): CollectionReference {
  return collection(firestore, fsPaths.rooms.ips.collection(ip).path);
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

  if (typeof data.salt !== 'string') {
    throw new Error(`Invalid or missing 'salt' in room '${docSnap.ref.path}'`);
  }

  return {
    id: docSnap.id,
    name: data.name,
    createdAt: data.createdAt.toDate(),
    salt: data.salt,
  };
}
