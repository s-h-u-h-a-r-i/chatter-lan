import { createStore } from "solid-js/store";

import { FirestoreRoomDocument } from "@/models/room";

type RoomsState = {
  rooms: FirestoreRoomDocument[];
  loading: boolean;
  error: string | null;
};

const [state, setState] = createStore<RoomsState>({
  rooms: [],
  loading: true,
  error: null,
});

const roomsStore = {
  get rooms(): FirestoreRoomDocument[] {
    return state.rooms;
  },
  get loading(): boolean {
    return state.loading;
  },
  set loading(loading: boolean) {
    setState("loading", loading);
  },
  get error(): string | null {
    return state.error;
  },
  set error(error: string) {
    setState("error", error);
  },

  addRoom(room: FirestoreRoomDocument): void {
    const index = roomsStore.rooms.findIndex((r) => r.id === room.id);

    if (index >= 0) {
      setState("rooms", index, room);
    } else {
      setState("rooms", (prev) => [...prev, room]);
    }
  },
  removeRoom(id: string): void {
    setState("rooms", (prev) => prev.filter((r) => r.id !== id));
  },
  reset(): void {
    setState({
      rooms: [],
      loading: true,
      error: null,
    });
  },
};

export { roomsStore };
