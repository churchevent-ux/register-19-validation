import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import ReactDOM from "react-dom";

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Capitalize first letter of each word
  const capitalizeName = (name) =>
    name
      ? name
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleEdit = (id) => alert(`Edit user with ID ${id}`);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelectedUsers((prev) => prev.filter((uid) => uid !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const getMedicalText = (user) => {
    if (!user.medicalConditions?.length) return null;
    const conditions = user.medicalConditions.join(", ");
    return user.medicalNotes ? `${conditions} (${user.medicalNotes})` : conditions;
  };

  const filteredUsers = users.filter((user) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "online" && user.inSession) ||
      (filter === "offline" && !user.inSession);
    const matchesSearch =
      user.participantName?.toLowerCase().includes(search.toLowerCase()) ||
      user.uniqueId?.toString().includes(search) ||
      user.studentId?.toString().includes(search);
    return matchesFilter && matchesSearch;
  });

  const handleBulkPrint = async () => {
    const selected = users.filter((u) => selectedUsers.includes(u.id) && (u.uniqueId || u.studentId));
    if (!selected.length) return alert("Please select at least one user with a valid ID");

    try {
      const dataUrls = [];

      for (let user of selected) {
        const card = document.createElement("div");
        Object.assign(card.style, {
          width: "300px",
          padding: "20px",
          border: "2px solid #6c3483",
          borderRadius: "12px",
          textAlign: "center",
          background: "#fff",
        });

        card.innerHTML = `
          <h3 style="margin:5px;color:#6c3483">${capitalizeName(user.participantName)}</h3>
          <p style="margin:5px;font-weight:bold">ID: ${user.uniqueId || user.studentId}</p>
          <div id="qr-${user.id}"></div>
        `;

        const qrDiv = card.querySelector(`#qr-${user.id}`);
        if (qrDiv) {
          const tempDiv = document.createElement("div");
          qrDiv.appendChild(tempDiv);
          ReactDOM.render(<QRCodeSVG value={user.studentId.toString()} size={120} />, tempDiv);
        }

        const dataUrl = await toPng(card);
        dataUrls.push(dataUrl);
      }

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head><title>Print ID Cards</title></head>
          <body style="display:flex;flex-wrap:wrap;justify-content:center">
            ${dataUrls.map((url) => `<img src="${url}" style="margin:10px;width:300px;height:auto"/>`).join("")}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (err) {
      console.error("Error generating bulk print:", err);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👥 Registered Users</h2>

      <div style={styles.controls}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.select}>
          <option value="all">All</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <input
          type="text"
          placeholder="🔍 Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {selectedUsers.length > 0 && (
        <button onClick={handleBulkPrint} style={styles.bulkButton}>
          🖨️ Print Selected ({selectedUsers.length})
        </button>
      )}

      <div style={styles.cardsWrapper}>
        {filteredUsers.length ? (
          filteredUsers.map((user, index) => {
            const medicalText = getMedicalText(user);
            const hasMedical = !!medicalText;

            return (
              <div key={user.id} style={styles.cardWrapper}>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleSelectUser(user.id)}
                  style={styles.checkbox}
                />

                <div
                  style={{
                    ...styles.card,
                    opacity: hasMedical ? 0.95 : 1,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  className="user-card"
                >
                  <div style={styles.headerRow}>
                    <span style={styles.index}>#{index + 1}</span>
                    <span
                      style={{
                        ...styles.status,
                        backgroundColor: user.inSession ? "#27ae60" : "#7f8c8d",
                      }}
                    >
                      {user.inSession ? "Online" : "Offline"}
                    </span>
                  </div>

                  <h3
                    style={{
                      ...styles.name,
                      fontStyle: hasMedical ? "italic" : "normal",
                      color: hasMedical ? "#c0392b" : "#2980b9",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                  >
                    {capitalizeName(user.participantName)}
                  </h3>

                  <p style={styles.detail}>
                    <b>ID:</b> {user.studentId}
                  </p>
                  <p style={styles.detail}>
                    <b>Email:</b> {user.email}
                  </p>
                  <p style={styles.detail}>
                    <b>Phone:</b> {user.contactFatherMobile}
                  </p>
                  <p style={styles.detail}>
                    <b>Address:</b> {user.residence}
                  </p>

                  {hasMedical && <p style={styles.healthBadge}>⚠ {medicalText}</p>}

                  <div style={styles.actions}>
                    <FaEdit style={styles.editIcon} onClick={() => handleEdit(user.id)} />
                    <FaTrash style={styles.deleteIcon} onClick={() => handleDelete(user.id)} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={styles.noUsers}>No users found.</div>
        )}
      </div>
    </div>
  );
};

// ---------- Styles ----------
const styles = {
  container: { padding: 20, fontFamily: "'Arial', sans-serif", background: "#f9f9f9" },
  title: { marginBottom: 20, fontSize: 24, fontWeight: 700, color: "#2c3e50" },
  controls: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  select: { padding: 8, fontSize: 14, borderRadius: 6, border: "1px solid #ccc" },
  searchInput: { padding: 8, fontSize: 14, borderRadius: 6, border: "1px solid #ccc", flex: 1, minWidth: 200 },
  bulkButton: { padding: "8px 16px", marginBottom: 20, backgroundColor: "#6c3483", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  cardsWrapper: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 },
  cardWrapper: { position: "relative", paddingLeft: 28 },
  checkbox: { position: "absolute", top: 16, left: 0, width: 18, height: 18, cursor: "pointer" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #eee",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    position: "relative",
  },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  index: { fontSize: 14, fontWeight: 600, color: "#7f8c8d" },
  status: { fontSize: 12, fontWeight: 600, color: "#fff", padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" },
  name: { fontSize: 20, fontWeight: 700, margin: "8px 0" },
  detail: { fontSize: 14, margin: "4px 0", color: "#555" },
  healthBadge: { marginTop: 8, padding: "6px 10px", backgroundColor: "#e74c3c", color: "#fff", borderRadius: 6, fontSize: 14, fontWeight: 600 },
  actions: { display: "flex", gap: 12, marginTop: 12 },
  editIcon: { color: "#27ae60", cursor: "pointer", fontSize: 18 },
  deleteIcon: { color: "#c0392b", cursor: "pointer", fontSize: 18 },
  noUsers: { textAlign: "center", padding: 20, color: "#7f8c8d" },
};

export default Users;
