import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Medicine, RootStackParamList } from '../types';
import { getMedicines, deleteMedicine, toggleMedicineActive } from '../utils/storage';
import { cancelNotifications, requestPermissions, scheduleNotifications } from '../utils/notifications';
import MedicineCard from '../components/MedicineCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getMedicines();
    setMedicines(data);
  }, []);

  useEffect(() => {
    requestPermissions();
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (medicine: Medicine) => {
    Alert.alert(
      'Delete Medicine',
      `Remove ${medicine.name} and all its reminders?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cancelNotifications(medicine.notificationIds);
            await deleteMedicine(medicine.id);
            load();
          },
        },
      ],
    );
  };

  const handleToggle = async (medicine: Medicine) => {
    await cancelNotifications(medicine.notificationIds);
    const updated = await toggleMedicineActive(medicine.id);
    if (updated?.active) {
      const ids = await scheduleNotifications(updated);
      updated.notificationIds = ids;
      const { saveMedicine } = await import('../utils/storage');
      await saveMedicine(updated);
    }
    load();
  };

  const activeMeds = medicines.filter((m) => m.active).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MediAlert 💊</Text>
          <Text style={styles.subtitle}>
            {medicines.length === 0
              ? 'No medicines yet'
              : `${activeMeds} active reminder${activeMeds !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddMedicine', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <MedicineCard
            medicine={item}
            onPress={() => navigation.navigate('AddMedicine', { medicine: item })}
            onToggle={() => handleToggle(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyTitle}>No medicines added yet</Text>
            <Text style={styles.emptyText}>Tap "+ Add" to add your first medicine reminder.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#F0F4FF',
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1E3A8A' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  addBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  list: { paddingTop: 4, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
});
