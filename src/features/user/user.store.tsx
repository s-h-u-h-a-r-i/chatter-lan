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
import { UserNameModal } from './ui';
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

  const [authData] = createResource(async () => {
    const [userCredential, publicIp] = await Promise.all([
      signInAnonymously(auth),
      fetchPublicIp(),
    ]);

    return {
      uid: userCredential.user.uid,
      ip: publicIp,
    };
  });

  createEffect(() => {
    const newName = name();
    if (newName) {
      localStorage.setItem(USERNAME_STORAGE_KEY, newName);
    }
  });

  const ready = createMemo(() => {
    const a = authData();
    const n = name();
    return a && n ? { authData: a, name: n } : null;
  });

  return (
    <Switch>
      <Match when={!name()}>
        <UserNameModal isOpen={true} currentName={null} onSubmit={setName} />
      </Match>

      <Match when={ready()}>
        {(data) => (
          <_UserStoreProviderInner
            {...data().authData}
            name={data().name}
            setName={setName}>
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
