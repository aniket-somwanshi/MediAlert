import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Medicine } from '../types';
import { formatNextReminder } from '../utils/notifications';

interface Props {
  medicine: Medicine;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export default function MedicineCard({ medicine, onPress, onToggle, onDelete }: Props) {
  return (
    <TouchableOpacity style={[styles.card, !medicine.active && styles.cardInactive]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.colorBar, { backgroundColor: medicine.color }]} />
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.nameBlock}>
            <Text style={[styles.name, !medicine.active && styles.textMuted]}>{medicine.name}</Text>
            <Text style={styles.dosage}>{medicine.dosage}</Text>
          </View>
          <Switch
            value={medicine.active}
            onValueChange={onToggle}
            trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
            thumbColor={medicine.active ? '#2563EB' : '#9CA3AF'}
          />
        </View>
        <View style={styles.footer}>
          <Text style={styles.reminderLabel}>⏰ {formatNextReminder(medicine)}</Text>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.delete}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardInactive: { opacity: 0.6 },
  colorBar: { width: 6 },
  content: { flex: 1, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameBlock: { flex: 1, marginRight: 8 },
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  textMuted: { color: '#6B7280' },
  dosage: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  reminderLabel: { fontSize: 12, color: '#4B5563' },
  delete: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
});
