import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, setDoc, getDocs, getDoc, doc, serverTimestamp } from "firebase/firestore";

const MEDICAL_OPTIONS = ["N/A", "Asthma", "Diabetes", "Allergies", "Epilepsy", "Other"];

const Preview = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  /** Utility Functions **/
  const calculateAge = React.useCallback((dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }, []);

  const getCategory = React.useCallback((age) => {
    if (age >= 8 && age <= 12) return { label: "Kids", code: "DGK" };
    if (age >= 13 && age <= 18) return { label: "Teen", code: "DGT" };
    return { label: "Other", code: "DGX" };
  }, []);

  const getCardBackground = (categoryLabel) => {
    switch (categoryLabel) {
      case "Kids": return "#ffe6e6";
      case "Teen": return "#e6f0ff";
      default: return "#f5f5f5";
    }
  };

  /** Map Participant Data **/
  const mapParticipantData = React.useCallback((p) => {
    const age = p.age ?? (p.dob ? calculateAge(p.dob) : null);
    const { label, code } = getCategory(age);
    const medConds = Array.isArray(p.medicalConditions)
      ? p.medicalConditions
      : p.medicalConditions
      ? [p.medicalConditions]
      : []; // empty initially

    return {
      ...p, // Keep all original data including uniqueId
      participantName: p.participantName || p.name || p.siblingName || "",
      dob: p.dob || "",
      age,
      gender: p.gender || "",
      categoryLabel: label,
      categoryCode: code,
      category: p.category || label,
      primaryContactNumber: p.primaryContactNumber || "",
      primaryContactRelation: p.primaryContactRelation || "",
      secondaryContactNumber: p.secondaryContactNumber || "",
      secondaryContactRelationship: p.secondaryContactRelationship || "",
      email: p.email || "",
      medicalConditions: medConds,
      additionalMedicalNotes: p.additionalMedicalNotes || "",
    };
  }, [calculateAge, getCategory]);

  /** Load Participants **/
  useEffect(() => {
    if (!state?.participants?.length) {
      alert("Session expired. Please re-submit the form.");
      navigate("/");
      return;
    }
    setParticipants(state.participants.map(mapParticipantData));
  }, [state, mapParticipantData]);

  /** Handlers **/
  const handleChange = (index, field, value) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      if (field === "dob") {
        const age = calculateAge(value);
        const { label, code } = getCategory(age);
        updated[index].age = age;
        updated[index].categoryLabel = label;
        updated[index].categoryCode = code;
      }
      return updated;
    });
  };

  const handleMedicalSelect = (index, value) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index].medicalConditions = value ? [value] : [];
      if (value !== "Other") updated[index].additionalMedicalNotes = "";
      return updated;
    });
  };

  const validateParticipants = () => {
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.participantName) return `Participant ${i + 1}: Name is required`;
      if (!p.age || !p.categoryCode) return `Participant ${i + 1}: Age/Category is required`;

      // Allow "N/A", just ensure something is selected
      if (!p.medicalConditions.length)
        return `Participant ${i + 1}: Please select a medical condition`;
      if (p.medicalConditions.includes("Other") && !p.additionalMedicalNotes)
        return `Participant ${i + 1}: Specify other medical condition`;

      if (!p.primaryContactNumber) return `Participant ${i + 1}: Primary contact number is required`;
      if (!p.primaryContactRelation) return `Participant ${i + 1}: Primary contact relationship is required`;
      // Secondary contact is optional
    }
    return null;
  };

  // --- FIREBASE LOGIC MOVED HERE ---
  const handleFinalSubmit = async () => {
    const error = validateParticipants();
    if (error) {
      alert("❌ " + error);
      return;
    }

    setLoading(true);
    try {
      // Save each participant to Firebase with unique ID generation
      const usersRef = collection(db, "users");

      const savedDocs = [];
      for (const participant of participants) {
        let prefix = "";
        if (participant.category === "Kids") {
          prefix = "DGK";
        } else if (participant.category === "Teen") {
          prefix = "DGT";
        } else {
          prefix = "DGX";
        }

        let uniqueId = null;
        let attempts = 0;
        const maxAttempts = 50;
        while (attempts < maxAttempts && !uniqueId) {
          const allDocsSnapshot = await getDocs(usersRef);
          let maxNumber = 0;
          const usedIds = new Set();
          allDocsSnapshot.forEach((docSnap) => {
            const docId = docSnap.id;
            const data = docSnap.data();
            if (docId.startsWith(prefix + "-")) {
              usedIds.add(docId);
              const numberPart = docId.split("-")[1];
              const num = parseInt(numberPart) || 0;
              if (num > maxNumber) maxNumber = num;
            }
            if (data.uniqueId && data.uniqueId.startsWith(prefix + "-")) {
              usedIds.add(data.uniqueId);
              const numberPart = data.uniqueId.split("-")[1];
              const num = parseInt(numberPart) || 0;
              if (num > maxNumber) maxNumber = num;
            }
            if (data.studentId && data.studentId.startsWith(prefix + "-")) {
              usedIds.add(data.studentId);
              const numberPart = data.studentId.split("-")[1];
              const num = parseInt(numberPart) || 0;
              if (num > maxNumber) maxNumber = num;
            }
            if (data.familyId && data.familyId.startsWith(prefix + "-")) {
              usedIds.add(data.familyId);
              const numberPart = data.familyId.split("-")[1];
              const num = parseInt(numberPart) || 0;
              if (num > maxNumber) maxNumber = num;
            }
          });
          const nextNumber = maxNumber + 1 + attempts;
          const candidateId = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
          if (usedIds.has(candidateId)) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 50 * (attempts + 1)));
            continue;
          }
          const docRef = doc(usersRef, candidateId);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            uniqueId = candidateId;
            // Format display timestamp as dd/MM/yyyy, HH:mm:ss
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, "0");
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const yyyy = now.getFullYear();
            const hh = String(now.getHours()).padStart(2, "0");
            const min = String(now.getMinutes()).padStart(2, "0");
            const ss = String(now.getSeconds()).padStart(2, "0");
            const registrationAtDisplay = `${dd}/${mm}/${yyyy}, ${hh}:${min}:${ss}`;
            const participantWithId = {
              ...participant,
              uniqueId: uniqueId,
              registrationTimestamp: serverTimestamp(),
              registrationDevice: navigator.userAgent,
              registrationAtDisplay,
              // Ensure createdAt is a proper server timestamp (overrides any serialized placeholder)
              createdAt: serverTimestamp(),
            };
            try {
              await setDoc(docRef, participantWithId);
              savedDocs.push({ ...participantWithId, studentId: uniqueId, docId: uniqueId });
              await new Promise(resolve => setTimeout(resolve, 100));
              break;
            } catch (saveError) {
              throw saveError;
            }
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 50 * (attempts + 1)));
        }
        if (!uniqueId) {
          throw new Error(
            `Failed to generate unique ID for ${participant.participantName} after ${maxAttempts} attempts. ` +
            `This might be due to high registration traffic. Please try again in a moment.`
          );
        }
      }
      setLoading(false);
      navigate("/id-card", { state: { formData: savedDocs[0], siblings: savedDocs.slice(1) } });
    } catch (err) {
      setLoading(false);
      alert(`❌ Registration failed: ${err.message}`);
    }
  };

  /** UI **/
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>Review Registration</h2>
        <p>Check all participant details before final submission</p>
      </header>

      {loading && <p style={{ textAlign: "center" }}>Loading participants...</p>}

      <div style={styles.cardsContainer}>
        {participants.map((p, index) => (
          <div key={index} style={{ ...styles.card, backgroundColor: getCardBackground(p.categoryLabel) }}>
            <div style={styles.cardHeader}>
              <h3>{index === 0 ? "Participant" : `Sibling ${index}`}</h3>
              <span style={styles.categoryBadge}>{p.categoryLabel}</span>
            </div>

            <div style={styles.field}>
              <label>Name</label>
              <input
                style={styles.input}
                value={p.participantName}
                onChange={(e) => handleChange(index, "participantName", e.target.value)}
              />
            </div>

            <div style={styles.field}>
              <label>Age</label>
              <input style={styles.input} value={p.age || ""} readOnly />
            </div>

            <div style={styles.field}>
              <label>Primary Contact</label>
              <input
                style={styles.input}
                value={p.primaryContactNumber}
                onChange={(e) => handleChange(index, "primaryContactNumber", e.target.value)}
              />
              <small>Relationship: {p.primaryContactRelation || "-"}</small>
            </div>

            <div style={styles.field}>
              <label>Secondary Contact</label>
              <input
                style={styles.input}
                value={p.secondaryContactNumber || ""}
                onChange={(e) => handleChange(index, "secondaryContactNumber", e.target.value)}
              />
              <small>Relationship: {p.secondaryContactRelationship || "-"}</small>
            </div>

            <div style={styles.field}>
              <label>Email</label>
              <input
                style={styles.input}
                value={p.email}
                onChange={(e) => handleChange(index, "email", e.target.value)}
              />
            </div>

            <div style={styles.field}>
  <label>Gender</label>
  <select
    style={styles.select}
    value={p.gender}
    onChange={(e) => handleChange(index, "gender", e.target.value)}
  >
    <option value="">Select</option>
    <option value="Boy">Boy</option>
    <option value="Girl">Girl</option>
  </select>
</div>

            <div style={styles.field}>
              <label>Medical Condition</label>
              <select
                style={styles.select}
                value={p.medicalConditions[0] || ""}
                onChange={(e) => handleMedicalSelect(index, e.target.value)}
              >
                <option value="">Select a condition</option>
                {MEDICAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              {p.medicalConditions.includes("Other") && (
                <input
                  style={styles.input}
                  placeholder="Specify other condition"
                  value={p.additionalMedicalNotes}
                  onChange={(e) =>
                    handleChange(index, "additionalMedicalNotes", e.target.value)
                  }
                />
              )}
              <small style={{ color: "#555" }}>Choose N/A if none</small>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.buttonGroup}>
        <button
          style={styles.backBtn}
          onClick={() => {
            // Pass current participant data back to Register for restoration
            navigate("/register", {
              state: { restoreFormData: participants[0] }
            });
          }}
          disabled={loading}
        >
          ← Back
        </button>
        <button
          style={styles.submitBtn}
          onClick={handleFinalSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "✅ Submit All"}
        </button>
      </div>
    </div>
  );
};

/** Styles **/
const styles = {
  container: { maxWidth: 950, margin: "0 auto", padding: 20, fontFamily: "'Poppins', sans-serif" },
  header: { textAlign: "center", marginBottom: 25 },
  cardsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 25,
  },
  card: { borderRadius: 16, padding: 20, boxShadow: "0 6px 20px rgba(0,0,0,0.12)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  categoryBadge: {
    background: "#6c3483",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  field: { marginBottom: 15, display: "flex", flexDirection: "column" },
  input: { padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 14 },
  select: { padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 14 },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: 15,
    marginTop: 30,
    flexWrap: "wrap",
  },
  backBtn: {
    backgroundColor: "#aaa",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: 8,
    cursor: "pointer",
  },
  submitBtn: {
    backgroundColor: "#6c3483",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: 8,
    cursor: "pointer",
  },
};

export default Preview;
