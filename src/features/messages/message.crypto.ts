import { CryptoService, EncryptedData } from '@/core/crypto';
import { MessageEncryptedContent } from './schemas';

export async function encryptMessageContent(params: {
  roomId: string;
  cryptoService: CryptoService;
  plainText: string;
}): Promise<MessageEncryptedContent | null> {
  try {
    return await params.cryptoService.encrypt(params.roomId, params.plainText);
  } catch (e) {
    console.error('Failed to encrypt message', e);
    return null;
  }
}

export async function decryptMessageContent(params: {
  roomId: string;
  cryptoService: CryptoService;
  encryptedContent: MessageEncryptedContent;
  roomSalt: string;
}): Promise<string | null> {
  try {
    const encrypted: EncryptedData = {
      ciphertext: params.encryptedContent.ciphertext,
      iv: params.encryptedContent.iv,
      salt: params.roomSalt,
    };
    return await params.cryptoService.decrypt(params.roomId, encrypted);
  } catch (e) {
    console.error('Failed to decrypt message', e);
    return null;
  }
}
