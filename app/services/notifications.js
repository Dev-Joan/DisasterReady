import * as Notifications from 'expo-notifications';
export const DAILY_TASK_REMINDER_ID = 'local-daily-task-reminder';
export const COME_BACK_NUDGE_ID = 'local-come-back-nudge';
const DAILY_TASK_REMINDER_TIME = {
  hour: 9,
  minute: 0
};
const COME_BACK_NUDGE_TIME = {
  hour: 18,
  minute: 30
};
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });
}
export async function requestNotificationPermission() {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}
async function scheduleDaily(identifier, hour, minute, content) {
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier,
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute
    }
  });
}
export async function cancelLocalReminders() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_TASK_REMINDER_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(COME_BACK_NUDGE_ID).catch(() => {});
}
export async function syncLocalReminders(enabled) {
  if (!enabled) {
    await cancelLocalReminders();
    return false;
  }
  const granted = await requestNotificationPermission();
  if (!granted) {
    await cancelLocalReminders();
    return false;
  }
  await scheduleDaily(DAILY_TASK_REMINDER_ID, DAILY_TASK_REMINDER_TIME.hour, DAILY_TASK_REMINDER_TIME.minute, {
    title: '📋 Your daily prep task is ready',
    body: 'Takes about 2 minutes - keep your streak alive.'
  });
  await scheduleDaily(COME_BACK_NUDGE_ID, COME_BACK_NUDGE_TIME.hour, COME_BACK_NUDGE_TIME.minute, {
    title: '🔥 Come back and keep learning',
    body: "You haven't checked in today - a quick lesson or quiz keeps you sharp."
  });
  return true;
}
export async function sendTestNotification(secondsFromNow = 5) {
  const granted = await requestNotificationPermission();
  if (!granted) throw new Error('Notification permission not granted');
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Test notification',
      body: `Scheduled ${secondsFromNow}s ago - if you see this, local delivery works.`
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
      repeats: false
    }
  });
}
