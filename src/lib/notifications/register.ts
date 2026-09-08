import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'needs_setup' | 'unavailable';

function easProjectId() {
  return Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId ?? null;
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'unavailable';
  if (!easProjectId()) return 'needs_setup';
  const notifications = await import('expo-notifications');
  const permissions = await notifications.getPermissionsAsync();
  return permissions.status;
}

export async function registerForPushNotificationsAsync(options: { requestPermission?: boolean } = {}) {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;
  const projectId = easProjectId();
  if (!projectId) return null;
  const notifications = await import('expo-notifications');
  if (Platform.OS === 'android') await notifications.setNotificationChannelAsync('default', { name: 'Yubrio', importance: notifications.AndroidImportance.DEFAULT, vibrationPattern: [0, 180], lightColor: '#D9F96B' });
  const current = await notifications.getPermissionsAsync();
  const permissions = current.status === 'granted' || options.requestPermission === false ? current : await notifications.requestPermissionsAsync();
  if (permissions.status !== 'granted') return null;
  const token = await notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}
