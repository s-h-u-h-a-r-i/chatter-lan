enum RoomEventType {
  Removed = "removed",
  Added = "added",
  Updated = "updated",
}

type RoomEvent = {
  type: RoomEventType;
  roomId: string;
};

type RoomEventListener = (event: RoomEvent) => void;

class RoomEventEmitter {
  #listeners = new Set<RoomEventListener>();

  emit(event: RoomEvent): void {
    this.#listeners.forEach((listener) => listener(event));
  }

  subscribe(listener: RoomEventListener): () => {} {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}

const roomEvents = new RoomEventEmitter();

export { RoomEventType, type RoomEvent, type RoomEventEmitter, roomEvents };
