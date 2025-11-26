import { DocumentChange, Unsubscribe } from "firebase/firestore";

import { Result } from "@/lib/utils";
import { FirestoreRoomDocument } from "@/models/room";
import { RoomRepository } from "@/repositories/room";
import { ipStore, IpStore } from "@/stores/ip";
import { roomsStore, RoomsStore } from "@/stores/rooms";

export class RoomService {
  #roomRepository: RoomRepository;
  #roomsStore: RoomsStore;
  #ipStore: IpStore;
  #unsubscribe?: Unsubscribe;

  constructor(
    roomRepository: RoomRepository,
    roomsStore: RoomsStore,
    ipStore: IpStore
  ) {
    this.#roomRepository = roomRepository;
    this.#roomsStore = roomsStore;
    this.#ipStore = ipStore;
  }

  async subscribeToRoomChanges(): Promise<void> {
    this.cleanup();

    this.#unsubscribe = (
      await Result.fromPromise(
        this.#roomRepository.onRoomChangesByIp(
          this.#ipStore.userIp,
          this.#handleRoomDocumentChange
        )
      )
    )
      .mapErr((error) =>
        error instanceof Error ? error : new Error(String(error))
      )
      .tapErr((error) => {
        this.#roomsStore.error = error.message;
      })
      .ok();

    this.#roomsStore.loading = false;
  }

  cleanup(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    this.#roomsStore.reset();
  }

  #handleRoomDocumentChange = (change: DocumentChange): void => {
    switch (change.type) {
      case "added":
      case "modified": {
        const result = FirestoreRoomDocument.from(change.doc);
        if (result.isOk()) {
          this.#roomsStore.addRoom(result.value);
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
        this.#roomsStore.removeRoom(change.doc.ref.id);
      }
    }
  };
}

export const roomService = new RoomService(
  new RoomRepository(),
  roomsStore,
  ipStore
);
