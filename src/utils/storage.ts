import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine } from '../types';

const MEDICINES_KEY = '@medialert_medicines';

export async function getMedicines(): Promise<Medicine[]> {
  const json = await AsyncStorage.getItem(MEDICINES_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveMedicine(medicine: Medicine): Promise<void> {
  const medicines = await getMedicines();
  const index = medicines.findIndex((m) => m.id === medicine.id);
  if (index >= 0) {
    medicines[index] = medicine;
  } else {
    medicines.unshift(medicine);
  }
  await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(medicines));
}

export async function deleteMedicine(id: string): Promise<void> {
  const medicines = await getMedicines();
  const filtered = medicines.filter((m) => m.id !== id);
  await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(filtered));
}

export async function toggleMedicineActive(id: string): Promise<Medicine | null> {
  const medicines = await getMedicines();
  const index = medicines.findIndex((m) => m.id === id);
  if (index < 0) return null;
  medicines[index].active = !medicines[index].active;
  await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(medicines));
  return medicines[index];
}
