import {
  collection,
  onSnapshot,
  QueryDocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { RoomData } from '@/types/room';
import { firestore, fsPaths } from '../firebase';

export function subscribeToRooms(
  ip: string,
  onUpdate: (rooms: RoomData[]) => void,
  onError: (error: string) => void
): Unsubscribe {
  const roomsRef = collection(firestore, fsPaths.rooms.ips.collection(ip).path);

  return onSnapshot(
    roomsRef,
    (snapshot) => {
      const rooms: RoomData[] = [];
      snapshot.forEach((docSnap) => {
        try {
          const converted = toRoomData(docSnap);
          rooms.push(converted);
        } catch (error) {
          console.warn('Failed to convert room:', error);
        }
      });
      onUpdate(rooms);
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

  return {
    id: docSnap.id,
    name: data.name,
    lastMessage: null,
    unreadCount: 0,
  };
}
