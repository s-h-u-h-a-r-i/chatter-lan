import { Unsubscribe } from "firebase/firestore";

import { FirestoreRoomDocument } from "@/models/room";
import { RoomRepository } from "@/repositories/room";
import { roomsStore } from "@/stores/rooms";
import { ipStore } from "@/stores/ip";

export class RoomService {
  #roomRepository: RoomRepository;
  #unsubscribe?: Unsubscribe;

  constructor() {
    this.#roomRepository = new RoomRepository();
  }

  async subscribeToRoomChanges(): Promise<void> {
    this.cleanup();

    try {
      this.#unsubscribe = await this.#roomRepository.onRoomChangesByIp(
        ipStore.userIp,
        (change) => {
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
        }
      );
    } catch (error) {
      roomsStore.error = String(error);
    } finally {
      roomsStore.loading = false;
    }
  }

  cleanup(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    roomsStore.reset();
  }
}

export const roomService = new RoomService();
