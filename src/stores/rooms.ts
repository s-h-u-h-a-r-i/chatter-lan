import { createStore } from "solid-js/store";

import { FirestoreRoomDocument } from "@/models/room";
import { roomEvents, RoomEventType } from "@/events/room";

type RoomsState = {
  rooms: FirestoreRoomDocument[];
  loading: boolean;
  error: string | null;
};

type RoomsStore = typeof roomsStore;

const [state, setState] = createStore<RoomsState>({
  rooms: [],
  loading: true,
  error: null,
});

const roomsStore = {
  // #region State Getters
  get rooms(): FirestoreRoomDocument[] {
    return state.rooms;
  },
  get loading(): boolean {
    return state.loading;
  },
  get error(): string | null {
    return state.error;
  },

  getRoomById(id: string): FirestoreRoomDocument | null {
    return state.rooms.find((room) => room.id === id) ?? null;
  },
  // #endregion State Getters

  // #region State Setters
  set loading(loading: boolean) {
    setState("loading", loading);
  },
  set error(error: string) {
    setState("error", error);
  },
  // #endregion State Setters

  // #region Rooms Actions
  addRoom(room: FirestoreRoomDocument): void {
    const index = roomsStore.rooms.findIndex((r) => r.id === room.id);

    if (index >= 0) {
      setState("rooms", index, room);
      roomEvents.emit({ type: RoomEventType.Updated, roomId: room.id });
    } else {
      setState("rooms", (prev) => [...prev, room]);
      roomEvents.emit({ type: RoomEventType.Added, roomId: room.id });
    }
  },

  removeRoom(id: string): void {
    setState("rooms", (prev) => prev.filter((r) => r.id !== id));
    roomEvents.emit({ type: RoomEventType.Removed, roomId: id });
  },
  // #endregion Rooms Actions

  // #region State Reset
  reset(): void {
    setState({
      rooms: [],
      loading: true,
      error: null,
    });
  },
  // #endregion State Reset
};

export { roomsStore, type RoomsStore };
