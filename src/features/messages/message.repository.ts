import {
  collection,
  doc,
  DocumentChange,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  WithFieldValue,
} from 'firebase/firestore';
import z from 'zod';

import { firestore, fsPaths } from '@/core/firebase';
import {
  MessageData,
  MessageDataFirestore,
  MessageDataFirestoreSchema,
} from './schemas';

export async function createMessage(
  ip: string,
  roomId: string,
  messageId: string,
  data: WithFieldValue<Omit<MessageDataFirestore, 'createdAt'>>,
): Promise<void> {
  const messageRef = _getMessageRef(ip, roomId, messageId);
  const finalData = {
    ...data,
    createdAt: serverTimestamp(),
  };
  await setDoc(messageRef, finalData);
}

export function waitForMessageConfirmation(params: {
  ip: string;
  roomId: string;
  messageId: string;
  timeoutMs?: number;
}): Promise<void> {
  const timeoutMs = params.timeoutMs ?? 10_000;

  return new Promise((resolve, reject) => {
    const messageRef = _getMessageRef(params.ip, params.roomId, params.messageId);
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      clearTimeout(timeout);
      callback();
    };

    const unsubscribe = onSnapshot(
      messageRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const parsed = MessageDataFirestoreSchema.safeParse(snapshot.data());
        if (!parsed.success) return;
        finish(() => resolve());
      },
      (error) => finish(() => reject(error)),
    );

    const timeout = setTimeout(() => {
      finish(() =>
        reject(new Error('Timed out waiting for message confirmation')),
      );
    }, timeoutMs);
  });
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
            if (upsertResult.instruction === 'upsert') {
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
    },
  );
}

function _handleUpsertChange(change: DocumentChange) {
  const parsed = MessageDataFirestoreSchema.safeParse(change.doc.data());

  if (!parsed.success) {
    console.debug('Skipping message doc until it becomes valid:', {
      id: change.doc.id,
      issues: z.prettifyError(parsed.error),
    });
    return { instruction: 'ignore' as const };
  }

  const finalData: MessageData = {
    ...parsed.data,
    id: change.doc.id,
    createdAt: parsed.data.createdAt.toDate(),
    status: 'confirmed',
  };

  return { instruction: 'upsert' as const, data: finalData };
}

function _getMessagesCollectionRef(ip: string, roomId: string) {
  return collection(
    firestore,
    fsPaths.rooms.ips.collection(ip).doc(roomId).messages.path,
  );
}

function _getMessageRef(ip: string, roomId: string, messageId: string) {
  return doc(_getMessagesCollectionRef(ip, roomId), messageId);
}
