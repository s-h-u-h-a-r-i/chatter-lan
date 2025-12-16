import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  updateDoc,
} from 'firebase/firestore';

import { Result } from '@/lib/result';
import { deepEqual } from '@/lib/utils';

/**
 * ### Base class for Firestore document models
 *
 * Enable type-safe, controlled updates to Firestore documents by providing
 * a consistent interface for managing document state and ensuring data integrity
 * before persistence.
 */
export abstract class FirestoreDocument<T> {
  readonly #reference: DocumentReference;
  #originalData: T;
  #pendingData: T;

  /**
   * ### Initializes document from Firestore snapshot
   *
   * Creates a document instance from a Firestore snapshot, establishing
   * the baseling state for tracking modifications.
   *
   * @param snapshot Firestore document snapshot containing the document data
   * @throws Error when the snapshot contains no data
   */
  constructor(snapshot: DocumentSnapshot) {
    this.#reference = snapshot.ref;
    const docData = snapshot.data();

    if (!docData) {
      throw new Error(`Document with id "${snapshot.id}" has no data.`);
    }

    this.#originalData = Object.freeze(
      structuredClone(this._parseData(docData))
    );
    this.#pendingData = structuredClone(this.#originalData);
  }

  /**
   * ### Transform raw Firestore data into typed document data
   *
   * Converts Firestore document data into the specified type expected by
   * the document model, enabling type-safe access to document properties.
   *
   * @param docData Raw document data from Firestore
   * @returns Typed document data matching the model's type parameter
   */
  protected abstract _parseData(docData: DocumentData): T;

  /**
   * ### Validate document data before updating
   *
   * Ensure document data meets all requirements before persistence,
   * preventing invalid or inconsistent data from being saved to Firestore.
   *
   * @param data Document data to validate
   * @returns Success result if valid, error result with validation failure details if invalid
   */
  protected abstract _validateBeforeUpdate(data: T): Result<undefined, Error>;

  /**
   * ### Create document instance from snapshot with error handling
   *
   * Safely constructs a document instance from a Firestore snapshot,
   * returning a result type that captures any parsing or initalization errors
   * without throwing exceptions.
   *
   * @param this The constructor reference used for instantiation
   * @param snapshot Firestore document snapshot to parse
   * @returns Success result with document instance, or error result of creation fails.
   */
  static fromSnapshot<TDoc extends FirestoreDocument<TData>, TData>(
    this: new (snapshot: DocumentSnapshot) => TDoc,
    snapshot: DocumentSnapshot
  ): Result<TDoc, Error> {
    try {
      const doc = new this(snapshot);
      return Result.ok(doc);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `Failed to parse ${this.name} from snapshot (id=${snapshot.id}):`,
        error
      );
      return Result.err(error);
    }
  }

  /**
   * ### Get document identifier
   *
   * Provides the unique identifier for this document in Firestore,
   * enabling references and lookups.
   */
  get id(): string {
    return this.#reference.id;
  }

  /**
   * ### Check if document has unsaved modifications
   *
   * Determines whether the current document state differs from the last
   * saved state, enabling conditional update operations and change detection.
   */
  get hasPendingChanges(): boolean {
    return !deepEqual(this.#pendingData, this.#originalData);
  }

  /**
   * ### Get current document data
   *
   * Provides access to the current document state, including any pending
   * modification that have not yet been persisted.
   */
  protected get data(): T {
    return this.#pendingData;
  }

  /**
   * ### Discard pending changes and reset to original state
   *
   * Reverts all pending modifications back to the original data state,
   * effectively canceling any unsaved changes.
   */
  reset(): void {
    this.#pendingData = structuredClone(this.#originalData);
  }

  /**
   * ### Persist pending changes to Firestore
   *
   * Saves all pending modifications to Firestore after validation,
   * ensuring only valid data is persisted and maintaining consistency
   * between local state and remove storage.
   *
   * @returns Success result if update succeeds, error result if validation fails
   *  or update encounters and error
   */
  async update(): Promise<Result<undefined, Error>> {
    if (!this.hasPendingChanges) return Result.ok(undefined);

    const validationResult = this._validateBeforeUpdate(this.#pendingData);
    if (Result.isErr(validationResult)) {
      return validationResult;
    }

    try {
      const updateData = _toDocumentData(this.#pendingData);
      await updateDoc(this.#reference, updateData);

      this.#setInternalData(this.#pendingData);

      return Result.ok(undefined);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[FirestoreDocument.update] Failed to update document (id=${this.id}):`,
        error
      );
      return Result.err(error);
    }
  }

  /**
   * ### synchronize internal state after successful update
   *
   * Updates the internal state to reflect successfully persisted data,
   * established a new baseline for tracking future modifications.
   *
   * @param data Successfully persisted data to use as the new baseline
   */
  #setInternalData(data: T) {
    this.#originalData = Object.freeze(structuredClone(data)) as T;
    this.#pendingData = structuredClone(this.#originalData);
  }
}

/**
 * ### Convert data to Firestore-compatible format
 *
 * Transforms application data into a format acceptable by Firestore,
 * ensuring compatibility with Firestore's data model requirements.
 *
 * @param data Application data to convert
 * @returns Firestore-compatible document data
 */
function _toDocumentData<T>(data: T): DocumentData {
  return JSON.parse(JSON.stringify(data)) as DocumentData;
}
