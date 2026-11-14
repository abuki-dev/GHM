const toMinutes = (timeStr) => {
  // Handles both "10:30" strings and plain numbers like 10
  if (typeof timeStr === "number") return timeStr * 60;
  const [h, m] = String(timeStr).split(":").map(Number);
  return h * 60 + (m || 0);
};
const formatHours = (date) => {
  if (typeof date === "number") {
    return `{ ${String(date).padStart(2, "0")}:00 }`;
  }
  const [h, m] = String(date).split(":").map(Number);
  return `${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
};
module.exports = { toMinutes, formatHours };
