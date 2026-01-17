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

// =====================================================================
// Types & Constants
// =====================================================================

interface UserStoreContext {
  ip: Accessor<string>;
  uid: Accessor<string>;
  name: Accessor<string>;

  setName(name: string): void;
}

const USERNAME_STORAGE_KEY = 'chatter-lan-username';
const IP_CONSENT_STORAGE_KEY = 'chatter-lan-ip-consent';

const UserStoreContext = createContext<UserStoreContext>();

// =====================================================================
// Provider Component
// =====================================================================

const UserStoreProvider: ParentComponent = (props) => {
  const authState = useAuth();
  const ipManagement = useIp();
  const username = useUsername();

  const ready = createMemo(() => {
    const uid = authState.uid();
    const name = username.name();
    const ip = ipManagement.ip();

    if (!uid || !name || !ip) return null;

    return { uid, name, ip };
  });

  return (
    <Switch>
      <Match when={!ipManagement.ip()}>
        <IpConsentModal
          onConsent={ipManagement.handleIpSubmit}
          onManualEntry={ipManagement.handleIpSubmit}
        />
      </Match>

      <Match when={!username.name()}>
        <UserNameModal currentName={null} onSubmit={username.setName} />
      </Match>

      <Match when={ready()}>
        {(data) => (
          <UserStoreProviderInner {...data()} setName={username.setName}>
            {props.children}
          </UserStoreProviderInner>
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

// =====================================================================
// Inner Provider
// =====================================================================

const UserStoreProviderInner: ParentComponent<{
  uid: string;
  name: string;
  ip: string;
  setName(name: string): void;
}> = (props) => {
  const context: UserStoreContext = {
    uid: () => props.uid,
    name: () => props.name,
    ip: () => props.ip,
    setName: props.setName,
  };

  return (
    <UserStoreContext.Provider value={context}>
      {props.children}
    </UserStoreContext.Provider>
  );
};

// =====================================================================
// Local Storage Utilities
// =====================================================================

const storage = {
  getUsername: () => localStorage.getItem(USERNAME_STORAGE_KEY),
  setUsername: (name: string) =>
    localStorage.setItem(USERNAME_STORAGE_KEY, name),
  getIpConsent: () => localStorage.getItem(IP_CONSENT_STORAGE_KEY) === 'true',
  setIpConsent: (consent: boolean) => {
    if (consent) {
      localStorage.setItem(IP_CONSENT_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(IP_CONSENT_STORAGE_KEY);
    }
  },
};

// =====================================================================
// Auth Hook
// =====================================================================

function useAuth() {
  const [authData] = createResource(async () => {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user.uid;
  });

  return {
    uid: authData,
  };
}

// =====================================================================
// IP Management Hook
// =====================================================================

function useIp() {
  const [ip, setIp] = createSignal<string | undefined>();
  const [ipConsentGiven, setIpConsentGiven] = createSignal(
    storage.getIpConsent()
  );
  const [ipError, setIpError] = createSignal<string | null>(null);

  createResource(
    () => ipConsentGiven() && !ip(),
    async () => {
      try {
        const fetchedIp = await fetchPublicIp();
        setIp(fetchedIp);
        setIpError(null);
      } catch (error) {
        console.error('Failed to auto-fetch IP:', error);
        setIpError(
          error instanceof Error ? error.message : 'Failed to fetch IP'
        );
        setIpConsentGiven(false);
        storage.setIpConsent(false);
      }
    }
  );

  const handleIpSubmit = async (manualIp?: string) => {
    setIpError(null);

    try {
      if (manualIp) {
        setIp(manualIp);
      } else {
        const fetchedIp = await fetchPublicIp();
        setIp(fetchedIp);
        setIpConsentGiven(true);
        storage.setIpConsent(true);
      }
    } catch (error) {
      setIpError(error instanceof Error ? error.message : 'Failed to fetch IP');
      throw error;
    }
  };

  return {
    ip,
    ipError,
    ipConsentGiven,
    handleIpSubmit,
  };
}

// =====================================================================
// Username Management Hook
// =====================================================================

function useUsername() {
  const [name, setName] = createSignal(storage.getUsername());

  createEffect(() => {
    const newName = name();
    if (newName) {
      storage.setUsername(newName);
    }
  });

  return {
    name,
    setName,
  };
}
