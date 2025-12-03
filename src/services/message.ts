import { FirestoreMessageDocument } from "@/models/message";
import { MessageRepository } from "@/repositories/messages";
import { ipStore, IpStore } from "@/stores/ip";
import { messagesStore, MessagesStore } from "@/stores/messages";
import { DocumentChange, Unsubscribe } from "firebase/firestore";

class MessageService {
  #messageRepository: MessageRepository;
  #messagesStore: MessagesStore;
  #ipStore: IpStore;
  #unsubscribe?: Unsubscribe;
  #currentRoomId: string | null = null;

  constructor(
    messageRepository: MessageRepository,
    messagesStore: MessagesStore,
    ipStore: IpStore
  ) {
    this.#messageRepository = messageRepository;
    this.#messagesStore = messagesStore;
    this.#ipStore = ipStore;
  }

  async subscribeToMessages(roomId: string): Promise<void> {
    if (this.#currentRoomId === roomId) {
      return;
    }

    this.cleanup();

    if (this.#ipStore.userIp === null) {
      this.#messagesStore.error = "IP address not available";
      this.#messagesStore.loading = false;
      return;
    }

    this.#currentRoomId = roomId;
    this.#messagesStore.loading = true;

    const result = await this.#messageRepository.onMessageChanges(
      this.#ipStore.userIp,
      roomId,
      this.#handleMessageDocumentChange
    );

    this.#unsubscribe = result
      .tapErr((error) => {
        this.#messagesStore.error = error.message;
      })
      .ok();

    this.#messagesStore.loading = false;
  }

  cleanup(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    this.#currentRoomId = null;
    this.#messagesStore.reset();
  }

  #handleMessageDocumentChange(change: DocumentChange): void {
    switch (change.type) {
      case "added":
      case "modified": {
        const result = FirestoreMessageDocument.from(change.doc);
        if (result.isOk()) {
          this.#messagesStore.addMessage(result.value);
        } else {
          // eslint-disable-next-line no-console
          console.warn(result.error);
        }
        break;
      }
      case "removed": {
        this.#messagesStore.removeMessage(change.doc.id);
        break;
      }
    }
  }
}

export const messageService = new MessageService(
  new MessageRepository(),
  messagesStore,
  ipStore
);
