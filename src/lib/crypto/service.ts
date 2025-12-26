import { EncryptedData, WorkerMessageWithoutId, WorkerResponse } from './types';

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

  async init(
    roomId: string,
    passphrase: string,
    salt: Uint8Array
  ): Promise<void> {
    await this.#sendMessage({
      type: 'init',
      roomId,
      passphrase,
      salt,
    });
  }

  async decrypt(roomId: string, encrypted: EncryptedData): Promise<string> {
    const ciphertext = Uint8Array.from(atob(encrypted.ciphertext), (c) =>
      c.charCodeAt(0)
    );
    const salt = Uint8Array.from(atob(encrypted.salt), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0));

    return await this.#sendMessage({
      type: 'decrypt',
      roomId,
      ciphertext,
      salt,
      iv,
    });
  }

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

  #initializeWorker() {
    this.#worker = new Worker(new URL('./crypto.worker.ts', import.meta.url), {
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
          case 'remove-room-error':
            reject(new Error(response.error));
            break;
          case 'init-success':
          case 'remove-room-success':
            resolve('success');
            break;
          case 'decrypt-success':
            resolve(response.data || '');
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
