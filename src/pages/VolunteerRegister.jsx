import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  setDoc,
  doc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import Logo2 from "../images/church logo2.png";

const VolunteerRegister = () => {
  const navigate = useNavigate();

  /** ---------------------------
   * 1. Form State
   * --------------------------- */
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    age: "",
    email: "",
    phone: "",
    preferredRole: "",
    preferredLocation: "",
    tshirtSize: "",
    emergencyName: "",
    emergencyPhone: "",
    secondaryContactName: "",
    secondaryContactPhone: "",
    secondaryContactRelationship: "",
    availableDates: [],
    volunteerAgreement: false,
    signature: "",
  });

  /** ---------------------------
   * 2. Responsive
   * --------------------------- */
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /** ---------------------------
   * 3. Auto-calculate Age
   * --------------------------- */
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let ageNow = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        ageNow--;
      }
      if (ageNow.toString() !== formData.age) {
        setFormData((prev) => ({ ...prev, age: ageNow.toString() }));
      }
    } else {
      setFormData((prev) => ({ ...prev, age: "" }));
    }
  }, [formData.dob, formData.age]);

  /** ---------------------------
   * 4. Handlers
   * --------------------------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const toggleDate = (date) => {
    setFormData((prev) => {
      const exists = prev.availableDates.includes(date);
      return {
        ...prev,
        availableDates: exists
          ? prev.availableDates.filter((d) => d !== date)
          : [...prev.availableDates, date],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const volRef = collection(db, "volunteers");
      
      // Fetch ALL documents to find the highest DGV ID
      const allDocsSnapshot = await getDocs(volRef);
      
      let maxNumber = 0;
      const prefix = "DGV";
      
      allDocsSnapshot.forEach((docSnap) => {
        const docId = docSnap.id;
        const data = docSnap.data();
        
        // Check if document ID matches the pattern
        if (docId.startsWith(prefix + "-")) {
          const numberPart = docId.split("-")[1];
          const num = parseInt(numberPart) || 0;
          if (num > maxNumber) maxNumber = num;
        }
        
        // Also check volunteerId field if it exists
        if (data.volunteerId && data.volunteerId.startsWith(prefix + "-")) {
          const numberPart = data.volunteerId.split("-")[1];
          const num = parseInt(numberPart) || 0;
          if (num > maxNumber) maxNumber = num;
        }
      });

      // Generate new unique ID with DGV prefix (DGV = Don Bosco Guwahati Volunteer)
      const newNumber = maxNumber + 1;
      const volunteerId = `DGV-${String(newNumber).padStart(3, "0")}`;
      
      const dataToSave = { 
        ...formData, 
        volunteerId: volunteerId, 
        createdAt: new Date() 
      };

      // Use the unique ID as the document ID
      await setDoc(doc(volRef, volunteerId), dataToSave);
      navigate("/volunteer-id", { state: { formData: dataToSave } });
    } catch (err) {
      console.error("Error adding volunteer:", err);
      alert("Failed to register. Check console for details.");
    }
  };

  /** ---------------------------
   * 5. Constants
   * --------------------------- */
  const eventDates = ["2025-12-28", "2025-12-29", "2025-12-30"];

  const rolesByCategory = {
    "Front of House": ["Ushering", "Greeter", "Welcome Desk"],
    "Guest Support": ["Food Service", "Water Station", "Hospitality"],
    "Operations": ["Tech Support (Audio/Video)", "Stage Crew", "Logistics"],
  };

  const eventLocations = [
    "Main Auditorium",
    "Outdoor Stage",
    "Kids Activity Zone",
    "Parking & Traffic",
    "Registration Desk",
    "Backstage / Green Room",
  ];

  /** ---------------------------
   * 6. Layout
   * --------------------------- */
  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        background: "linear-gradient(135deg,#fdfbfb,#ebedee)",
        padding: "20px 10px",
        width: "100%",
        minHeight: "100vh",
      }}
    >
      {/* Floating Login Button */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 999,
        }}
      >
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: "bold",
            backgroundColor: "#2980b9",
            color: "#fff",
            border: "none",
            borderRadius: 20,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
         Register
        </button>
      </div>

      {/* Header */}
      <Header isMobile={isMobile} />

      {/* Form */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 10px" }}>
        <form
          onSubmit={handleSubmit}
          style={{ maxWidth: "850px", margin: "0 auto" }}
        >
          <Card title="🙋‍♀️ Volunteer Information">
            <Input
              label="Full Name (in capital letters)"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              <Input
                label="Date of Birth"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
              <Input
                label="Age"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                readOnly
              />
            </div>
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            {/* Preferred Role */}
            <div style={{ marginBottom: 15 }}>
              <label style={inputLabel}>Preferred Role</label>
              <select
                name="preferredRole"
                value={formData.preferredRole}
                onChange={handleChange}
                required
                style={selectStyle}
              >
                <option value="">-- Select a Role --</option>
                {Object.entries(rolesByCategory).map(([group, roles]) => (
                  <optgroup key={group} label={group}>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Preferred Location */}
            <div style={{ marginBottom: 15 }}>
              <label style={inputLabel}>Preferred Location</label>
              <select
                name="preferredLocation"
                value={formData.preferredLocation}
                onChange={handleChange}
                required
                style={selectStyle}
              >
                <option value="">-- Select a Location --</option>
                {eventLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="T-Shirt Size (S / M / L / XL)"
              name="tshirtSize"
              value={formData.tshirtSize}
              onChange={handleChange}
            />
          </Card>

          <Card title="🚨 Emergency Contact">
            <Input
              label="Emergency Contact Name"
              name="emergencyName"
              value={formData.emergencyName}
              onChange={handleChange}
              required
            />
            <Input
              label="Emergency Contact Phone"
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={handleChange}
              required
            />
            <Input
              label="Secondary Contact Name"
              name="secondaryContactName"
              value={formData.secondaryContactName}
              onChange={handleChange}
            />
            <Input
              label="Secondary Contact Phone"
              name="secondaryContactPhone"
              value={formData.secondaryContactPhone}
              onChange={handleChange}
            />
            <Input
              label="Secondary Contact Relationship"
              name="secondaryContactRelationship"
              value={formData.secondaryContactRelationship}
              onChange={handleChange}
            />
          </Card>

          <Card title="📅 Date Availability">
            <p style={{ fontSize: 14, marginBottom: 10, color: "#444" }}>
              Please select all dates you are available to serve:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {eventDates.map((date) => (
                <label
                  key={date}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 14,
                    background: "#f9f9f9",
                    padding: "8px 12px",
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.availableDates.includes(date)}
                    onChange={() => toggleDate(date)}
                  />
                  <span style={{ marginLeft: 10 }}>
                    {new Date(date).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </label>
              ))}
            </div>

            {/* Show selected dates */}
            {formData.availableDates.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px",
                  background: "#eafaf1",
                  border: "1px solid #2ecc71",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <strong>Selected Dates:</strong>{" "}
                {formData.availableDates
                  .map((d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  )
                  .join(", ")}
              </div>
            )}
          </Card>

          <Card title="🤝 Volunteer Agreement">
            <label
              style={{ fontSize: "14px", marginBottom: 12, display: "block" }}
            >
              <input
                type="checkbox"
                name="volunteerAgreement"
                checked={formData.volunteerAgreement}
                onChange={handleChange}
                required
              />{" "}
              I agree to abide by the guidelines of the Christeen Retreat and
              fulfill my duties responsibly.
            </label>
            <Input
              label="Signature"
              name="signature"
              value={formData.signature}
              onChange={handleChange}
              required
            />
          </Card>

          <Card title="📜 Important Notes">
            <ul
              style={{
                paddingLeft: 18,
                lineHeight: 1.6,
                fontSize: "14px",
                color: "#444",
              }}
            >
              <li>Volunteers must be 16 years or older.</li>
              <li>Arrive at least 30 minutes before your shift.</li>
              <li>Wear your volunteer badge and the provided t-shirt.</li>
              <li>Contact Volunteer Coordinators for any schedule changes.</li>
            </ul>
          </Card>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "15px",
              fontWeight: "bold",
              backgroundColor: "#6c3483",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              marginTop: 15,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transition: "background 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = "#5b2c6f")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "#6c3483")
            }
          >
            ✨ Submit Volunteer Registration
          </button>
        </form>
      </div>
    </div>
  );
};

/** Shared Components & Styles */
const inputLabel = {
  fontWeight: "bold",
  marginBottom: 6,
  display: "block",
  fontSize: "14px",
  color: "#333",
};
const selectStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: "14px",
  boxSizing: "border-box",
};

const Header = ({ isMobile }) => (
  <div
    style={{
      width: "100%",
      background: "rgba(255,255,255,0.95)",
      borderTop: "6px solid #6c3483",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      marginBottom: 35,
    }}
  >
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          flex: "1 1 150px",
          order: 1,
        }}
      >
        <img src={Logo2} alt="Logo2" style={{ maxWidth: 150, height: "auto" }} />
        {/* <img src={Logo3} alt="Logo3" style={{ maxWidth: 120, height: "auto" }} /> */}
      </div>
      <div
        style={{
          flex: "2 1 300px",
          textAlign: "center",
          order: 2,
          marginBottom: isMobile ? 15 : 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            color: "#2c3e50",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Charis Malayalam Dubai
        </h2>
        <h3 style={{ margin: "5px 0", fontSize: "16px", color: "#555" }}>
          St. Mary’s Church, Dubai
        </h3>
        <p style={{ margin: "5px 0", fontSize: "13px", color: "#666" }}>
          P.O. BOX: 51200, Dubai, U.A.E
        </p>
        <h1
          style={{
            marginTop: 15,
            fontSize: "22px",
            color: "#8b0000",
            fontWeight: "bold",
          }}
        >
          Christ Experience
        </h1>
        <h2
          style={{ margin: "8px 0", fontSize: "18px", color: "#6c3483" }}
        >
          Volunteer Registration 2025
        </h2>
        <p style={{ fontSize: "13px", fontStyle: "italic" }}>
          By Marian Ministry
        </p>
      </div>
      <div
        style={{
          flex: "1 1 150px",
          textAlign: "center",
          order: isMobile ? 0 : 3,
        }}
      >
        {/* <img src={Logo} alt="Logo" style={{ maxWidth: 130, height: "auto" }} /> */}
      </div>
    </div>
  </div>
);

const Card = ({ title, children }) => (
  <div
    style={{
      background: "#fff",
      padding: 20,
      marginBottom: 25,
      borderRadius: 12,
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      borderLeft: "4px solid #6c3483",
    }}
  >
    <h3
      style={{
        marginBottom: 15,
        fontSize: "16px",
        color: "#6c3483",
        borderBottom: "1px solid #eee",
        paddingBottom: 6,
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

const Input = ({ label, type = "text", ...props }) => (
  <div style={{ marginBottom: 15, flex: 1, minWidth: "220px" }}>
    <label style={inputLabel}>{label}</label>
    <input
      type={type}
      {...props}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: 8,
        border: "1px solid #ddd",
        transition: "border 0.3s",
        fontSize: "14px",
        boxSizing: "border-box",
      }}
      onFocus={(e) => (e.target.style.border = "1px solid #6c3483")}
      onBlur={(e) => (e.target.style.border = "1px solid #ddd")}
    />
  </div>
);

export default VolunteerRegister;
