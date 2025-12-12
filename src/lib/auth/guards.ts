import { useNavigate } from "@solidjs/router";

import { getStorageItem } from "../storage";

export const requireAuth = () => {
  const navigate = useNavigate();

  return () => {
    const userName = getStorageItem("appUserName");

    if (!userName) {
      navigate("/login", { replace: true });
      return Promise.reject(new Error("Need User Name"));
    }

    return Promise.resolve();
  };
};
