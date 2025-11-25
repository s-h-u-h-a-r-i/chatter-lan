import { DocumentData, DocumentSnapshot } from "firebase/firestore";

import { Result } from "@/lib/utils";
import { FirestoreDocument } from "./firestore-document";

interface RoomData {
  name: string;
}

class FirestoreRoomDocument extends FirestoreDocument implements RoomData {
  name: string;

  constructor(public readonly snapshot: DocumentSnapshot) {
    super(snapshot);
    const docData = snapshot.data();

    if (!this.#validateData(docData)) {
      throw new Error(
        `Validation failed for FirestoreRoomDocument at path: ${snapshot.ref.path}`
      );
    }

    this.name = docData.name;
  }

  static from(
    snapshot: DocumentSnapshot
  ): Result<FirestoreRoomDocument, Error> {
    try {
      return Result.ok(new FirestoreRoomDocument(snapshot));
    } catch (error) {
      return Result.err(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      name: this.name,
    };
  }

  #validateData(data: DocumentData | undefined): data is RoomData {
    return (
      !!data && typeof data.name === "string" && data.name.trim().length > 0
    );
  }
}

export { FirestoreRoomDocument, type RoomData };
