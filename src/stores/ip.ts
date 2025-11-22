import { createStore } from "solid-js/store";

type IpState = {
  userIp: string | null;
  loading: boolean;
  error: string | null;
};

function isValidIp(ip: string): boolean {
  const ipv4Pattern =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Pattern =
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^([0-9a-fA-F]{1,4}:){0,7}:$/;

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

const [state, setState] = createStore<IpState>({
  userIp: null,
  loading: true,
  error: null,
});

const ipStore = {
  get userIp(): string | null {
    return state.userIp;
  },
  set userIp(ip: string) {
    if (isValidIp(ip)) {
      setState("userIp", ip);
    }
  },
  get loading(): boolean {
    return state.loading;
  },
  set loading(loading: boolean) {
    setState("loading", loading);
  },
  get error(): string | null {
    return state.error;
  },
  set error(error: string) {
    setState("error", error);
  },

  reset(): void {
    setState({
      userIp: null,
      loading: true,
      error: null,
    });
  },
};

export { ipStore };
