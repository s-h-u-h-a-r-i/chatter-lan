import { firestore } from "@/config/firebase";
import { Result } from "@/lib/utils";
import {
  collection,
  DocumentChange,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

class InvalidIpOrRoomIdError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class MessageRepository {
  async onMessageChanges(
    ip: string,
    roomId: string,
    callback: (change: DocumentChange) => void
  ): Promise<Result<Unsubscribe, InvalidIpOrRoomIdError>> {
    if (ip.trim() === "") {
      return Result.err(
        new InvalidIpOrRoomIdError("A non-empty IP string must be provided")
      );
    }
    if (roomId.trim() === "") {
      return Result.err(
        new InvalidIpOrRoomIdError(
          "A non-empty room ID string must be provided"
        )
      );
    }

    const collectionRef = collection(
      firestore,
      `/rooms/ips/${ip}/${roomId}/messages`
    );

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        callback(change);
      });
    });

    return Result.ok(unsubscribe);
  }
}

export { MessageRepository, type InvalidIpOrRoomIdError };
