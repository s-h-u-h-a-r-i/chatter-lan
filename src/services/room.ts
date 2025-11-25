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
      .ok();

    roomsStore.loading = false;
  }

  cleanup(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    roomsStore.reset();
  }

  #handleRoomDocumentChange = (change: DocumentChange): void => {
    switch (change.type) {
      case "added":
      case "modified": {
        const result = FirestoreRoomDocument.from(change.doc);
        if (result.isOk()) {
          roomsStore.addRoom(result.value);
        } else {
          // eslint-disable-next-line no-console
          console.warn(
            `Failed to convert room document ${change.doc.ref.path}:`,
            result.error
          );
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
