import z from 'zod/mini';

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

export type MessageEncryptedContent = z.infer<
  typeof MessageEncryptedContentSchema
>;
export type MessageData = z.infer<typeof MessageDataSchema>;
