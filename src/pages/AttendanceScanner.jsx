import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const AttendanceScanner = () => {
  const [history, setHistory] = useState([]);
  const [manualId, setManualId] = useState("");
  const [manualStatus, setManualStatus] = useState("Sign-In");
  const scannerRef = useRef(null);
  const lastScannedRef = useRef("");

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, [startScanner, stopScanner]);

  const markAttendance = async (id, statusOption) => {
    const scannedId = id.replace(/\s/g, "").trim().toLowerCase();

    try {
      const q = query(
        collection(db, "users"),
        where("generatedIdLowercase", "==", scannedId)
      );
      const querySnap = await getDocs(q);

      let newEntry;
      if (querySnap.empty) {
        newEntry = {
          participantName: "User not found",
          generatedId: scannedId,
          status: "-",
          time: new Date().toLocaleTimeString(),
        };
      } else {
        const studentDoc = querySnap.docs[0];
        const studentData = studentDoc.data();
        let updateData = {};
        const now = new Date();

        switch (statusOption) {
          case "Sign-In":
            updateData = { signIn: serverTimestamp() };
            break;
          case "Sign-Out":
            updateData = { signOut: serverTimestamp() };
            break;
          case "Break Out":
            if (!studentData.breaks) studentData.breaks = [];
            updateData = { breaks: arrayUnion({ type: "out", time: serverTimestamp() }) };
            break;
          case "Break In":
            if (!studentData.breaks) studentData.breaks = [];
            updateData = { breaks: arrayUnion({ type: "in", time: serverTimestamp() }) };
            break;
          default:
            break;
        }

        await updateDoc(doc(db, "users", studentDoc.id), updateData);

        newEntry = {
          ...studentData,
          status: statusOption,
          time: now.toLocaleTimeString(),
        };
      }

      setHistory((prev) => [newEntry, ...prev]);
      setManualId(""); // clear input
    } catch (err) {
      console.error("Attendance error:", err);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    if (!decodedText) return;
    const scannedId = decodedText.replace(/\s/g, "").trim().toLowerCase();
    if (scannedId === lastScannedRef.current) return;
    lastScannedRef.current = scannedId;

    // Auto determine status based on time
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    let statusOption = "Sign-In";
    if (minutes < 570) statusOption = "Sign-In";
    else if (minutes >= 960) statusOption = "Sign-Out";
    else statusOption = "Break Out/In";

    await markAttendance(scannedId, statusOption === "Break Out/In" ? "Break Out" : statusOption);
  };

  const startScanner = async () => {
    if (scannerRef.current) return;

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 300, disableFlip: false },
        handleScanSuccess
      );
    } catch (err) {
      console.error("Camera start failed:", err);
      alert("Camera permission denied or not available.");
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try {
      const state = scannerRef.current.getState();
      if (state === "STOPPED") return;
      await scannerRef.current.stop();
      await scannerRef.current.clear();
      scannerRef.current = null;
    } catch (err) {
      console.warn("Scanner stop error:", err);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Camera */}
      <div
        id="qr-reader"
        style={{
          width: "90vw",
          maxWidth: 360,
          height: "90vw",
          maxHeight: 360,
          border: "2px solid #ccc",
          borderRadius: 10,
        }}
      ></div>

      {/* Manual input */}
      <div style={{ marginTop: 15, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <input
          type="text"
          placeholder="Enter ID manually"
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          style={{ padding: 8, width: 200, borderRadius: 5, border: "1px solid #ccc" }}
        />
        <select value={manualStatus} onChange={(e) => setManualStatus(e.target.value)} style={{ padding: 8, borderRadius: 5 }}>
          <option>Sign-In</option>
          <option>Sign-Out</option>
          <option>Break Out</option>
          <option>Break In</option>
        </select>
        <button
          onClick={() => manualId && markAttendance(manualId, manualStatus)}
          style={{ padding: "8px 16px", borderRadius: 5, backgroundColor: "#28a745", color: "white", border: "none", cursor: "pointer" }}
        >
          Submit
        </button>
      </div>

      {/* Table */}
      <div style={{ marginTop: 20, width: "95%", maxWidth: 400, maxHeight: 300, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eee" }}>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>Name</th>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>ID</th>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>Status</th>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={index} style={{ backgroundColor: index === 0 ? "#d4edda" : "white" }}>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>{item.participantName}</td>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>{item.generatedId}</td>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>{item.status}</td>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceScanner;
// File intentionally left blank. Scanner removed to resolve build errors.
