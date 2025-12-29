import { cryptoService, EncryptedData } from '@/core/crypto';
import { EncryptedMessageContent } from './message.types';

export async function decryptMessageContent(params: {
  roomId: string;
  encryptedContent: EncryptedMessageContent;
  roomSalt: string;
}): Promise<string | null> {
  try {
    const encrypted: EncryptedData = {
      ciphertext: params.encryptedContent.ciphertext,
      iv: params.encryptedContent.iv,
      salt: params.roomSalt,
    };
    return await cryptoService.decrypt(params.roomId, encrypted);
  } catch (e) {
    console.error('Failed to decrypt message', e);
    return null;
  }
}
