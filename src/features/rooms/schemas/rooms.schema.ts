import * as z from 'zod';

export const RoomDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  salt: z.string(),
  verificationToken: z.string(),
  verificationIV: z.string(),
});

export type RoomData = z.infer<typeof RoomDataSchema>;
