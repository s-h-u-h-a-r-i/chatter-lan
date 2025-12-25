export interface EncryptedData {
  ciphertext: string;
  salt: string;
  iv: string;
}

export interface WorkerInitMessage {
  type: 'init';
  id: number;
  roomId: string;
  passphrase: string;
  salt: Uint8Array;
}

export interface WorkerDecryptMessage {
  type: 'decrypt';
  id: number;
  roomId: string;
  ciphertext: Uint8Array;
  salt: Uint8Array;
  iv: Uint8Array;
}

export interface WorkerInitMessageWithoutId
  extends Omit<WorkerInitMessage, 'id'> {}

export interface WorkerDecryptMessageWithoutId
  extends Omit<WorkerDecryptMessage, 'id'> {}

export interface WorkerSuccessReponse {
  type: 'init-success' | 'decrypt-success';
  id: number;
  data?: string;
}

export interface WorkerErrorResponse {
  type: 'init-error' | 'decrypt-error';
  id: number;
  error: string;
}

export type WorkerResponse = WorkerSuccessReponse | WorkerErrorResponse;

export type WorkerMessage = WorkerInitMessage | WorkerDecryptMessage;

export type WorkerMessageWithoutId =
  | WorkerInitMessageWithoutId
  | WorkerDecryptMessageWithoutId;
