import React, { useState } from 'react';
import { Settings, MapPin, Bell, Volume2, Save, Sliders, Check, Clock } from 'lucide-react';
import { playBellRing } from '../utils/notifications';

export default function SettingsTab({
  settings,
  onSaveSettings,
  onTestNotif,
  onTestCallAlert,
  onOpenEditTimes,
}) {
  const [form, setForm] = useState({
    city: settings?.city || 'Mecca',
    country: settings?.country || 'Saudi Arabia',
    latitude: settings?.latitude || 21.4225,
    longitude: settings?.longitude || 39.8262,
    calculation_method: settings?.calculation_method || 'MuslimWorldLeague',
    asr_juristic: settings?.asr_juristic || 'standard',
    use_custom_times: Boolean(settings?.use_custom_times),
    custom_fajr: settings?.custom_fajr?.slice(0, 5) || '05:00',
    custom_dhuhr: settings?.custom_dhuhr?.slice(0, 5) || '12:30',
    custom_asr: settings?.custom_asr?.slice(0, 5) || '15:45',
    custom_maghrib: settings?.custom_maghrib?.slice(0, 5) || '18:15',
    custom_isha: settings?.custom_isha?.slice(0, 5) || '19:45',
    followup_reminder_minutes: settings?.followup_reminder_minutes || 30,
    early_reminder_minutes: settings?.early_reminder_minutes || 10,
    enable_notifications: settings?.enable_notifications ?? true,
    enable_sound: settings?.enable_sound ?? true,
    sound_type: settings?.sound_type || 'takbeer',
  });

  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          city: 'My Location',
          country: 'Local',
        }));
        setLocating(false);
      },
      (err) => {
        alert('Could not retrieve location: ' + err.message);
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24 text-xs">
      {/* Location & Calculation Method */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wider">
            <MapPin size={15} className="text-emerald-400" />
            <span>Location & Calculation</span>
          </div>
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 rounded-lg font-semibold active:scale-95 disabled:opacity-50"
          >
            {locating ? 'Locating...' : 'Use GPS'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-400 block mb-1">City Name</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Country</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-400 block mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Calculation Method</label>
          <select
            value={form.calculation_method}
            onChange={(e) => setForm({ ...form, calculation_method: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Karachi">University of Islamic Sciences, Karachi</option>
            <option value="MuslimWorldLeague">Muslim World League (MWL)</option>
            <option value="NorthAmerica">ISNA (North America)</option>
            <option value="UmmAlQura">Umm al-Qura University, Makkah</option>
            <option value="Egyptian">Egyptian General Authority</option>
            <option value="Dubai">Dubai</option>
            <option value="MoonsightingCommittee">Moonsighting Committee Worldwide</option>
            <option value="Kuwait">Kuwait</option>
            <option value="Qatar">Qatar</option>
            <option value="Singapore">Singapore (MUIS)</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Asr Juristic Method (Madhab)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, asr_juristic: 'standard' })}
              className={`py-2 rounded-xl border text-center font-semibold transition ${
                form.asr_juristic === 'standard'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Standard (Shafi'i/Hanbali/Maliki)
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, asr_juristic: 'hanafi' })}
              className={`py-2 rounded-xl border text-center font-semibold transition ${
                form.asr_juristic === 'hanafi'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Hanafi
            </button>
          </div>
        </div>
      </div>

      {/* Manual Prayer Times Override */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wider">
            <Sliders size={15} className="text-emerald-400" />
            <span>Custom Local Times</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.use_custom_times}
              onChange={(e) => setForm({ ...form, use_custom_times: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        <p className="text-slate-400">
          Enable this to enter your local Masjid's exact azan times manually instead of automatic calculation.
        </p>

        {form.use_custom_times && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
            {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
              <div key={p}>
                <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">{p}</label>
                <input
                  type="time"
                  value={form[`custom_${p}`]}
                  onChange={(e) => setForm({ ...form, [`custom_${p}`]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification & Follow-up Settings */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wider">
            <Bell size={15} className="text-emerald-400" />
            <span>Follow-up & Alerts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onTestCallAlert}
              className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 rounded-lg font-semibold active:scale-95 flex items-center gap-1"
            >
              <span>📞 Test Call</span>
            </button>
            <button
              type="button"
              onClick={onTestNotif}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold active:scale-95"
            >
              Push
            </button>
          </div>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">
            Follow-up Reminder if Salah is NOT updated:
          </label>
          <select
            value={form.followup_reminder_minutes}
            onChange={(e) => setForm({ ...form, followup_reminder_minutes: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value={15}>15 minutes after Azan</option>
            <option value={20}>20 minutes after Azan</option>
            <option value={30}>30 minutes after Azan (Recommended)</option>
            <option value={45}>45 minutes after Azan</option>
            <option value={60}>60 minutes after Azan</option>
          </select>
          <span className="text-[11px] text-slate-500 mt-1 block">
            If you haven't marked "I Did My Salah", you will receive an encouraging motivational reminder.
          </span>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Early Preparation Alert</label>
          <select
            value={form.early_reminder_minutes}
            onChange={(e) => setForm({ ...form, early_reminder_minutes: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value={0}>Disabled</option>
            <option value={5}>5 minutes before</option>
            <option value={10}>10 minutes before</option>
            <option value={15}>15 minutes before</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-300">Play Alert Chime / Tone</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.enable_sound}
              onChange={(e) => setForm({ ...form, enable_sound: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Custom Local Audio Tune Upload */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <label className="text-slate-300 font-semibold block">
            Custom Local Notification Tune (MP3 / Audio)
          </label>
          <p className="text-[11px] text-slate-400">
            Upload your own local Azan or chime from your device to play for alerts.
          </p>

          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-center text-xs truncate">
              <span>{localStorage.getItem('salah_custom_audio_name') || '📁 Choose Audio File'}</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const dataUrl = event.target?.result;
                      if (dataUrl) {
                        try {
                          localStorage.setItem('salah_custom_audio', dataUrl);
                          localStorage.setItem('salah_custom_audio_name', file.name);
                          alert(`Custom tune "${file.name}" saved!`);
                          onTestNotif();
                        } catch (err) {
                          alert('File too large for local cache. Please select an audio under 4MB.');
                        }
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>

            {localStorage.getItem('salah_custom_audio') && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('salah_custom_audio');
                  localStorage.removeItem('salah_custom_audio_name');
                  alert('Reset to default bell ring!');
                }}
                className="px-2.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={() => playBellRing()}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-800/50 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95"
              title="Test realistic brass bell ring"
            >
              <span>🔔 Bell Ring</span>
            </button>
          </div>
        </div>

        {/* Change Adhan Times Quick Access */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onOpenEditTimes}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Clock size={15} />
            <span>Change My Daily Adhan Times</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition"
      >
        {saved ? <Check size={18} /> : <Save size={18} />}
        <span>{saved ? 'Saved Successfully!' : 'Save All Settings'}</span>
      </button>
    </form>
  );
}
