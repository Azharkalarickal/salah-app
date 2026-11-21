// Web Notifications & Audio Chime helper

// Gentle synthesizer chime using Web Audio API (works without external mp3 files)
export function playChime(type = 'takbeer') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    if (type === 'takbeer' || type === 'chime') {
      // Harmonic pleasant bell tone
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.6); // G5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.exponentialRampToValueAtTime(329.63, now + 0.4);

      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 2.0);
    }
  } catch (err) {
    console.warn('Audio playback not permitted or supported:', err);
  }
}

// Request Notification Permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  const permission = await Notification.requestPermission();
  return permission;
}

// Trigger browser notification with action buttons and optional sound
export function showNotification({ title, body, icon = '/icon.svg', prayer, sound = true, actions = [] }) {
  if (sound) {
    playChime('chime');
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [200, 100, 200],
          data: { prayer, timestamp: Date.now() },
          actions: actions.length > 0 ? actions : [
            { action: 'mark-prayed', title: '✓ I Prayed' },
          ],
        });
      });
    } else {
      new Notification(title, {
        body,
        icon,
      });
    }
  } catch (e) {
    console.error('Error triggering notification:', e);
  }
}
