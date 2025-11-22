import {
  collection,
  DocumentChange,
  DocumentData,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

import { firestore } from "@/config/firebase";

export class RoomRepository {
  async onRoomChangesByIp(
    ip: string | null,
    callback: (change: DocumentChange<DocumentData, DocumentData>) => void
  ): Promise<Unsubscribe> {
    if (ip === null || ip.trim() === "") {
      throw new Error("A non-empty IP string must be provided");
    }

    const collectionRef = collection(firestore, `/rooms/ips/${ip}`);

    return onSnapshot(collectionRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        callback(change);
      });
    });
  }
}
