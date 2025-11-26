import { Match, onCleanup, onMount, Switch, type Component } from "solid-js";

import UserNameInput from "./components/user-name-input";
import { ipService } from "./services/ip";
import { roomService } from "./services/room";
import { ipStore } from "./stores/ip";
import { roomsStore } from "./stores/rooms";
import { userStore } from "./stores/user";
import { ErrorMessage, Loading } from "./components/ui";

const App: Component = () => {
  const isLoading = () => ipStore.loading || roomsStore.loading;
  const hasError = () => ipStore.error ?? roomsStore.error;
  const isReady = () => userStore.userName !== null && ipStore.userIp !== null;

  onMount(async () => {
    try {
      await ipService.initializeUserIp();
      await roomService.subscribeToRoomChanges();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `App initialization failed`,
        error instanceof Error ? error.message : String(error)
      );
    }
  });

  onCleanup(() => {
    roomService.cleanup();
  });

  return (
    <Switch>
      <Match when={userStore.userName === null}>
        <UserNameInput />
      </Match>
      <Match when={isLoading()}>
        <Loading
          message={ipStore.loading ? "Loading IP..." : "Loading Rooms..."}
        />
      </Match>
      <Match when={hasError()}>
        <ErrorMessage
          message={
            ipStore.error ?? roomsStore.error ?? "Unknown error occurred"
          }
        />
      </Match>
      <Match when={isReady()}>
        <p>
          Hello: {userStore.userName}, with IP: {ipStore.userIp}
        </p>
        <pre>{JSON.stringify(roomsStore.rooms, undefined, 2)}</pre>
      </Match>
    </Switch>
  );
};

export default App;
