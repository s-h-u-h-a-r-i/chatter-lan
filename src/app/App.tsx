import { useNavigate } from '@solidjs/router';
import { createEffect, type ParentComponent } from 'solid-js';

import { RoomsStoreProvider } from '@/store/rooms';
import { UserStoreProvider } from '@/store/user';

const App: ParentComponent = (props) => {
  const navigate = useNavigate();

  createEffect(() => {
    if (window.location.pathname === '/') {
      navigate('/rooms', { replace: true });
    }
  });

  return (
    <UserStoreProvider>
      <RoomsStoreProvider>{props.children}</RoomsStoreProvider>;
    </UserStoreProvider>
  );
};

export default App;
