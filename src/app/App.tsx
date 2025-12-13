import { useLocation, useNavigate } from '@solidjs/router';
import { createEffect, Suspense, type ParentComponent } from 'solid-js';

import { UserStoreProvider, useUserStore } from '@/stores/user';

const AppContent: ParentComponent = (props) => {
  const [userState] = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(() => {
    const isLoggedIn = !!userState.username;
    const isOnLogin = location.pathname === '/login';

    if (!isLoggedIn && !isOnLogin) {
      navigate('/login', { replace: true });
    } else if (isLoggedIn && isOnLogin) {
      navigate('/', { replace: true });
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
