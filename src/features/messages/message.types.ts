import { DocumentData, Timestamp } from 'firebase/firestore';

export interface EncryptedMessageContent {
  ciphertext: string; // * base64-encoded
  iv: string; // * base64-encoded
}

export interface MessageData {
  id: string;
  encryptedContent: EncryptedMessageContent;
  createdAt: Date;
  senderId: string;
  senderName: string;
  // viewerIds: string[]
}

export interface MessageFirestoreData extends DocumentData {
  content: EncryptedMessageContent;
  createdAt: Timestamp;
  senderId: string;
  senderName: string;
}
