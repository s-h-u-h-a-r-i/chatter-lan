import { createStore } from "solid-js/store";
import { FirestoreRoomDocument } from "@/models/room";
import { roomsStore } from "./rooms";
import { roomEvents, RoomEventType } from "@/events/room";

type SelectedRoomState = {
  roomId: string | null;
  loading: boolean;
  error: string | null;
};

type SelectedRoomStore = typeof selectedRoomStore;

const [state, setState] = createStore<SelectedRoomState>({
  roomId: null,
  loading: false,
  error: null,
});

roomEvents.subscribe((event) => {
  if (event.type === RoomEventType.Removed && state.roomId === event.roomId) {
    setState({
      roomId: null,
      error: "Selected room was removed",
    });
  }
});

const selectedRoomStore = {
  // #region State Getters
  get roomId(): string | null {
    return state.roomId;
  },

  get room(): FirestoreRoomDocument | null {
    if (state.roomId === null) {
      return null;
    }
    return roomsStore.getRoomById(state.roomId);
  },

  get loading(): boolean {
    return state.loading;
  },

  get error(): string | null {
    return state.error;
  },
  // #endregion State Getters

  // #region State Setters
  set loading(loading: boolean) {
    setState("loading", loading);
  },

  setError(error: string) {
    setState({
      error,
      loading: false,
    });
  },
  // #endregion State Setters

  // #region Error Handling
  clearError(): void {
    setState("error", null);
  },
  // #endregion Error Handling

  // #region Selection Actions
  selectRoom(roomId: string): void {
    setState({
      roomId,
      error: null,
    });
  },

  clearRoom(): void {
    setState({
      roomId: null,
      error: null,
    });
  },

  clearSelection(): void {
    setState({
      roomId: null,
      loading: false,
      error: null,
    });
  },
  // #endregion Selection Actions
};

export { selectedRoomStore, type SelectedRoomStore };
