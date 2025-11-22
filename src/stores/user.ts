import { getStorageItem, setStorageItem } from "@/utils/storage";
import { createStore } from "solid-js/store";

type UserState = {
  userName: string | null;
};

function getInitialUserName(): string | null {
  const stored = getStorageItem("appUserName");
  const trimmed = stored?.trim();
  return trimmed !== undefined && trimmed !== "" ? trimmed : null;
}

function saveUserName(name: string) {
  setStorageItem("appUserName", name);
}

const [state, setState] = createStore<UserState>({
  userName: getInitialUserName(),
});

const userStore = {
  get userName(): string | null {
    return state.userName;
  },
  set userName(name: string) {
    const trimmed = name.trim();
    if (trimmed !== "") {
      setState("userName", trimmed);
      saveUserName(trimmed);
    }
  },
};

export { userStore };
