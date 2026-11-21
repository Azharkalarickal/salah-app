# 🕌 Salah & Quran Habit Tracker

A modern, mobile-first web application designed to help Muslims observe daily prayers on time, track prayer completion, receive gentle motivational follow-up reminders, and maintain a consistent daily Quran reading habit.

---

## ✨ Features

- **⏰ Automated & Custom Prayer Times**:
  - Automatic calculation via GPS or city using verified calculation methods (Karachi, MWL, ISNA, Umm al-Qura, Egyptian).
  - Manual override toggle to enter your local Masjid's exact azan times.
  - Asr juristic calculation: Standard (Shafi'i/Maliki/Hanbali) vs Hanafi.
  - Manual minute adjustment sliders (+/- offsets).
- **✅ "I Prayed" Habit Tracker**:
  - One-tap check-in with celebratory confetti and status tracking (*On Time*, *Jama'ah*, *Late / Qadha*, *Missed*).
  - Live countdown timer for the upcoming prayer.
- **💬 Smart Motivational Follow-up Notifications**:
  - Scheduled alerts at prayer times.
  - If a prayer is **not marked as completed** within your chosen window (e.g., 30 mins after Azan), an encouraging Quranic verse or Hadith notification is sent.
- **📖 Daily Quran Reading Tracker**:
  - Daily target tracker (pages / surah) with streak counter (🔥).
  - Daily customizable Quran reminder time.
- **📱 Mobile-First PWA (Progressive Web App)**:
  - Ergonomic bottom navigation for single-handed use.
  - Installable on iOS (Safari "Add to Home Screen") and Android (Chrome) as a native-like standalone app.
  - Gentle Web Audio synthesized chimes (works without external audio downloads).
- **🗄️ Remote MySQL Database**:
  - Persists all settings, prayer logs, streaks, and motivational quotes in a remote MySQL database.

---

## 🚀 How to Run Locally

### 1. Prerequisites
- Node.js (v18 or higher)
- npm

### 2. Setup Environment
Ensure `.env` exists in the root folder with:
```env
PORT=5000
DB_HOST=srv932.hstgr.io
DB_PORT=3306
DB_USER=u918480384_salah
DB_PASSWORD=mydaY@1997
DB_NAME=u918480384_salah
NODE_ENV=development
```

### 3. Install & Start
```bash
# Install root backend dependencies
npm install

# Build client and start the production server
npm run build
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🌐 Deploy to Render

### Option A: Using Render Blueprints (`render.yaml`)
1. Push this repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository.
5. In the Environment Variables section, fill in `DB_PASSWORD`: `mydaY@1997`.
6. Click **Apply**!

### Option B: Manual Web Service on Render
1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `DB_HOST`: `srv932.hstgr.io`
   - `DB_PORT`: `3306`
   - `DB_USER`: `u918480384_salah`
   - `DB_NAME`: `u918480384_salah`
   - `DB_PASSWORD`: `mydaY@1997`
   - `NODE_ENV`: `production`
5. Click **Create Web Service**!
