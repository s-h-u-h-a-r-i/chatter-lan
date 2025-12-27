/// <reference lib="webworker" />

import type {
  WorkerDecryptMessage,
  WorkerEncryptMessage,
  WorkerInitMessage,
  WorkerMessage,
  WorkerRemoveKeyMessage,
  WorkerResponse,
} from './types';

const cryptoKeys = new Map<string, CryptoKey>();

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  const messageId = message.id;

  try {
    switch (message.type) {
      case 'init':
        await _handleInit(message);
        break;
      case 'decrypt':
        await _handleDecrypt(message);
        break;
      case 'encrypt':
        await _handleEncrypt(message);
        break;
      case 'remove-key':
        _handleRemoveKey(message);
        break;
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

/**
 * ### Initialize a cryptographic key for decryption
 *
 * Derives a decryption key from a passphrase and stores it for
 * subsequent decryption operations, enabling secure key management
 * isolated from the main thread.
 *
 * @param message Initialization request containing passphrase and key identifier
 */
async function _handleInit(message: WorkerInitMessage): Promise<void> {
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
      ['decrypt', 'encrypt']
    );

    cryptoKeys.set(message.keyId, cryptoKey);

    self.postMessage({
      type: 'init-success',
      id: message.id,
    } satisfies WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'init-error',
      id: message.id,
      error: error instanceof Error ? error.message : 'Key derivation failed',
    } satisfies WorkerResponse);
  }
}

/**
 * ### Decrypt encrypted data
 *
 * Recovers the original plaintext from encrypted data using a
 * previously initialized key, ensuring sensitive operations remain
 * isolated from the main application thread.
 *
 * @param message Decryption request containing encrypted data and key identifier
 */
async function _handleDecrypt(message: WorkerDecryptMessage): Promise<void> {
  const cryptoKey = cryptoKeys.get(message.keyId);

  if (!cryptoKey) {
    self.postMessage({
      type: 'decrypt-error',
      id: message.id,
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
      id: message.id,
      data: plainText,
    } satisfies WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'decrypt-error',
      id: message.id,
      error: error instanceof Error ? error.message : 'Decryption failed',
    } satisfies WorkerResponse);
  }
}

/**
 * ### Encrypt plaintext data
 *
 * Transforms plaintext into encrypted ciphertext using a previously
 * initialized key, ensuring sensitive operations remain isolated from
 * the main application thread.
 *
 * @param message Encryption request containing plaintext and key identifier
 */
async function _handleEncrypt(message: WorkerEncryptMessage): Promise<void> {
  const cryptoKey = cryptoKeys.get(message.keyId);

  if (!cryptoKey) {
    self.postMessage({
      type: 'encrypt-error',
      id: message.id,
      error: 'Key not initialized. Call init first.',
    } satisfies WorkerResponse);
    return;
  }

  try {
    const plaintextBuffer = new TextEncoder().encode(message.plainText);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      cryptoKey,
      plaintextBuffer
    );

    const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    const result = JSON.stringify({
      ciphertext,
      iv: ivBase64,
    });

    self.postMessage({
      type: 'encrypt-success',
      id: message.id,
      data: result,
    } satisfies WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'encrypt-error',
      id: message.id,
      error: error instanceof Error ? error.message : 'Encryption failed',
    } satisfies WorkerResponse);
  }
}

/**
 * ### Remove a stored cryptographic key
 *
 * Permanently removes a key from memory, preventing further decryption
 * operations and ensuring sensitive key material is cleared when no
 * longer needed.
 *
 * @param message Key removal request containing the key identifier
 */
function _handleRemoveKey(message: WorkerRemoveKeyMessage): void {
  cryptoKeys.delete(message.keyId);
  self.postMessage({
    type: 'remove-key-success',
    id: message.id,
  } satisfies WorkerResponse);
}
