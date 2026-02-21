import {
  addDoc,
  collection,
  DocumentChange,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  WithFieldValue,
} from 'firebase/firestore';

import { firestore, fsPaths } from '@/core/firebase';
import z from 'zod';
import {
  MessageData,
  MessageDataFirestore,
  MessageDataFirestoreSchema,
} from './schemas';

export async function createMessage(
  ip: string,
  roomId: string,
  data: WithFieldValue<MessageDataFirestore>
): Promise<string> {
  const messagesRef = _getMessagesCollectionRef(ip, roomId);
  const finalData = {
    ...data,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(messagesRef, finalData);
  return docRef.id;
}

export function subscribeToMessages(params: {
  ip: string;
  roomId: string;
  onUpsert: (incoming: MessageData[]) => void;
  onRemove: (messageIds: string[]) => void;
  onError: (error: string) => void;
}): Unsubscribe {
  const messagesRef = _getMessagesCollectionRef(params.ip, params.roomId);

  return onSnapshot(
    messagesRef,
    (snapshot) => {
      const messagesToUpsert: MessageData[] = [];
      const messagesToRemove: string[] = [];
      snapshot.docChanges().forEach((change) => {
        switch (change.type) {
          case 'added':
          case 'modified': {
            const upsertResult = _handleUpsertChange(change);
            if (upsertResult.instruction === 'remove') {
              messagesToRemove.push(upsertResult.id);
            } else {
              messagesToUpsert.push(upsertResult.data);
            }
            break;
          }
          case 'removed':
            messagesToRemove.push(change.doc.id);
            break;
          default:
            const _exhaustiveCheck: never = change.type;
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

function _handleUpsertChange(change: DocumentChange) {
  const parsed = MessageDataFirestoreSchema.safeParse(change.doc.data());

  if (!parsed.success) {
    console.warn('Failed to parse message doc:', {
      id: change.doc.id,
      issues: z.prettifyError(parsed.error),
    });
    return { instruction: 'remove' as const, id: change.doc.id };
  }

  const finalData: MessageData = {
    ...parsed.data,
    id: change.doc.id,
    createdAt: parsed.data.createdAt.toDate(),
  };

  return { instruction: 'upsert' as const, data: finalData };
}

function _getMessagesCollectionRef(ip: string, roomId: string) {
  return collection(
    firestore,
    fsPaths.rooms.ips.collection(ip).doc(roomId).messages.path
  );
}
