// Helper to convert 24h "HH:mm" to 12h "h:mm AM/PM"
export function formatTime12(time24) {
  if (!time24) return '--:--';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);

  if (isNaN(hours)) return time24;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12

  return `${hours}:${minutes} ${ampm}`;
}

// Format date to readable local string
export function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
