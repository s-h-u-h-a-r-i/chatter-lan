import { RoomsStoreProvider } from '@/store/rooms';
import { useNavigate } from '@solidjs/router';
import { createEffect, type ParentComponent } from 'solid-js';

const App: ParentComponent = (props) => {
  const navigate = useNavigate();

  createEffect(() => {
    if (window.location.pathname === '/') {
      navigate('/rooms', { replace: true });
    }
  });

  return <RoomsStoreProvider>{props.children}</RoomsStoreProvider>;
};

export default App;
