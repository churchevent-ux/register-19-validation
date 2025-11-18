import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { db } from "../firebase";
import Logo from "../images/bcst.jpeg";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const cardRef = useRef();
  const buttonRef = useRef();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, [id]);

  if (!user) return <div style={styles.notFound}>User not found</div>;

  const getMedicalText = () => {
    if (!user.medicalConditions?.length) return "None";
    const conditions = user.medicalConditions.join(", ");
    return user.medicalNotes ? `${conditions} (${user.medicalNotes})` : conditions;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    if (buttonRef.current) buttonRef.current.style.display = "none";
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, backgroundColor: "#fff" });
      const fileName = (user.participantName || user.name || "user")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${fileName}_ID.png`;
      link.click();

      const userDocRef = doc(db, "users", id);
      await updateDoc(userDocRef, { idGenerated: true, idGeneratedAt: new Date() });
    } catch (err) {
      console.error("Error generating ID image:", err);
    } finally {
      if (buttonRef.current) buttonRef.current.style.display = "inline-block";
    }
  };

  const handlePrint = () => {
    if (!cardRef.current) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print ID Card</title>
          <style>
            body { margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#f5f5f5; }
          </style>
        </head>
        <body>
          ${cardRef.current.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        ← Back
      </button>

      <h2 style={styles.heading}>User Details</h2>

      <div style={styles.contentWrapper}>
        {/* User Info Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.tableLabel}>Name</td>
                <td style={styles.tableValue}>{user.participantName || user.name}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>ID</td>
                <td style={styles.tableValue}>{user.uniqueId || user.studentId || user.id}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Email</td>
                <td style={styles.tableValue}>{user.email}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Phone</td>
                <td style={styles.tableValue}>{user.contactFatherMobile || user.phone}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Address</td>
                <td style={styles.tableValue}>{user.residence || user.address}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Status</td>
                <td style={styles.tableValue}>{user.inSession ? "Online" : "Offline"}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Medical Issue</td>
                <td style={styles.tableValue}>{getMedicalText()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ID Card */}
        <div style={styles.cardWrapper}>
          <h3 style={styles.cardHeading}>User ID Card</h3>
          <div ref={cardRef} style={styles.card}>
            <div style={styles.logoSection}>
              <img src={Logo} alt="Logo" style={styles.logo} />
              <h3 style={styles.organization}>Malayalee Catholic Community</h3>
              <p style={styles.subText}>St. Mary’s Church, Dubai</p>
              <p style={styles.subTextSmall}>P.O. BOX: 51200, Dubai, U.A.E</p>
            </div>

            <h2 style={{ ...styles.name, fontStyle: user.medicalConditions?.length ? "italic" : "normal" }}>
              {user.participantName || user.name}
            </h2>
            <p style={styles.idText}>{user.uniqueId || user.studentId || user.id}</p>

            <div style={styles.qrWrapper}>
              <QRCodeCanvas value={user.uniqueId || user.studentId || user.id} size={150} />
            </div>
            {/* <p style={styles.addressText}>{user.residence || user.address}</p> */}
          </div>

          <div style={styles.buttonWrapper}>
            <button ref={buttonRef} onClick={handleDownload} style={styles.downloadBtn}>
              Download ID
            </button>
            <button onClick={handlePrint} style={styles.printBtn}>
              Print ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Responsive Styles ----------
const styles = {
  container: { padding: 20, fontFamily: "Arial, sans-serif" },
  notFound: { padding: 20 },
  backButton: {
    marginBottom: 20,
    padding: "8px 16px",
    border: "1px solid #6c3483",
    borderRadius: 6,
    background: "#f5f5f5",
    cursor: "pointer",
  },
  heading: { marginBottom: 20 },
  contentWrapper: {
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
  },
  tableContainer: {
    flex: "1 1 300px",
    maxWidth: 400,
    minWidth: 250,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  tableLabel: { border: "1px solid #ccc", padding: "8px 12px", fontWeight: "bold", background: "#f9f9f9", width: "35%" },
  tableValue: { border: "1px solid #ccc", padding: "8px 12px" },
  cardWrapper: { flex: "1 1 320px", maxWidth: 360, minWidth: 280, textAlign: "center" },
  cardHeading: { marginBottom: 15 },
  card: {
    width: "100%",
    padding: 20,
    border: "2px solid #6c3483",
    borderRadius: 12,
    textAlign: "center",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  logoSection: { marginBottom: 12 },
  logo: { maxWidth: 80, marginBottom: 6 },
  organization: { margin: "4px 0", fontSize: 15, color: "#2c3e50" },
  subText: { margin: "2px 0", fontSize: 13, color: "#555" },
  subTextSmall: { margin: "2px 0", fontSize: 12, color: "#777" },
  name: { margin: 5, color: "#6c3483" },
  idText: { margin: 5, fontWeight: "bold" },
  qrWrapper: { marginTop: 15 },
  addressText: { fontSize: 12, color: "#555", marginTop: 12 },
  buttonWrapper: { marginTop: 20, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  downloadBtn: { padding: "10px 20px", background: "#6c3483", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
  printBtn: { padding: "10px 20px", background: "#117864", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
};

export default UserDetails;
