import {
  createContext,
  onCleanup,
  ParentComponent,
  useContext,
} from 'solid-js';

import { CryptoService } from './crypto.service';

const CryptoServiceContext = createContext<CryptoService>();

export const CryptoServiceProvider: ParentComponent = (props) => {
  const service = new CryptoService();

  onCleanup(() => {
    service.destroy();
  });

  return (
    <CryptoServiceContext.Provider value={service}>
      {props.children}
    </CryptoServiceContext.Provider>
  );
};

export function useCryptoService() {
  const service = useContext(CryptoServiceContext);
  if (!service) {
    throw new Error(
      'useCryptoService must be used within CryptoServiceProvider'
    );
  }
  return service;
}
