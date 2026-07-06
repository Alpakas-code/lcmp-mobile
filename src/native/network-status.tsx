import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean;
  isOffline: boolean;
};

const initialNetworkState: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  isOffline: false
};

const NetworkStatusContext = createContext<NetworkState>(initialNetworkState);

export function NetworkStatusProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialNetworkState);

  useEffect(() => {
    return NetInfo.addEventListener((netState) => {
      const isConnected = netState.isConnected !== false;
      const isInternetReachable = netState.isInternetReachable !== false;
      const isOffline = !isConnected || !isInternetReachable;
      onlineManager.setOnline(!isOffline);
      setState({ isConnected, isInternetReachable, isOffline });
    });
  }, []);

  const value = useMemo(() => state, [state]);

  return <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>;
}

export function useNetworkStatus() {
  return useContext(NetworkStatusContext);
}
