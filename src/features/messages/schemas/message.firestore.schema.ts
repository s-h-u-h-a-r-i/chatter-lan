import { Timestamp } from 'firebase/firestore';
import z from 'zod/mini';

export const MessageEncryptedContentFirestoreSchema = z.object({
  ciphertext: z.string(),
  iv: z.string(),
});

export const MessageDataFirestoreSchema = z.object({
  encryptedContent: MessageEncryptedContentFirestoreSchema,
  createdAt: z.instanceof(Timestamp),
  senderId: z.string(),
  senderName: z.string(),
});

export type MessageEncryptedContentFirestore = z.infer<
  typeof MessageEncryptedContentFirestoreSchema
>;
export type MessageDataFirestore = z.infer<typeof MessageDataFirestoreSchema>;
