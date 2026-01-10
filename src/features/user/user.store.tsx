import { signInAnonymously } from 'firebase/auth';
import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  Match,
  onMount,
  ParentComponent,
  Switch,
  useContext,
} from 'solid-js';

import { auth } from '@/core/firebase';
import { required } from '@/core/utils/signal.utils';
import { UserNameModal } from './ui';
import { fetchPublicIp } from './user.service';

interface UserStoreContext {
  ip: Accessor<string>;
  uid: Accessor<string>;
  name: Accessor<string>;
  loading: Accessor<boolean>;
  error: Accessor<string | null>;

  setName(name: string): void;
}

const USERNAME_STORAGE_KEY = 'chatter-lan-username';

const UserStoreContext = createContext<UserStoreContext>();

const UserStoreProvider: ParentComponent = (props) => {
  const [ip, setIp] = createSignal<string | undefined>();
  const [uid, setUid] = createSignal<string | undefined>();
  const [name, setName] = createSignal<string | undefined>();
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    const storedName = localStorage.getItem(USERNAME_STORAGE_KEY);
    if (storedName) {
      setName(storedName);
    }

    try {
      const [userCredential, publicIp] = await Promise.all([
        signInAnonymously(auth),
        fetchPublicIp(),
      ]);

      setUid(userCredential.user.uid);
      setIp(publicIp);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to sign in or fetch IP'
      );
    } finally {
      setLoading(false);
    }
  });

  createEffect(() => {
    const newName = name();
    if (newName) {
      localStorage.setItem(USERNAME_STORAGE_KEY, newName);
    }
  });

  const context: UserStoreContext = {
    ip: required(ip, 'IP'),
    uid: required(uid, 'UID'),
    name: required(name, 'Name'),
    loading,
    error,

    setName,
  };

  const ready = () => !loading() && !error() && ip() && uid() && name();

  return (
    <UserStoreContext.Provider value={context}>
      <Switch>
        <Match when={!name()}>
          <UserNameModal
            isOpen={true}
            currentName={name() ?? null}
            onSubmit={setName}
          />
        </Match>
        <Match when={ready()}>{props.children}</Match>
      </Switch>
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
