export interface EncryptedData {
  ciphertext: string;
  salt: string;
  iv: string;
}

export interface WorkerInitMessage {
  type: 'init';
  id: number;
  keyId: string;
  passphrase: string;
  salt: Uint8Array;
}

export interface WorkerDecryptMessage {
  type: 'decrypt';
  id: number;
  keyId: string;
  ciphertext: Uint8Array;
  salt: Uint8Array;
  iv: Uint8Array;
}

export interface WorkerRemoveKeyMessage {
  type: 'remove-key';
  id: number;
  keyId: string;
}

export interface WorkerInitMessageWithoutId
  extends Omit<WorkerInitMessage, 'id'> {}

export interface WorkerDecryptMessageWithoutId
  extends Omit<WorkerDecryptMessage, 'id'> {}

export interface WorkerRemoveKeyMessageWithoutId
  extends Omit<WorkerRemoveKeyMessage, 'id'> {}

export interface WorkerSuccessReponse {
  type: 'init-success' | 'decrypt-success' | 'remove-key-success';
  id: number;
  data?: string;
}

export interface WorkerErrorResponse {
  type: 'init-error' | 'decrypt-error' | 'remove-key-error';
  id: number;
  error: string;
}

export type WorkerResponse = WorkerSuccessReponse | WorkerErrorResponse;

export type WorkerMessage =
  | WorkerInitMessage
  | WorkerDecryptMessage
  | WorkerRemoveKeyMessage;

export type WorkerMessageWithoutId =
  | WorkerInitMessageWithoutId
  | WorkerDecryptMessageWithoutId
  | WorkerRemoveKeyMessageWithoutId;
