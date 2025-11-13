import React, { useState, useEffect } from "react";

// Dummy data with multiple dates
const breakData = {
  "2025-09-25": [
    { id: "S001", name: "Alice", breakIn: "10:00", breakOut: "10:30", emergencyPhone: "0501234567" },
    { id: "S002", name: "Bob", breakIn: "11:00", breakOut: null, emergencyPhone: "0502345678" },
    { id: "S003", name: "Charlie", breakIn: "09:45", breakOut: "10:10", emergencyPhone: "0503456789" }
  ],
  "2025-09-26": [
    { id: "S004", name: "David", breakIn: "10:15", breakOut: null, emergencyPhone: "0504567890" },
    { id: "S005", name: "Eve", breakIn: "11:30", breakOut: "11:50", emergencyPhone: "0505678901" },
    { id: "S006", name: "Evee", breakIn: "11:30", breakOut: "12:50", emergencyPhone: "0505678901" }
  ],
  "2025-09-27": [
    { id: "S007", name: "Frank", breakIn: "09:50", breakOut: null, emergencyPhone: "0506789012" }
  ]
};

// Convert 24h time to Date object
const getBreakTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const dt = new Date();
  dt.setHours(hours, minutes, 0, 0);
  return dt;
};

// Get elapsed minutes for ongoing break
const getElapsedMinutes = (breakIn) => {
  const now = new Date();
  const breakTime = getBreakTime(breakIn);
  return (now - breakTime) / 60000;
};

// Row color based on elapsed break time
const getRowColor = (breakIn, breakOut) => {
  if (breakOut) return "transparent";
  const minutes = getElapsedMinutes(breakIn);
  if (minutes < 60) return "rgba(255,0,0,0.1)";
  const extra = minutes - 60;
  const intensity = Math.min(1, extra / 60 + 0.3);
  return `rgba(255,0,0,${intensity})`;
};

// Format time with AM/PM and session
const formatTimeWithSession = (timeStr) => {
  if (!timeStr) return "";
  let [hours, minutes] = timeStr.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  let session = hours < 12 ? "Morning" : hours < 17 ? "Afternoon" : "Evening";
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2,"0")} ${ampm} (${session})`;
};

const BreakPage = () => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [timer, setTimer] = useState(0);

  // Live update every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setTimer((prev) => prev + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort data for selected date using useMemo
  const breaksForDate = React.useMemo(() => {
    let arr = breakData[selectedDate] || [];
    arr = arr.filter(
      s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Sort: ongoing breaks on top
    arr.sort((a, b) => (!a.breakOut && b.breakOut ? -1 : a.breakOut && !b.breakOut ? 1 : 0));
    return arr;
  }, [selectedDate, searchQuery]);

  // Notifications for >1 hour break
  useEffect(() => {
    const alerts = [];
    breaksForDate.forEach((s) => {
      if (!s.breakOut && getElapsedMinutes(s.breakIn) > 60) {
        alerts.push(`⚠️ ${s.name} (ID: ${s.id}) has been on break for over 1 hour!`);
      }
    });
    setNotifications(alerts);
  }, [breaksForDate, timer]);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", background: "#f4f6f8", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", fontSize: "28px", marginBottom: "20px" }}>Break Out</h1>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: "20px", color: "red", fontWeight: "bold" }}>
          {notifications.map((note, idx) => <div key={idx}>{note}</div>)}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "15px", marginBottom: "20px" }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: "10px 15px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px", flex: "1 1 200px", cursor: "pointer" }}
        />
        <input
          type="text"
          placeholder="Search student or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "10px 15px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px", flex: "1 1 250px" }}
        />
        <button
          onClick={() => setSelectedDate(today)}
          style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#4CAF50", color: "#fff", cursor: "pointer", fontSize: "16px" }}
        >
          Live
        </button>
      </div>

      {/* Break Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <thead>
            <tr style={{ background: "#FF9800", color: "#fff", textAlign: "center" }}>
              <th style={{ padding: "12px" }}>SL No</th>
              <th style={{ padding: "12px" }}>Student ID</th>
              <th style={{ padding: "12px" }}>Student Name</th>
              <th style={{ padding: "12px" }}>Break In</th>
              <th style={{ padding: "12px" }}>Break Out</th>
              <th style={{ padding: "12px" }}>Emergency Phone</th>
              <th style={{ padding: "12px" }}>Break Duration</th>
            </tr>
          </thead>
          <tbody>
            {breaksForDate.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "20px", textAlign: "center", color: "#888", fontStyle: "italic" }}>
                  {selectedDate ? "No break records for this day." : "Select a date or click Live to see today's breaks."}
                </td>
              </tr>
            ) : (
              breaksForDate.map((s, idx) => {
                const elapsed = !s.breakOut ? Math.floor(getElapsedMinutes(s.breakIn)) : null;
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #ddd", backgroundColor: getRowColor(s.breakIn, s.breakOut) }}>
                    <td style={{ padding: "12px", textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: "12px", textAlign: 'center' }}>{s.id}</td>
                    <td style={{ padding: "12px", textAlign: 'center' }}>{s.name}</td>
                    <td style={{ padding: "12px", textAlign: 'center', color: "green", fontWeight: "500" }}>{formatTimeWithSession(s.breakIn)}</td>
                    <td style={{ padding: "12px", textAlign: 'center', color: s.breakOut ? "green" : "red", fontWeight: "500" }}>
                      {s.breakOut ? formatTimeWithSession(s.breakOut) : "On Break"}
                    </td>
                    <td style={{ padding: "12px", textAlign: 'center', color: s.breakOut ? "#000" : "red", fontWeight: s.breakOut ? "400" : "500" }}>{s.emergencyPhone}</td>
                    <td style={{ padding: "12px", textAlign: 'center', color: s.breakOut ? "#000" : "red", fontWeight: "500" }}>
                      {elapsed !== null ? `${elapsed} min` : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BreakPage;
