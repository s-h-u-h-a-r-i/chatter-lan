import {
  collection,
  onSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';

import { RoomData } from '@/types/room';
import { firestore, fsPaths } from '../firebase';

export function subscribeToRooms(
  ip: string,
  onUpdate: (rooms: RoomData[]) => void,
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
          case 'modified':
            try {
              const converted = toRoomData(change.doc);
              roomsToUpsert.push(converted);
            } catch (error) {
              console.warn('Failed to convert room:', error);
            }
            break;
          case 'removed':
            roomsToRemove.push(change.doc.id);
            break;
          default:
            console.warn(`New change type (${change.type}) added?`);
            break;
        }
      });
      if (roomsToUpsert.length > 0) onUpdate(roomsToUpsert);
      if (roomsToRemove.length > 0) onRemove(roomsToRemove);
    },
    (error) => {
      onError(error.message);
    }
  );
}

function toRoomData(docSnap: QueryDocumentSnapshot): RoomData {
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
    lastMessage: null,
    unreadCount: 0,
    createdAt: data.createdAt.toDate(),
  };
}
