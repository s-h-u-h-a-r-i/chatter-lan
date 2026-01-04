import { signInAnonymously } from 'firebase/auth';
import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  onMount,
  ParentComponent,
  useContext,
} from 'solid-js';

import { auth } from '@/core/firebase';
import { fetchPublicIp } from './user.service';

interface UserStoreContext {
  ip: Accessor<string | null>;
  uid: Accessor<string | null>;
  name: Accessor<string | null>;
  loading: Accessor<boolean>;
  error: Accessor<string | null>;

  setName(name: string): void;
}

const USERNAME_STORAGE_KEY = 'chatter-lan-username';

const UserStoreContext = createContext<UserStoreContext>();

const UserStoreProvider: ParentComponent = (props) => {
  const [ip, setIp] = createSignal<string | null>(null);
  const [uid, setUid] = createSignal<string | null>(null);
  const [name, setName] = createSignal<string | null>(null);
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
    ip,
    uid,
    name,
    loading,
    error,

    setName,
  };

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
