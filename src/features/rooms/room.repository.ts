import {
  collection,
  CollectionReference,
  doc,
  DocumentChange,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import * as z from 'zod';

import { firestore, fsPaths } from '@/core/firebase';
import { RoomData, RoomDataFirestoreSchema } from './schemas';

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
            const upsertResult = _handleUpsertChange(change);
            if (upsertResult.instruction === 'remove') {
              roomsToRemove.push(upsertResult.id);
            } else {
              roomsToUpsert.push(upsertResult.data);
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

function _handleUpsertChange(change: DocumentChange) {
  const parsed = RoomDataFirestoreSchema.safeParse(change.doc.data());

  if (parsed.error) {
    console.warn('Failed to parse room doc:', {
      id: change.doc.id,
      issues: z.prettifyError(parsed.error),
    });
    return { instruction: 'remove' as const, id: change.doc.id };
  }

  const finalData: RoomData = {
    ...parsed.data,
    id: change.doc.id,
    createdAt: parsed.data.createdAt.toDate(),
  };

  return { instruction: 'upsert' as const, data: finalData };
}
