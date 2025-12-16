import { useNavigate } from '@solidjs/router';
import { createEffect, type ParentComponent } from 'solid-js';

const App: ParentComponent = (props) => {
  const navigate = useNavigate();

  createEffect(() => {
    if (window.location.pathname === '/') {
      navigate('/rooms', { replace: true });
    }
  });

  return props.children;
};

export default App;
