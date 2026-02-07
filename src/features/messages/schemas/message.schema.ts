import z from 'zod';
import { MessageDataFirestoreSchema } from './message.firestore.schema';

const MessageEncryptedContentSchema = z.object({
  ciphertext: z.string(),
  iv: z.string(),
});

const MessageDataSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  senderId: z.string(),
  senderName: z.string(),
  encryptedContent: MessageEncryptedContentSchema,
});

export const MessageDataFromFirestoreSchema = MessageDataFirestoreSchema.extend(
  { id: z.string() }
).transform(
  (document): MessageData => ({
    ...document,
    createdAt: document.createdAt.toDate(),
  })
);

export type MessageEncryptedContent = z.infer<
  typeof MessageEncryptedContentSchema
>;
export type MessageData = z.infer<typeof MessageDataSchema>;
