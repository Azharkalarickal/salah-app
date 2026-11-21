// Synthesized Bell Ring & Local Custom Tune Audio Engine

let ringtoneInterval = null;
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

// 1. Crystal Clear Realistic Bell Ring Synthesizer
export function playBellRing() {
  // Check if user has uploaded a custom local audio tune
  const customTune = localStorage.getItem('salah_custom_audio');
  if (customTune) {
    try {
      const audio = new Audio(customTune);
      audio.play().catch((e) => console.log('Custom audio autoplay notice:', e));
      return;
    } catch (e) {}
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonic strike frequencies for a brass prayer bell
    const partials = [
      { freq: 880, gain: 0.4, decay: 2.2 },  // Fundamental A5
      { freq: 1760, gain: 0.25, decay: 1.8 }, // Octave
      { freq: 2640, gain: 0.15, decay: 1.4 }, // Tierce
      { freq: 3520, gain: 0.08, decay: 0.9 }, // Quint
    ];

    partials.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.008); // sharp attack
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay); // natural ringing decay

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay);
    });
  } catch (err) {
    console.warn('Bell ring notice:', err);
  }
}

// 2. Authentic Smartphone Call Ringtone Melody
export function playPhoneRingtoneCycle() {
  // Check custom tune first
  const customTune = localStorage.getItem('salah_custom_audio');
  if (customTune) {
    try {
      const audio = new Audio(customTune);
      audio.play().catch(() => {});
      return;
    } catch (e) {}
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 659.25, time: 0.0, dur: 0.12 }, // E5
    { freq: 587.33, time: 0.15, dur: 0.12 }, // D5
    { freq: 739.99, time: 0.30, dur: 0.14 }, // F#5
    { freq: 830.61, time: 0.48, dur: 0.14 }, // G#5
    { freq: 554.37, time: 0.65, dur: 0.12 }, // C#5
    { freq: 493.88, time: 0.80, dur: 0.12 }, // B4
    { freq: 587.33, time: 0.95, dur: 0.14 }, // D5
    { freq: 659.25, time: 1.12, dur: 0.14 }, // E5
    { freq: 493.88, time: 1.30, dur: 0.12 }, // B4
    { freq: 440.00, time: 1.45, dur: 0.12 }, // A4
    { freq: 554.37, time: 1.60, dur: 0.14 }, // C#5
    { freq: 659.25, time: 1.78, dur: 0.14 }, // E5
    { freq: 880.00, time: 1.95, dur: 0.35 }, // A5
  ];

  const now = ctx.currentTime;

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0.001, now + time);
    gain.gain.exponentialRampToValueAtTime(0.35, now + time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur + 0.05);
  });
}

// Start continuous phone ringtone loop
export function startRingtone() {
  stopRingtone();
  playPhoneRingtoneCycle();

  ringtoneInterval = setInterval(() => {
    playPhoneRingtoneCycle();
    if (navigator.vibrate) {
      try {
        navigator.vibrate([500, 250, 500, 250]);
      } catch (e) {}
    }
  }, 3200);
}

// Stop ringtone
export function stopRingtone() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
}

export function playConnectedTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.6);
}

export const playChime = playBellRing;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return await Notification.requestPermission();
}

export function showNotification({ title, body, icon = '/icon.svg', prayer, sound = true }) {
  if (sound) {
    playBellRing();
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') return null;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [300, 150, 300],
          data: { prayer, timestamp: Date.now() },
          actions: [
            { action: 'mark-prayed', title: '✓ I Prayed' },
          ],
        });
      });
    } else {
      new Notification(title, { body, icon });
    }
  } catch (e) {
    console.error('Error triggering notification:', e);
  }
}

// ==========================================
// 24/7 BACKGROUND KEEP-ALIVE & WAKELOCK
// ==========================================
let wakeLockSentinel = null;
let backgroundKeepAliveInterval = null;

export async function requestScreenWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (e) {
      console.warn('Wake Lock request notice:', e);
      return false;
    }
  }
  return false;
}

export function releaseScreenWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().catch(() => {});
    wakeLockSentinel = null;
  }
}

// Inaudible periodic audio heartbeat to prevent Android & iOS browser thread suspension
export function startBackgroundAudioKeepAlive() {
  stopBackgroundAudioKeepAlive();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    backgroundKeepAliveInterval = setInterval(() => {
      try {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(25, ctx.currentTime);
        gain.gain.setValueAtTime(0.00001, ctx.currentTime); // Inaudible
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {}
    }, 25000);
  } catch (err) {
    console.warn('Keep-alive audio notice:', err);
  }
}

export function stopBackgroundAudioKeepAlive() {
  if (backgroundKeepAliveInterval) {
    clearInterval(backgroundKeepAliveInterval);
    backgroundKeepAliveInterval = null;
  }
}
