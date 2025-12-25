import {
  collection,
  onSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';

import { firestore, fsPaths } from '../firebase';
import { MessageData } from './types';

export function subscribeToMessages(params: {
  ip: string;
  roomId: string;
  onUpsert: (messages: MessageData[]) => void;
  onRemove: (messageIds: string[]) => void;
  onError: (error: string) => void;
}): Unsubscribe {
  // TODO: Use room reference?
  const messagesRef = collection(
    firestore,
    fsPaths.rooms.ips.collection(params.ip).doc(params.roomId).messages.path
  );

  return onSnapshot(
    messagesRef,
    (snapshot) => {
      const messagesToUpsert: MessageData[] = [];
      const messagesToRemove: string[] = [];
      snapshot.docChanges().forEach((change) => {
        switch (change.type) {
          case 'added':
          case 'modified': {
            try {
              const converted = _toMessageData(change.doc);
              messagesToUpsert.push(converted);
            } catch (error) {
              console.warn('Failed to convert message:', error);
            }
            break;
          }
          case 'removed':
            messagesToRemove.push(change.doc.id);
            break;
          default:
            console.warn(`New change type (${change.type}) added?`);
            break;
        }
      });
      if (messagesToUpsert.length > 0) params.onUpsert(messagesToUpsert);
      if (messagesToRemove.length > 0) params.onRemove(messagesToRemove);
    },
    (error) => {
      console.error('Error subscribing to messages:', error);
      params.onError(error.message);
    }
  );
}

function _toMessageData(docSnap: QueryDocumentSnapshot): MessageData {
  const data = docSnap.data();

  if (typeof data.content !== 'string') {
    throw new Error(`Invalid data in message '${docSnap.ref.path}'`);
  }

  if (!(data.createdAt instanceof Timestamp)) {
    throw new Error(
      `Invalid or missing 'createdAt' in message '${docSnap.ref.path}'`
    );
  }

  if (typeof data.senderId !== 'string') {
    throw new Error(
      `Invalid or missing 'senderId' in message '${docSnap.ref.path}'`
    );
  }

  return {
    id: docSnap.id,
    content: data.content,
    createdAt: data.createdAt.toDate(),
    senderId: data.senderId,
  };
}
