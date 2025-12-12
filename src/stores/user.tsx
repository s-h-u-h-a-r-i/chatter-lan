import { createContext, ParentComponent, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import { getStorageItem, setStorageItem } from "../lib/storage";

type UserStoreState = {
  username: string | null;
};

type UserStoreActions = {
  updateUsername(newUsername: string): void;
};

const UserStoreContext = createContext<[UserStoreState, UserStoreActions]>();

function getInitialUserName() {
  const stored = getStorageItem("appUserName");
  const trimmed = stored?.trim();
  return trimmed ? trimmed : null;
}

const UserStoreProvider: ParentComponent = (props) => {
  const [userState, setUserState] = createStore<UserStoreState>({
    username: getInitialUserName(),
  });

  const userActions: UserStoreActions = {
    updateUsername(newUsername) {
      const trimmed = newUsername.trim();
      if (!trimmed) return;
      setUserState("username", trimmed);
      setStorageItem("appUserName", trimmed);
    },
  };

  return (
    <UserStoreContext.Provider value={[userState, userActions]}>
      {props.children}
    </UserStoreContext.Provider>
  );
};

function useUserStore() {
  const context = useContext(UserStoreContext);
  if (!context) {
    throw new Error("useUserStore must be used within a UserStoreProvider");
  }
  return context;
}

export { UserStoreProvider, useUserStore };
