import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Medicine, RootStackParamList, Frequency } from '../types';
import { saveMedicine } from '../utils/storage';
import { cancelNotifications, scheduleNotifications } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMedicine'>;

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function AddMedicineScreen({ navigation, route }: Props) {
  const existing = route.params?.medicine;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [dosage, setDosage] = useState(existing?.dosage ?? '');
  const [instructions, setInstructions] = useState(existing?.instructions ?? '');
  const [reminderType, setReminderType] = useState<'one-time' | 'recurring'>(existing?.reminderType ?? 'recurring');
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency ?? 'daily');
  const [times, setTimes] = useState<string[]>(existing?.times ?? ['08:00']);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(existing?.daysOfWeek ?? [1, 2, 3, 4, 5]);
  const [scheduledDate, setScheduledDate] = useState<Date>(
    existing?.scheduledDate ? new Date(existing.scheduledDate) : new Date(Date.now() + 3600000),
  );
  const [color, setColor] = useState(existing?.color ?? COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Medicine' : 'Add Medicine' });
  }, [isEdit, navigation]);

  const openTimePicker = (index: number) => {
    const [h, m] = times[index].split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    setPickerDate(d);
    setEditingTimeIndex(index);
    setShowTimePicker(true);
  };

  const onTimePicked = (_: unknown, date?: Date) => {
    setShowTimePicker(false);
    if (!date || editingTimeIndex === null) return;
    const updated = [...times];
    updated[editingTimeIndex] = formatTime(date);
    setTimes(updated);
  };

  const addTime = () => {
    if (times.length >= 6) return;
    setTimes([...times, '12:00']);
  };

  const removeTime = (index: number) => {
    if (times.length === 1) return;
    setTimes(times.filter((_, i) => i !== index));
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Missing info', 'Please enter the medicine name.'); return; }
    if (!dosage.trim()) { Alert.alert('Missing info', 'Please enter the dosage.'); return; }
    if (reminderType === 'recurring' && times.length === 0) {
      Alert.alert('Missing info', 'Please add at least one reminder time.');
      return;
    }
    if (reminderType === 'recurring' && frequency !== 'daily' && daysOfWeek.length === 0) {
      Alert.alert('Missing info', 'Please select at least one day.');
      return;
    }

    setSaving(true);
    try {
      if (existing) await cancelNotifications(existing.notificationIds);

      const medicine: Medicine = {
        id: existing?.id ?? generateId(),
        name: name.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim(),
        reminderType,
        frequency: reminderType === 'recurring' ? frequency : undefined,
        times: reminderType === 'recurring' ? times : [],
        daysOfWeek: reminderType === 'recurring' && frequency !== 'daily' ? daysOfWeek : undefined,
        scheduledDate: reminderType === 'one-time' ? scheduledDate.toISOString() : undefined,
        active: true,
        color,
        notificationIds: [],
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };

      const ids = await scheduleNotifications(medicine);
      medicine.notificationIds = ids;
      await saveMedicine(medicine);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save medicine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Medicine Info */}
        <Text style={styles.sectionLabel}>Medicine Info</Text>
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Medicine name *" value={name} onChangeText={setName} placeholderTextColor="#9CA3AF" />
          <View style={styles.divider} />
          <TextInput style={styles.input} placeholder="Dosage (e.g. 500mg, 1 tablet) *" value={dosage} onChangeText={setDosage} placeholderTextColor="#9CA3AF" />
          <View style={styles.divider} />
          <TextInput style={styles.input} placeholder="Instructions (e.g. Take with food)" value={instructions} onChangeText={setInstructions} placeholderTextColor="#9CA3AF" />
        </View>

        {/* Reminder Type */}
        <Text style={styles.sectionLabel}>Reminder Type</Text>
        <View style={styles.card}>
          <View style={styles.segmentRow}>
            {(['one-time', 'recurring'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.segment, reminderType === type && styles.segmentActive]}
                onPress={() => setReminderType(type)}
              >
                <Text style={[styles.segmentText, reminderType === type && styles.segmentTextActive]}>
                  {type === 'one-time' ? '📅 One-time' : '🔁 Recurring'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* One-time: Date & Time */}
        {reminderType === 'one-time' && (
          <>
            <Text style={styles.sectionLabel}>Schedule Date & Time</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.timeRow} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.timeLabel}>Date & Time</Text>
                <Text style={styles.timeValue}>
                  {scheduledDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="datetime"
                minimumDate={new Date()}
                onChange={(_, d) => { setShowDatePicker(false); if (d) setScheduledDate(d); }}
              />
            )}
          </>
        )}

        {/* Recurring: Frequency */}
        {reminderType === 'recurring' && (
          <>
            <Text style={styles.sectionLabel}>Frequency</Text>
            <View style={styles.card}>
              <View style={styles.freqRow}>
                {(['daily', 'weekly', 'custom'] as Frequency[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
                    onPress={() => setFrequency(f)}
                  >
                    <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Days of week (weekly / custom) */}
            {(frequency === 'weekly' || frequency === 'custom') && (
              <>
                <Text style={styles.sectionLabel}>Days of Week</Text>
                <View style={styles.card}>
                  <View style={styles.daysRow}>
                    {DAYS.map((day, index) => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayBtn, daysOfWeek.includes(index) && styles.dayBtnActive]}
                        onPress={() => toggleDay(index)}
                      >
                        <Text style={[styles.dayText, daysOfWeek.includes(index) && styles.dayTextActive]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Times */}
            <Text style={styles.sectionLabel}>Reminder Times</Text>
            <View style={styles.card}>
              {times.map((time, index) => (
                <View key={index}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.timeRow}>
                    <TouchableOpacity style={styles.timePickerBtn} onPress={() => openTimePicker(index)}>
                      <Text style={styles.timeValue}>⏰ {time}</Text>
                    </TouchableOpacity>
                    {times.length > 1 && (
                      <TouchableOpacity onPress={() => removeTime(index)} style={styles.removeTimeBtn}>
                        <Text style={styles.removeTimeText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              {times.length < 6 && (
                <TouchableOpacity style={styles.addTimeBtn} onPress={addTime}>
                  <Text style={styles.addTimeText}>+ Add another time</Text>
                </TouchableOpacity>
              )}
            </View>
            {showTimePicker && (
              <DateTimePicker
                value={pickerDate}
                mode="time"
                is24Hour
                onChange={onTimePicked}
              />
            )}
          </>
        )}

        {/* Color */}
        <Text style={styles.sectionLabel}>Pill Color</Text>
        <View style={styles.card}>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : isEdit ? 'Update Medicine' : 'Save Medicine'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4, marginTop: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 12 },
  input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827' },
  segmentRow: { flexDirection: 'row', padding: 6, gap: 6 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#F3F4F6' },
  segmentActive: { backgroundColor: '#2563EB' },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  segmentTextActive: { color: '#FFF' },
  freqRow: { flexDirection: 'row', padding: 10, gap: 8 },
  freqBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#F3F4F6' },
  freqBtnActive: { backgroundColor: '#DBEAFE', borderWidth: 1.5, borderColor: '#2563EB' },
  freqText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  freqTextActive: { color: '#2563EB' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  dayBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  dayBtnActive: { backgroundColor: '#2563EB' },
  dayText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  dayTextActive: { color: '#FFF' },
  timeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  timeLabel: { flex: 1, fontSize: 15, color: '#374151' },
  timePickerBtn: { flex: 1 },
  timeValue: { fontSize: 15, fontWeight: '600', color: '#2563EB' },
  removeTimeBtn: { padding: 4 },
  removeTimeText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
  addTimeBtn: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  addTimeText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: '#1E3A8A', transform: [{ scale: 1.2 }] },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
