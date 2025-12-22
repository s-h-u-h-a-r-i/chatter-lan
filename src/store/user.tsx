import { createContext, ParentComponent, useContext } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

interface UserState {
  ip: string | null;
  userName: string | null;
}

class UserStore {
  constructor(
    private state: UserState,
    private setState: SetStoreFunction<UserState>
  ) {}

  get ip(): string | null {
    return this.state.ip;
  }

  get userName(): string | null {
    return this.state.userName;
  }

  set ip(ip: string) {
    this.setState('ip', ip);
  }

  set userName(name: string) {
    this.setState('userName', name);
  }
}

const UserStoreContext = createContext<UserStore>();

const UserStoreProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<UserState>({
    ip: null,
    userName: null,
  });

  const context = new UserStore(state, setState);

  return (
    <UserStoreContext.Provider value={context}>
      {props.children}
    </UserStoreContext.Provider>
  );
};

function useUserStore() {
  const context = useContext(UserStoreContext);
  if (!context) {
    throw new Error('useUserStore must be used within a UserStoreProvider');
  }
  return context;
}

export { UserStoreProvider, useUserStore };
