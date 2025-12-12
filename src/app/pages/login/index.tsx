import { Component } from "solid-js";

import { useUserStore } from "@/stores/user";
import LoginCard from "./LoginCard";

const Login: Component = () => {
  const [userStoreState, userStoreActions] = useUserStore();

  return (
    <main
      style={{
        display: "flex",
        "flex-direction": "column",
        flex: 1,
        "justify-content": "center",
        "align-items": "center",
      }}>
      <LoginCard
        username={userStoreState.username}
        saveUsername={userStoreActions.updateUsername}
      />
    </main>
  );
};

export default Login;
