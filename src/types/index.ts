export type ReminderType = 'one-time' | 'recurring';
export type Frequency = 'daily' | 'weekly' | 'custom';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  reminderType: ReminderType;
  // One-time
  scheduledDate?: string; // ISO string
  // Recurring
  frequency?: Frequency;
  times: string[]; // ["08:00", "20:00"]
  daysOfWeek?: number[]; // 0=Sun … 6=Sat
  startDate?: string;
  endDate?: string;
  active: boolean;
  color: string;
  notificationIds: string[];
  createdAt: string;
}

export type RootStackParamList = {
  Home: undefined;
  AddMedicine: { medicine?: Medicine };
};
