import { createContext, onMount, ParentComponent, useContext } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';

interface UserState {
  ip: string | null;
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

async function fetchPublicIP(): Promise<string> {
  const services = [
    'https://api.ipify.org?format=json',
    'https://api64.ipify.org?format=json',
    'https://ipapi.co/json/',
  ] as const;

  for (const url of services) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const ip = data.ip || data.query;

      if (ip && typeof ip === 'string') {
        return ip;
      }
    } catch (error) {
      // * Try next service
      continue;
    }
  }

  throw new Error(`Failed to fetch IP from ${services.length} services`);
}

const UserStoreProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<UserState>({
    ip: null,
    name: null,
    loading: true,
    error: null,
  });

  onMount(async () => {
    try {
      const ip = await fetchPublicIP();
      setState({ ip, loading: false, error: null });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch IP',
      });
    }
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
