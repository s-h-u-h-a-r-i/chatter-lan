import {
  collection,
  CollectionReference,
  doc,
  onSnapshot,
  QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';

import { firestore, fsPaths } from '@/core/firebase';
import { RoomData } from './room.types';

export async function createRoom(params: {
  roomId: string;
  ip: string;
  name: string;
  saltBase64: string;
  verificationToken: string;
  verificationIV: string;
}): Promise<void> {
  const roomsRef = _getRoomsCollectionRef(params.ip);
  const roomDocRef = doc(roomsRef, params.roomId);

  await setDoc(roomDocRef, {
    name: params.name,
    createdAt: serverTimestamp(),
    salt: params.saltBase64,
    verificationToken: params.verificationToken,
    verificationIV: params.verificationIV,
  });
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

  if (typeof data.verificationToken !== 'string') {
    throw new Error(
      `Invalid or missing 'verificationToken' in room '${docSnap.ref.path}'`
    );
  }

  if (typeof data.verificationIV !== 'string') {
    throw new Error(
      `Invalid or missing 'verificationIV' in room '${docSnap.ref.path}'`
    );
  }

  return {
    id: docSnap.id,
    name: data.name,
    createdAt: data.createdAt.toDate(),
    salt: data.salt,
    verificationIV: data.verificationIV,
    verificationToken: data.verificationToken,
  };
}
