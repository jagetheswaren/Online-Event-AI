import AsyncStorage from '@react-native-async-storage/async-storage';
import { logIfDev } from '@/config';

type NotificationPayload = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

const QUEUE_KEY = 'notification_queue';

const enqueueNotification = async (payload: NotificationPayload) => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const current: NotificationPayload[] = raw ? JSON.parse(raw) : [];
    const next = [payload, ...current].slice(0, 100);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  } catch (error) {
    logIfDev('Failed to enqueue notification payload:', error);
  }
};

export const notificationService = {
  async sendBookingStatusNotification(userName: string, status: 'approved' | 'rejected') {
    await enqueueNotification({
      id: `notify_${Date.now()}`,
      title: `Booking ${status}`,
      body: `Hi ${userName}, your booking was ${status}.`,
      createdAt: new Date().toISOString(),
    });
  },

  async scheduleEventReminder(eventTitle: string, eventDate: string) {
    await enqueueNotification({
      id: `reminder_${Date.now()}`,
      title: 'Upcoming Event Reminder',
      body: `${eventTitle} is scheduled on ${new Date(eventDate).toLocaleDateString()}.`,
      createdAt: new Date().toISOString(),
    });
  },
};
