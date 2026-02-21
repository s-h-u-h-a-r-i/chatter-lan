import { Timestamp } from 'firebase/firestore';
import * as z from 'zod';

export const RoomDataFirestoreSchema = z.object({
  createdAt: z.instanceof(Timestamp),
  name: z.string(),
  salt: z.string().describe('base64'),
  verificationIV: z.string().describe('base64'),
  verificationToken: z.string().describe('base64'),
});

export type RoomDataFirestore = z.infer<typeof RoomDataFirestoreSchema>;
