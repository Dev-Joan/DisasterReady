// ============================================================================
// LOCAL NOTIFICATIONS — device-scheduled reminders, NOT server-pushed alerts.
// ============================================================================
// Everything below uses expo-notifications' *local* scheduling API
// (Notifications.scheduleNotificationAsync with a DAILY trigger, which fires
// entirely on-device via the OS's own notification scheduler). There is no
// push token anywhere in this file, no server endpoint that sends these, and
// no server-side fan-out — the request that turns this on/off
// (POST /onboarding/notifications) only persists a yes/no preference so it
// survives re-login; it never itself delivers a notification.
//
// This is a deliberately different system from this app's "Alerts" feature
// (routes/alerts.js, screens/AlertsScreen.js), which surfaces real
// server-fetched weather/emergency alerts. If a future task is "notify a
// user from the server," this file is the wrong starting point — that needs
// a registered push token and a server-initiated send, neither of which
// exist here by design.
// ============================================================================
import * as Notifications from 'expo-notifications';

export const DAILY_TASK_REMINDER_ID = 'local-daily-task-reminder';
export const COME_BACK_NUDGE_ID = 'local-come-back-nudge';

// Fixed, sensible defaults rather than a user-configurable time picker —
// this feature is "on or off", not a full scheduling UI.
const DAILY_TASK_REMINDER_TIME = { hour: 9, minute: 0 };
const COME_BACK_NUDGE_TIME = { hour: 18, minute: 30 };

// Without a foreground handler, iOS silently swallows a notification that
// fires while the app is already open. Call once at app startup.
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
  // Cancelling first makes this idempotent — calling it again (e.g. on
  // every login) replaces the existing reminder instead of risking a
  // duplicate stacking up under the same identifier.
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier,
    content,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute }
  });
}

export async function cancelLocalReminders() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_TASK_REMINDER_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(COME_BACK_NUDGE_ID).catch(() => {});
}

// The single entry point screens should call — turns both local reminders
// on or off in one step, requesting OS permission the first time it's
// needed. Returns whether reminders actually ended up scheduled (false if
// the user declined the OS permission prompt), so a Settings toggle can
// reflect what's really scheduled rather than just the user's last tap.
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
    body: 'Takes about 2 minutes — keep your streak alive.'
  });
  await scheduleDaily(COME_BACK_NUDGE_ID, COME_BACK_NUDGE_TIME.hour, COME_BACK_NUDGE_TIME.minute, {
    title: '🔥 Come back and keep learning',
    body: "You haven't checked in today — a quick lesson or quiz keeps you sharp."
  });
  return true;
}

// Manual verification helper: schedules a one-off local notification a few
// seconds out so a real device or simulator can confirm delivery actually
// fires end to end (this can't be verified from a server/CLI environment —
// local notifications are delivered by the OS on the device itself). Wired
// into Settings as "Send test notification", not automatic.
export async function sendTestNotification(secondsFromNow = 5) {
  const granted = await requestNotificationPermission();
  if (!granted) throw new Error('Notification permission not granted');
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Test notification',
      body: `Scheduled ${secondsFromNow}s ago — if you see this, local delivery works.`
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsFromNow, repeats: false }
  });
}
