import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CreateRoomSheet } from '@/components/sheets';
import { Colors } from '@/design/tokens';
import { useThemedStyles } from '@/design/theme';
import { useDemo } from '@/stores/demo-store';

export default function CreateRoomScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const segments = useSegments();
  const isFocused = segments[segments.length - 1] === 'create';
  const { with: withFriendId } = useLocalSearchParams<{ with?: string }>();
  const { me, people, circles, addRoom } = useDemo();
  const leave = (go: () => void) => {
    router.setParams({ with: undefined });
    go();
  };

  return (
    <View style={styles.root}>
      <CreateRoomSheet
        key={withFriendId ?? 'everyone'}
        withFriendId={withFriendId}
        visible={isFocused}
        creatorId={me.id}
        circles={circles}
        people={people}
        onClose={() => leave(() => router.replace('/(tabs)'))}
        onCreate={(room) => {
          void addRoom(room)
            .then((roomId) =>
              leave(() => router.replace({ pathname: '/room/[id]', params: { id: roomId, fresh: '1' } })),
            )
            .catch(() => leave(() => router.replace('/(tabs)')));
        }}
      />
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({ root: { flex: 1, backgroundColor: colors.canvas } });
