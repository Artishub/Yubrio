import { useRouter, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CreateRoomSheet } from '@/components/sheets';
import { colors } from '@/design/tokens';
import { useDemo } from '@/stores/demo-store';

export default function CreateRoomScreen() {
  const router = useRouter();
  const segments = useSegments();
  const isFocused = segments[segments.length - 1] === 'create';
  const { me, people, circles, addRoom } = useDemo();

  return <View style={styles.root}>
    <CreateRoomSheet
      visible={isFocused}
      creatorId={me.id}
      circles={circles}
      people={people}
      onClose={() => router.replace('/(tabs)')}
      onCreate={(room) => {
        void addRoom(room).then((roomId) => router.replace({ pathname: '/room/[id]', params: { id: roomId } })).catch(() => router.replace('/(tabs)'));
      }}
    />
  </View>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.canvas } });
