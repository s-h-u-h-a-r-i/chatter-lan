import { FirestoreDocumentValidationError } from "@/exceptions/firestore";
import { DocumentData, DocumentSnapshot, Timestamp } from "firebase/firestore";
import { FirestoreDocument } from "./firestore-document";
import { Result } from "@/lib/utils";

interface MessageData {
  data: unknown;
  sender: string;
  timestamp: Timestamp;
}

class FirestoreMessageDocument
  extends FirestoreDocument
  implements MessageData
{
  data: unknown;
  sender: string;
  timestamp: Timestamp;

  constructor(public readonly snapshot: DocumentSnapshot) {
    super(snapshot);
    const docData = snapshot.data();

    if (!this.#validateData(docData)) {
      throw new FirestoreDocumentValidationError({
        documentName: "FirestoreMessageDocument",
        path: snapshot.ref.path,
      });
    }

    this.data = docData.data;
    this.sender = docData.sender;
    this.timestamp = docData.timestamp;
  }

  static from(
    snapshot: DocumentSnapshot
  ): Result<FirestoreMessageDocument, FirestoreDocumentValidationError> {
    try {
      return Result.ok(new FirestoreMessageDocument(snapshot));
    } catch (error) {
      return Result.err(error as FirestoreDocumentValidationError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      data: this.data,
      sender: this.sender,
      timestamp: this.timestamp,
    };
  }

  #validateData(data: DocumentData | undefined): data is MessageData {
    if (!data) {
      return false;
    }

    if (data.data === undefined || data.data === null) {
      return false;
    }

    if (
      data.timestamp === undefined ||
      data.timestamp === null ||
      !(data.timestamp instanceof Timestamp)
    ) {
      return false;
    }

    if (
      data.sender === undefined ||
      data.sender === null ||
      typeof data.sender !== "string" ||
      !data.sender.trim()
    ) {
      return false;
    }

    return true;
  }
}

export { FirestoreMessageDocument, type MessageData };
