import {
  EncryptedData,
  WorkerMessageWithoutId,
  WorkerResponse,
} from './crypto-types';

/**
 * ### Cryptographic service for secure decryption
 *
 * Provides a safe interface for decrypting encrypted data by isolating
 * cryptographic operations in a separate thread, preventing sensitive
 * key material from being exposed to the main application context.
 */
export class CryptoService {
  #worker: Worker | null = null;
  #messageId = 0;
  readonly #pendingResolvers = new Map<
    number,
    {
      resolve: (value: string) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor() {
    this.#initializeWorker();
  }

  /**
   * ### Initialize a cryptographic key for decryption
   *
   * Prepares the worker to decrypt data encrypted with the specified
   * passphrase, enabling subsequent decryption operations.
   *
   * @param keyId Unique identifier for the key to be stored
   * @param passphrase Secret phrase used to derive the decryption key
   * @param salt Random data used during key derivation to prevent
   *             rainbow table attacks
   */
  async init(
    keyId: string,
    passphrase: string,
    salt: Uint8Array
  ): Promise<void> {
    await this.#sendMessage({
      type: 'init',
      keyId: keyId,
      passphrase,
      salt,
    });
  }

  /**
   * ### Decrypt encrypted data
   *
   * Recovers the original plaintext from encrypted data using a
   * previously initialized key.
   *
   * @param keyId Identifier of the key to use for decryption
   * @param encrypted Encrypted data structure containing the ciphertext
   *                 and required cryptographic parameters
   * @returns The decrypted plaintext string
   */
  async decrypt(keyId: string, encrypted: EncryptedData): Promise<string> {
    const ciphertext = Uint8Array.from(atob(encrypted.ciphertext), (c) =>
      c.charCodeAt(0)
    );
    const salt = Uint8Array.from(atob(encrypted.salt), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0));

    return await this.#sendMessage({
      type: 'decrypt',
      keyId,
      ciphertext,
      salt,
      iv,
    });
  }

  /**
   * ### Encrypt plaintext data
   *
   * Transforms plaintext into encrypted ciphertext using a previously
   * initialized key.
   *
   * @param keyId Identifier of the key to use for encryption
   * @param plaintext The plaintext string to encrypt
   * @returns Encrypted data structure containing ciphertext and IV
   */
  async encrypt(
    keyId: string,
    plainText: string
  ): Promise<{ ciphertext: string; iv: string }> {
    const result = await this.#sendMessage({
      type: 'encrypt',
      keyId,
      plainText,
    });

    return JSON.parse(result);
  }

  /**
   * ### Remove a stored cryptographic key
   *
   * Permanently removes a key from the worker's memory, preventing
   * further decryption operations with that key and freeing resources.
   *
   * @param keyId Identifier of the key to remove
   */
  async removeKey(keyId: string): Promise<void> {
    await this.#sendMessage({
      type: 'remove-key',
      keyId,
    });
  }

  /**
   * ### Check Existence of Cryptographic Key
   *
   * Determines if a cryptographic key with the specified identifier exists in the worker's memory.
   *
   * @param keyId Identifier of the key to check for existence
   * @returns A promise resolving to true if the key exists, or false otherwise
   */
  async hasKey(keyId: string): Promise<boolean> {
    const result = await this.#sendMessage({
      type: 'has-key',
      keyId,
    });

    return JSON.parse(result);
  }

  /**
   * ### Clean up service resources
   *
   * Terminates the worker and cancels all pending operations, ensuring
   * proper resource cleanup when the service is no longer needed.
   */
  destroy() {
    if (this.#worker) {
      this.#worker.terminate();
      this.#worker = null;
    }
    this.#pendingResolvers.forEach(({ reject }) => {
      reject(new Error('CryptoService destroyed before operation completed'));
    });
    this.#pendingResolvers.clear();
  }

  /**
   * ### Initialize the worker thread
   *
   * Sets up communication with the cryptographic worker and establishes
   * message handling to coordinate asynchronous operations.
   */
  #initializeWorker() {
    this.#worker = new Worker(new URL('./crypto-worker.ts', import.meta.url), {
      type: 'module',
    });

    this.#worker.addEventListener(
      'message',
      (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        const id = response.id;

        const resolvers = this.#pendingResolvers.get(id);

        if (!resolvers) {
          console.error(
            'CryptoService: Received response with invalid or missing resolver ID:',
            response
          );
          return;
        }

        const { resolve, reject } = resolvers;
        this.#pendingResolvers.delete(id);

        switch (response.type) {
          case 'init-error':
          case 'decrypt-error':
          case 'encrypt-error':
            reject(new Error(response.error));
            break;
          case 'init-success':
          case 'remove-key':
            resolve('success');
            break;
          case 'decrypt-success':
          case 'encrypt-success':
            resolve(response.data || '');
            break;
          case 'has-key':
            resolve(response.data !== undefined ? response.data : 'false');
            break;
          default:
            const _exhaustiveCheck: never = response;
            reject(
              new Error(
                `Unknown worker response type: ${(response as any).type}`
              )
            );
        }
      }
    );

    this.#worker.addEventListener('error', (error) => {
      console.error('Worker error:', error);
      this.#pendingResolvers.forEach(({ reject }) => {
        reject(new Error('Worker error occurred'));
      });
      this.#pendingResolvers.clear();
    });
  }

  /**
   * ### Send a message to the worker
   *
   * Coordinates asynchronous communication with the worker by assigning
   * unique identifiers and managing promise resolution.
   *
   * @param message The message to send to the worker
   * @returns A promise that resolves when the worker responds
   */
  #sendMessage(message: WorkerMessageWithoutId): Promise<string> {
    if (!this.#worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    const id = this.#messageId++;
    return new Promise((resolve, reject) => {
      if (!this.#worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      this.#pendingResolvers.set(id, { resolve, reject });
      this.#worker.postMessage({ ...message, id });
    });
  }
}
