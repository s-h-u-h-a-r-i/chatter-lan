/**
 * ### Encrypted data structure
 *
 * Represents encrypted content along with the cryptographic parameters
 * needed to decrypt it, enabling secure data storage and transmission.
 */
export interface EncryptedData {
  /**
   * Base64-encoded string containing the encrypted data
   *
   * Enables secure persistence of sensitive content by ensuring it is not readable without decryption.
   */
  ciphertext: string;

  /**
   * Base64-encoded string representing the salt value used for key derivation
   *
   * Prevents reuse attacks and ensures each encryption operation yields different results, even with the same passphrase.
   */
  salt: string;

  /**
   * Base64-encoded string representing the initialization vector for encryption
   *
   * Ensures cryptographic operations produce unpredictable ciphertexts, protecting against pattern analysis.
   */
  iv: string;
}

/**
 * ### Worker initialization message
 *
 * Instructs the worker to derive and store a cryptographic key for
 * subsequent decryption operations.
 */
export interface WorkerInitMessage {
  /**
   * String literal identifying the message as an initialization request
   *
   * Enables the worker to distinguish requests for key derivation and prepare for subsequent cryptographic operations.
   */
  type: 'init';

  /**
   * Unique identifier for correlating this message with a worker response
   *
   * Ensures correct matching of asynchronous responses with their originating requests.
   */
  id: number;

  /**
   * String used to label and reference the derived cryptographic key
   *
   * Allows managing multiple keys within the worker, preventing collisions and supporting concurrent sessions.
   */
  keyId: string;

  /**
   * Secret passphrase from which the decryption key will be derived
   *
   * Ensures that only entities with knowledge of the passphrase can access the decrypted data.
   */
  passphrase: string;

  /**
   * Salt value applied to the passphrase during key derivation
   *
   * Protects against precomputed attacks by randomizing key generation for each initialization event.
   */
  salt: Uint8Array;
}

/**
 * ### Worker decryption message
 *
 * Requests decryption of encrypted data using a previously initialized key.
 */
export interface WorkerDecryptMessage {
  /**
   * String literal identifying the message as a decryption request
   *
   * Enables the worker to recognize and appropriately process decryption operations.
   */
  type: 'decrypt';

  /**
   * Unique identifier for correlating this request with the corresponding worker response
   *
   * Facilitates the reliable tracking and matching of asynchronous decryption responses to their requests.
   */
  id: number;

  /**
   * Identifier referencing the cryptographic key to use for decryption
   *
   * Supports management of multiple keys within a single worker, ensuring proper key selection.
   */
  keyId: string;

  /**
   * Encrypted data to be decrypted by the worker
   *
   * Protects sensitive content by ensuring it remains unintelligible until a valid decryption process occurs.
   */
  ciphertext: Uint8Array;

  /**
   * Salt value utilized in the cryptographic key derivation
   *
   * Defends against attacks by ensuring unique key generation for each encryption/decryption context.
   */
  salt: Uint8Array;

  /**
   * Initialization vector required for the decryption operation
   *
   * Prevents predictable encryption output, strengthening security by introducing uniqueness for each operation.
   */
  iv: Uint8Array;
}

/**
 * ### Worker encryption message
 *
 * Enables secure submission of data to be encrypted using a specified cryptographic key,
 * allowing correlation of requests and responses for reliable encryption operations in asynchronous contexts.
 */
export interface WorkerEncryptMessage {
  /**
   * String literal identifying the message as an encryption request
   *
   * Enables the worker to recognize and appropriately process encryption operations.
   */
  type: 'encrypt';

  /**
   * Unique identifier for correlating this request with the corresponding worker response
   *
   * Facilitates the reliable tracking and matching of asynchronous encryption responses to their requests.
   */
  id: number;

  /**
   * Identifier referencing the cryptographic key to use for encryption
   *
   * Supports management of multiple keys within a single worker, ensuring proper key selection.
   */
  keyId: string;

  /**
   * Plaintext data to be encrypted by the worker
   *
   * Protects sensitive content by converting human-readable data into a secure encrypted form.
   */
  plainText: string;
}

/**
 * ### Worker key removal message
 *
 * Requests removal of a previously initialized cryptographic key from the worker's memory,
 * enabling secure cleanup of sensitive key material when no longer needed.
 */
export interface WorkerRemoveKeyMessage {
  /**
   * String literal identifying the message as a key removal request
   *
   * Enables the worker to recognize and appropriately process key cleanup operations.
   */
  type: 'remove-key';

  /**
   * Unique identifier for correlating this request with the corresponding worker response
   *
   * Facilitates the reliable tracking and matching of asynchronous removal responses to their requests.
   */
  id: number;

  /**
   * Identifier referencing the cryptographic key to remove from memory
   *
   * Ensures precise key management by targeting the specific key to be cleaned up.
   */
  keyId: string;
}

/**
 * ### Worker key existence check message
 *
 * Requests the worker to check if a cryptographic key with a specific identifier exists in memory.
 * This is useful for verifying key presence without exposing key material or attempting key operations.
 */
export interface WorkerHasKeyMessage {
  /**
   * String literal identifying the message as a key existence check request.
   * Allows the worker to recognize and handle "has-key" operations.
   */
  type: 'has-key';

  /**
   * Unique identifier for correlating this request with the corresponding worker response.
   * Facilitates reliable asynchronous request/response matching.
   */
  id: number;

  /**
   * Identifier referencing the cryptographic key whose existence is being checked.
   * Ensures the check is performed for the correct key instance.
   */
  keyId: string;
}

/**
 * ### Worker initialization message without request identifier
 *
 * Enables constructing initialization messages before assigning request identifiers,
 * supporting a clean separation between message structure and request tracking.
 */
export interface WorkerInitMessageWithoutId
  extends Omit<WorkerInitMessage, 'id'> {}

/**
 * ### Worker decryption message without request identifier
 *
 * Enables constructing decryption messages before assigning request identifiers,
 * supporting a clean separation between message structure and request tracking.
 */
export interface WorkerDecryptMessageWithoutId
  extends Omit<WorkerDecryptMessage, 'id'> {}

/**
 * ### Worker encryption message without request identifier
 *
 * Enables constructing encryption messages before assigning request identifiers,
 * supporting a clean separation between message structure and request tracking.
 */
export interface WorkerEncryptMessageWithoutId
  extends Omit<WorkerEncryptMessage, 'id'> {}

/**
 * ### Worker key removal message without request identifier
 *
 * Enables constructing key removal messages before assigning request identifiers,
 * supporting a clean separation between message structure and request tracking.
 */
export interface WorkerRemoveKeyMessageWithoutId
  extends Omit<WorkerRemoveKeyMessage, 'id'> {}

/**
 * ### Worker has-key message without request identifier
 *
 * Enables constructing messages to check the existence of a cryptographic key before assigning request identifiers,
 * supporting a clear separation between message structure and tracking.
 */
export interface WorkerHasKeyMessageWithoutId
  extends Omit<WorkerHasKeyMessage, 'id'> {}

/**
 * ### Worker success response
 *
 * Represents a successful completion of a worker operation, enabling reliable
 * communication of operation outcomes and optional result data back to the caller.
 */
export interface WorkerSuccessResponse {
  /**
   * String literal identifying the type of successful operation
   *
   * Enables the caller to distinguish between different successful operation types and handle them appropriately.
   */
  type:
    | 'init-success'
    | 'decrypt-success'
    | 'encrypt-success'
    | 'remove-key'
    | 'has-key';

  /**
   * Unique identifier matching the original request that triggered this response
   *
   * Ensures correct correlation of responses with their originating requests in asynchronous communication.
   */
  id: number;

  /**
   * Optional result data returned from the worker operation
   *
   * Carries operation-specific results, such as decrypted plaintext, when the operation produces output.
   */
  data?: string;
}

/**
 * ### Worker error response
 *
 * Represents a failed worker operation, enabling reliable error communication
 * and debugging by providing operation context and failure details.
 */
export interface WorkerErrorResponse {
  /**
   * String literal identifying the type of failed operation
   *
   * Enables the caller to distinguish between different error types and handle them appropriately.
   */
  type: 'init-error' | 'decrypt-error' | 'encrypt-error';

  /**
   * Unique identifier matching the original request that triggered this error response
   *
   * Ensures correct correlation of error responses with their originating requests in asynchronous communication.
   */
  id: number;

  /**
   * Human-readable error message describing the failure
   *
   * Provides diagnostic information to help identify and resolve the cause of the operation failure.
   */
  error: string;
}

/**
 * ### Worker response union type
 *
 * Represents all possible responses from the worker, enabling type-safe handling
 * of both successful operations and error conditions in a unified response structure.
 */
export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

/**
 * ### Worker message union type
 *
 * Represents all possible messages that can be sent to the worker, enabling
 * type-safe communication and ensuring only valid message types are transmitted.
 */
export type WorkerMessage =
  | WorkerInitMessage
  | WorkerDecryptMessage
  | WorkerEncryptMessage
  | WorkerRemoveKeyMessage
  | WorkerHasKeyMessage;

/**
 * ### Worker message union type without request identifiers
 *
 * Enables constructing messages before assigning request identifiers, supporting
 * a clean separation between message structure and request tracking in the service layer.
 */
export type WorkerMessageWithoutId =
  | WorkerInitMessageWithoutId
  | WorkerDecryptMessageWithoutId
  | WorkerEncryptMessageWithoutId
  | WorkerRemoveKeyMessageWithoutId
  | WorkerHasKeyMessageWithoutId;
