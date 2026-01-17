import { signInAnonymously } from 'firebase/auth';
import {
  Accessor,
  createContext,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  Match,
  ParentComponent,
  Switch,
  useContext,
} from 'solid-js';

import { auth } from '@/core/firebase';
import { IpConsentModal, UserNameModal } from './ui';
import { fetchPublicIp } from './user.service';

interface UserStoreContext {
  ip: Accessor<string>;
  uid: Accessor<string>;
  name: Accessor<string>;

  setName(name: string): void;
}

const USERNAME_STORAGE_KEY = 'chatter-lan-username';

const UserStoreContext = createContext<UserStoreContext>();

const UserStoreProvider: ParentComponent = (props) => {
  const [name, setName] = createSignal(
    localStorage.getItem(USERNAME_STORAGE_KEY)
  );
  const [ip, setIp] = createSignal<string | undefined>();

  const [authData] = createResource(async () => {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user.uid;
  });

  const ready = createMemo(() => {
    const a = authData();
    const n = name();
    const i = ip();
    return a && n && i ? { uid: a, name: n, ip: i } : null;
  });

  const handleIpSubmit = async (manualIp?: string) => {
    if (manualIp) {
      setIp(manualIp);
    } else {
      const fetchedIp = await fetchPublicIp();
      setIp(fetchedIp);
    }
  };

  createEffect(() => {
    const newName = name();
    if (newName) {
      localStorage.setItem(USERNAME_STORAGE_KEY, newName);
    }
  });

  return (
    <Switch>
      <Match when={!ip()}>
        <IpConsentModal
          onConsent={handleIpSubmit}
          onManualEntry={handleIpSubmit}
        />
      </Match>

      <Match when={!name()}>
        <UserNameModal currentName={null} onSubmit={setName} />
      </Match>

      <Match when={ready()}>
        {(data) => (
          <_UserStoreProviderInner {...data()} setName={setName}>
            {props.children}
          </_UserStoreProviderInner>
        )}
      </Match>
    </Switch>
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

const _UserStoreProviderInner: ParentComponent<{
  name: string;
  ip: string;
  uid: string;
  setName(name: string): void;
}> = (props) => {
  const context: UserStoreContext = {
    name: () => props.name,
    ip: () => props.ip,
    uid: () => props.uid,
    setName: props.setName,
  };

  return (
    <UserStoreContext.Provider value={context}>
      {props.children}
    </UserStoreContext.Provider>
  );
};
