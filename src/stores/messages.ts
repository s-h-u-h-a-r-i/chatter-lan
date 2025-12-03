import { createStore } from "solid-js/store";

import { FirestoreMessageDocument } from "@/models/message";

type MessagesState = {
  messages: FirestoreMessageDocument[];
  loading: boolean;
  error: string | null;
};

type MessagesStore = typeof messagesStore;

const [state, setState] = createStore<MessagesState>({
  messages: [],
  loading: false,
  error: null,
});

const messagesStore = {
  // #region State Getters
  get messages(): FirestoreMessageDocument[] {
    return state.messages;
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
  set error(error: string) {
    setState("error", error);
  },
  // #endregion State Setters

  // #region Messages Actions
  addMessage(message: FirestoreMessageDocument): void {
    const index = messagesStore.messages.findIndex((m) => m.id === message.id);

    if (index >= 0) {
      setState("messages", index, message);
    } else {
      setState("messages", (prev) => [...prev, message]);
    }
  },

  removeMessage(id: string): void {
    setState("messages", (prev) => prev.filter((m) => m.id !== id));
  },
  // #endregion Messages Actions

  // #region State Reset
  reset(): void {
    setState({
      messages: [],
      loading: false,
      error: null,
    });
  },
  // #endregion State Reset
};

export { messagesStore, type MessagesStore };
