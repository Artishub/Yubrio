import { Platform } from 'react-native';

export const links = {
  scheme: 'roomhop',
  domains: ['roomhop.com', 'roomhop.app'],
  authCallback: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL ?? 'roomhop://auth/callback',
  publicBaseUrl: process.env.EXPO_PUBLIC_PUBLIC_URL ?? 'https://roomhop.com',
};

export function authCallbackUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return links.authCallback;
}

export function friendInviteUrl(handle: string) {
  return `${links.publicBaseUrl}/add/${encodeURIComponent(handle)}`;
}

export function friendAppUrl(handle: string) {
  return `${links.scheme}://add/${encodeURIComponent(handle)}`;
}
