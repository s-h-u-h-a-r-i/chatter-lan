import { createContext, ParentComponent, useContext } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

interface MessagesState {}

class MessagesStore {
  constructor(
    private state: MessagesState,
    setState: SetStoreFunction<MessagesState>
  ) {}
}

const MessagesStoreContext = createContext<MessagesStore>();

const MessagesStoreProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<MessagesState>({});
  const messagesStore = new MessagesStore(state, setState);

  return (
    <MessagesStoreContext.Provider value={messagesStore}>
      {props.children}
    </MessagesStoreContext.Provider>
  );
};

function useMessagesStore() {
  const context = useContext(MessagesStoreContext);
  if (!context) {
    throw new Error(
      'useMessagesStore must be used within a MessagesStoreProvider'
    );
  }
  return context;
}

export { MessagesStoreProvider, useMessagesStore };
