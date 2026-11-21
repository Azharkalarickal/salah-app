// Web Notifications & Synthesized Audio Ringtone / Chimes

let activeRingtoneInterval = null;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play single gentle chime
export function playChime(type = 'takbeer') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.6); // G5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(261.63, now); // C4
    osc2.frequency.exponentialRampToValueAtTime(329.63, now + 0.4);

    gainNode.gain.setValueAtTime(0.35, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);
  } catch (err) {
    console.warn('Audio chime notice:', err);
  }
}

// Start phone-like repeating ringtone for Incoming Prayer Call alert
export function startRingtone() {
  stopRingtone();
  playChime();

  // Repeating harmonic ringtone every 2.5 seconds
  activeRingtoneInterval = setInterval(() => {
    playChime();
    if (navigator.vibrate) {
      try {
        navigator.vibrate([400, 200, 400]);
      } catch (e) {}
    }
  }, 2500);
}

// Stop ringtone
export function stopRingtone() {
  if (activeRingtoneInterval) {
    clearInterval(activeRingtoneInterval);
    activeRingtoneInterval = null;
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

// Trigger browser notification
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
          vibrate: [300, 150, 300],
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
