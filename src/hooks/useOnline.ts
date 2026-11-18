import { useNetInfo } from '@react-native-community/netinfo';

/** `true` unless the device is known to be offline. */
export function useOnline(): boolean {
  const net = useNetInfo();
  return net.isConnected !== false && net.isInternetReachable !== false;
}
