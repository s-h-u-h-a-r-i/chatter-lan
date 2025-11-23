import { DocumentChange, Unsubscribe } from "firebase/firestore";

import { FirestoreRoomDocument } from "@/models/room";
import { RoomRepository } from "@/repositories/room";
import { roomsStore } from "@/stores/rooms";
import { ipStore } from "@/stores/ip";
import { Result } from "@/lib/utils";

export class RoomService {
  #roomRepository: RoomRepository;
  #unsubscribe?: Unsubscribe;

  constructor() {
    this.#roomRepository = new RoomRepository();
  }

  async subscribeToRoomChanges(): Promise<void> {
    this.cleanup();

    this.#unsubscribe = (
      await Result.fromPromise(
        this.#roomRepository.onRoomChangesByIp(
          ipStore.userIp,
          this.#handleRoomDocumentChange
        )
      )
    )
      .mapErr((error) =>
        error instanceof Error ? error : new Error(String(error))
      )
      .tapErr((error) => {
        roomsStore.error = error.message;
      })
      .unwrapOr(undefined);

    roomsStore.loading = false;
  }

  cleanup(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    roomsStore.reset();
  }

  #handleRoomDocumentChange = (change: DocumentChange): void => {
    const errorMsg = `Failed to convert room document ${change.doc.ref.path}:`;

    switch (change.type) {
      case "added":
      case "modified": {
        try {
          roomsStore.addRoom(new FirestoreRoomDocument(change.doc));
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(errorMsg, error);
        }
        break;
      }
      case "removed": {
        roomsStore.removeRoom(change.doc.ref.id);
      }
    }
  };
}

export const roomService = new RoomService();
