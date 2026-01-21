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

import { firestore, fsPaths } from '@/core/firebase';
import { isObject } from '@/core/guards';
import { EncryptedMessageContent, MessageData } from './message.types';

export async function createMessage(params: {
  ip: string;
  roomId: string;
  senderId: string;
  encryptedContent: EncryptedMessageContent;
}): Promise<string> {
  const messagesRef = _getMessagesCollectionRef(params.ip, params.roomId);

  const docRef = await addDoc(messagesRef, {
    content: {
      ciphertext: params.encryptedContent.ciphertext,
      iv: params.encryptedContent.iv,
    },
    createdAt: serverTimestamp(),
    senderId: params.senderId,
  });

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

function _getMessagesCollectionRef(
  ip: string,
  roomId: string
): CollectionReference {
  return collection(
    firestore,
    fsPaths.rooms.ips.collection(ip).doc(roomId).messages.path
  );
}

function _toMessageData(docSnap: QueryDocumentSnapshot): MessageData {
  const data = docSnap.data();

  // * Validate presence and structure of 'content'
  if (
    !isObject(data.content) ||
    typeof data.content.ciphertext !== 'string' ||
    typeof data.content.iv !== 'string'
  ) {
    throw new Error(
      `Invalid or missing 'content' in message '${docSnap.ref.path}'`
    );
  }

  // * Validate 'createdAt'
  if (!(data.createdAt instanceof Timestamp)) {
    throw new Error(
      `Invalid or missing 'createdAt' in message '${docSnap.ref.path}'`
    );
  }

  // * Validate 'senderId'
  if (typeof data.senderId !== 'string') {
    throw new Error(
      `Invalid or missing 'senderId' in message '${docSnap.ref.path}'`
    );
  }

  if (typeof data.senderName !== 'string') {
    throw new Error(
      `Invalid or missing 'senderName' in message '${docSnap.ref.path}'`
    );
  }

  return {
    id: docSnap.id,
    encryptedContent: {
      ciphertext: data.content.ciphertext,
      iv: data.content.iv,
    },
    createdAt: data.createdAt.toDate(),
    senderId: data.senderId,
    senderName: data.senderName,
  };
}
