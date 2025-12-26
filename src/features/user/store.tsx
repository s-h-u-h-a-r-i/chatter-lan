import { signInAnonymously } from 'firebase/auth';
import { createContext, onMount, ParentComponent, useContext } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

import { auth } from '../firebase';
import { fetchPublicIp } from './service';

interface UserState {
  ip: string | null;
  uid: string | null;
  name: string | null;
  loading: boolean;
  error: string | null;
}

class UserStore {
  constructor(
    private state: UserState,
    private setState: SetStoreFunction<UserState>
  ) {}

  get ip(): string | null {
    return this.state.ip;
  }

  get name(): string | null {
    return this.state.name;
  }

  get loading(): boolean {
    return this.state.loading;
  }

  get error(): string | null {
    return this.state.error;
  }
}

const UserStoreContext = createContext<UserStore>();

const UserStoreProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<UserState>({
    ip: null,
    uid: null,
    name: null,
    loading: true,
    error: null,
  });

  const userStore = new UserStore(state, setState);

  onMount(async () => {
    try {
      const [userCredential, ip] = await Promise.all([
        signInAnonymously(auth),
        fetchPublicIp(),
      ]);
      const uid = userCredential.user.uid;
      setState({ ip, uid, loading: false, error: null });
    } catch (error) {
      setState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to sign in or fetch IP',
      });
    }
  });

  return (
    <UserStoreContext.Provider value={userStore}>
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
