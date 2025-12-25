// /src/lib/crypto/crypto.worker.ts

/// <reference lib="webworker" />

import type {
  WorkerDecryptMessage,
  WorkerInitMessage,
  WorkerMessage,
  WorkerResponse,
} from './types';

const cryptoKeys = new Map<string, CryptoKey>();

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  const messageId = message.id;

  try {
    switch (message.type) {
      case 'init': {
        await _handleInit(message, messageId);
        break;
      }
      case 'decrypt': {
        await _handleDecrypt(message, messageId);
        break;
      }
      default: {
        const _exhaustiveCheck: never = message;
        self.postMessage({
          type: 'init-error',
          id: messageId,
          error: `Unknown message type: ${(message as any).type}`,
        } satisfies WorkerResponse);
      }
    }
  } catch (error) {
    self.postMessage({
      type: 'init-error',
      id: messageId,
      error: error instanceof Error ? error.message : 'Unknown error',
    } satisfies WorkerResponse);
  }
});

async function _handleInit(
  message: WorkerInitMessage,
  id: number
): Promise<void> {
  try {
    const passphraseBuffer = new TextEncoder().encode(message.passphrase);
    const salt = new Uint8Array(message.salt);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passphraseBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const cryptoKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 200_000,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['decrypt']
    );

    cryptoKeys.set(message.roomId, cryptoKey);

    self.postMessage({ type: 'init-success', id } satisfies WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'init-error',
      id,
      error: error instanceof Error ? error.message : 'Key derivation failed',
    } satisfies WorkerResponse);
  }
}

async function _handleDecrypt(message: WorkerDecryptMessage, id: number) {
  const cryptoKey = cryptoKeys.get(message.roomId);

  if (!cryptoKey) {
    self.postMessage({
      type: 'decrypt-error',
      id,
      error: 'Key not initialized. Call init first.',
    } satisfies WorkerResponse);
    return;
  }

  try {
    const iv = new Uint8Array(message.iv);
    const ciphertext = new Uint8Array(message.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      cryptoKey,
      ciphertext
    );

    const plainText = new TextDecoder().decode(decrypted);

    self.postMessage({
      type: 'decrypt-success',
      id,
      data: plainText,
    } satisfies WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'decrypt-error',
      id,
      error: error instanceof Error ? error.message : 'Decryption failed',
    } satisfies WorkerResponse);
  }
}
