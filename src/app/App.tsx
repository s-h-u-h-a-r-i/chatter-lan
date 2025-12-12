import { useLocation, useNavigate } from "@solidjs/router";
import { createEffect, Suspense, type ParentComponent } from "solid-js";

import { UserStoreProvider, useUserStore } from "@/stores/user";

const AppContent: ParentComponent = (props) => {
  const [userState] = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(() => {
    if (!userState.username && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
    if (userState.username && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  });

  return <Suspense>{props.children}</Suspense>;
};

const App: ParentComponent = (props) => {
  return (
    <UserStoreProvider>
      <AppContent>{props.children}</AppContent>
    </UserStoreProvider>
  );
};

export default App;
