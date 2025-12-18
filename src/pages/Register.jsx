import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, limit, setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Logo from "../images/church logo2.png";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
const [errorField, setErrorField] = useState(null);




const fieldRefs = {
  participantName: useRef(null),
  dob: useRef(null),
  contactFatherMobile: useRef(null),
  contactMotherMobile: useRef(null),
  email: useRef(null),
  parentAgreement: useRef(null),
    primaryContactNumber: useRef(null), // ✅ Add this

};

  // Allow restoring form data from navigation state
  const { state } = useLocation();
  const defaultFormData = {
    participantName: "",
    dob: "",
    age: "",
    category: "",
    categoryColor: "",
    gender: "",  
    fatherName: "",
    motherName: "",
    contactHome: "",
    contactFatherOffice: "",
    contactFatherMobile: "",
    contactMotherOffice: "",
    contactMotherMobile: "",
    email: "",
    residence: "",
    parentAgreement: false,
    parentSignature: "",
    medicalConditions: [],
    otherCondition: "",
    medicalNotes: "",
    // siblings and hasSibling removed
  };
  const [formData, setFormData] = useState(() => {
    // If coming back from Preview, restore formData
    if (state && state.restoreFormData) {
      return { ...defaultFormData, ...state.restoreFormData };
    }
    return defaultFormData;
  });
  

  // Auto age calculation & category assignment
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let ageNow = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) ageNow--;
  
      let category = "";
      let categoryColor = "";
  
      if (ageNow >= 7 && ageNow <= 12) {
        category = "Kids";
        categoryColor = "red";
      } else if (ageNow >= 13 && ageNow <= 25) {
        category = "Teen";
        categoryColor = "blue";
      }
  
      setFormData((prev) => ({
        ...prev,
        age: ageNow !== undefined && ageNow !== null ? ageNow.toString() : "",
        category,
        categoryColor,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        age: "",
        category: "",
        categoryColor: "",
      }));
    }
  }, [formData.dob]);
  
const formatFieldName = (field) => {
  const map = {
    participantName: "Participant Name",
    dob: "Date of Birth",
    primaryContactNumber: "Primary Contact Number",
    contactFatherMobile: "Father's Mobile",
    contactMotherMobile: "Mother's Mobile",
    email: "Email",
    parentAgreement: "Parent Agreement",
    // Add any other fields as needed
  };
  return map[field] || field;
};

 const handleChange = (e) => {
  const { name, value, type, checked } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));

  // Clear error if this field was previously invalid
  if (errorField === name) {
    setErrorField(null);
  }
};



  const handleMedicalCondition = (cond) => {
    setFormData((prev) => {
      const exists = prev.medicalConditions.includes(cond);
      const updatedConditions = exists
        ? prev.medicalConditions.filter((c) => c !== cond)
        : [...prev.medicalConditions, cond];
      return { ...prev, medicalConditions: updatedConditions };
    });
  };




  // Sibling logic removed


// Helper function to generate unique ID based on category
const generateUniqueId = async (category) => {
  let prefix = "";
  
  // Determine prefix based on category
  if (category === "Kids") {
    prefix = "DGK";
  } else if (category === "Teen") {
    prefix = "DGT";
  } else {
    prefix = "DGX"; // Default for any other category
  }

  // Query for the last ID with this prefix
  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    where("uniqueId", ">=", `${prefix}-000`),
    where("uniqueId", "<", `${prefix}-999999`),
    orderBy("uniqueId", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);
  let lastNumber = 0;

  snapshot.forEach((doc) => {
    const lastId = doc.data().uniqueId;
    if (lastId) {
      const numberPart = lastId.split("-")[1];
      lastNumber = parseInt(numberPart) || 0;
    }
  });

  // Generate new ID with incremented number (padded to 3 digits)
  const newNumber = lastNumber + 1;
  const newId = `${prefix}-${String(newNumber).padStart(3, "0")}`;
  return newId;
};

const handleSubmit = async (e) => {
  e.preventDefault();

  // Validation for required fields
  const requiredFields = [
    "participantName",
    "dob",
    "gender", 
    "primaryContactNumber",
    "email",
    "parentAgreement",
  ];

  for (let field of requiredFields) {
    const value = formData[field];
    const isValid =
      typeof value === "boolean" ? value === true : value && value.trim() !== "";

    if (!isValid) {
      setErrorField(field);
      fieldRefs[field]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }

  setErrorField(null);
  setLoading(true);

  // Prepare main participant (no ID generation or Firebase save here)
  const mainParticipant = {
    participantName: formData.participantName,
    dob: formData.dob,
    age: formData.age,
    category: formData.category,
    categoryColor: formData.categoryColor,
    gender: formData.gender, 
    fatherName: formData.fatherName,
    motherName: formData.motherName,
    contactFatherMobile: formData.contactFatherMobile,
    contactMotherMobile: formData.contactMotherMobile,
    primaryContactNumber: formData.primaryContactNumber,
    primaryContactRelation: formData.primaryContactRelation,
    secondaryContactNumber: formData.secondaryContactNumber || "",
    secondaryContactRelationship: formData.secondaryContactRelationship || "",
    email: formData.email,
    residence: formData.residence,
    parentAgreement: formData.parentAgreement,
    parentSignature: formData.parentSignature,
    medicalConditions: formData.medicalConditions,
    otherCondition: formData.otherCondition,
    medicalNotes: formData.medicalNotes,
  };

  // Sibling logic removed
  const allParticipants = [mainParticipant];

  setLoading(false);
  navigate("/preview", { state: { participants: allParticipants } });
};


  return (
    <div style={styles.container}>
      {/* Floating Home Button */}
      <div style={styles.floatingButton}>
        <button onClick={() => navigate("/")} style={styles.Homebutton}>
          Home
        </button>
      </div>

      <Header />

      <div style={styles.formWrapper}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Participant Info */}
          <Card title="👦 Participant Information">
           <Input
  ref={fieldRefs.participantName}
  label="Participant' Full Name (CAPITALS)"
  name="participantName"
  value={formData.participantName}
  onChange={handleChange}
  required
  style={{
    borderColor: errorField === "participantName" ? "red" : "#ddd",
    backgroundColor: errorField === "participantName" ? "#ffe6e6" : "white",
  }}
/>

            <Row>
           <Input
  ref={fieldRefs.dob}
  label="Date of Birth"
  type="date"
  name="dob"
  value={formData.dob}
  onChange={handleChange}
  required
  style={{
    borderColor: errorField === "dob" ? "red" : "#ddd",
    backgroundColor: errorField === "dob" ? "#ffe6e6" : "white",
  }}
/>


<Row>
  <div style={{ flex: 1, minWidth: "250px", marginBottom: 10 }}>
    <label style={{ fontWeight: 600, marginBottom: 6, display: "block", fontSize: 14 }}>
      Gender *
    </label>

    <select
      name="gender"
      value={formData.gender}
      onChange={handleChange}
      required
      style={{
        width: "100%",
        padding: 10,
        borderRadius: 8,
        border: errorField === "gender" ? "1px solid red" : "1px solid #ddd",
        backgroundColor: errorField === "gender" ? "#ffe6e6" : "white",
        fontSize: 14,
      }}
    >
      <option value="">Select</option>
      <option value="Boy">Boy</option>
      <option value="Girl">Girl</option>
    </select>
  </div>
</Row>


{/* <Input
  ref={fieldRefs.contactFatherMobile}
  label="Father's Mobile *"
  type="tel"
  name="contactFatherMobile"
  value={formData.contactFatherMobile}
  onChange={handleChange}
  required
  style={{
    borderColor: errorField === "contactFatherMobile" ? "red" : "#ddd",
    backgroundColor:
      errorField === "contactFatherMobile" ? "#ffe6e6" : "white",
  }}
/> */}
            </Row>
            <CategoryDisplay age={formData.age} category={formData.category} />
          </Card>

          {/* Parent Info */}
          {/* <Card title="👨‍👩‍👧 Parent Information">
            <Row>
              <Input
                label="Father’s Name"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
              />
              <Input
                label="Mother’s Name"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
              />
            </Row>
          </Card> */}

         {/* Contact Details */}
         <Card title="📞 Family Contact">
         <Row>
    {/* Primary Contact */}
    <div style={{ flex: 1, minWidth: "250px", marginBottom: 10 }}>
      <label style={{ fontWeight: 600, marginBottom: 6, display: "block", fontSize: 14 }}>
      Parent / Guardian *
            </label>
      <select
        name="primaryContactRelation"
        value={formData.primaryContactRelation || ""}
        onChange={handleChange}
        required
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 14,
          boxSizing: "border-box",
        }}
      >
        <option value="">Select relationship</option>
        <option value="Father">Father</option>
        <option value="Mother">Mother</option>
        <option value="aunt_uncle_grandparent">Aunt / Uncle / Grandparent</option>
        </select>
    </div>

<Input
  ref={fieldRefs.primaryContactNumber}
  label="Contact Number *"
  type="tel"
  name="primaryContactNumber"
  value={formData.primaryContactNumber || ""}
  maxLength={13}
  onChange={(e) => {
    let val = e.target.value.startsWith("+")
      ? "+" + e.target.value.slice(1).replace(/\D/g, "")
      : e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, primaryContactNumber: val });
  }}
  onBlur={(e) => {
    const val = e.target.value.trim();
    const cleaned = val.replace(/[^\d+]/g, "");
    const isValidUAE = /^(\+9715\d{8}|05\d{8})$/.test(cleaned);
    if (!isValidUAE && val !== "") {
      alert(
        "Please enter a valid UAE number (e.g., +9715XXXXXXXX or 05XXXXXXXX)"
      );
    }
  }}
  placeholder="Enter UAE number (e.g. +9715XXXXXXXX or 05XXXXXXXX)"
  required
  style={{
    borderColor: errorField === "primaryContactNumber" ? "red" : "#ddd",
    backgroundColor:
      errorField === "primaryContactNumber" ? "#ffe6e6" : "white",
  }}
/>



  </Row>

  {/* Secondary / Additional Contact */}
  <Row>
  <div style={{ flex: 1, minWidth: "250px", marginBottom: 10 }}>
    <label
      style={{
        fontWeight: 600,
        marginBottom: 6,
        display: "block",
        fontSize: 14,
      }}
    >
Secondary Contact (Optional)
    </label>

    <div style={{ display: "flex", flexDirection: window.innerWidth > 768 ? "row" : "column", gap: 8 }}>
      {/* Relationship select */}
      <select
        value={formData.secondaryContactRelationship || ""}
        onChange={(e) =>
          setFormData({ ...formData, secondaryContactRelationship: e.target.value })
        }
        style={{
          flex: window.innerWidth > 768 ? 1 : "none",
          width: window.innerWidth > 768 ? "auto" : "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 14,
          boxSizing: "border-box",
        }}
      >
        <option value="">Select relationship</option>
        <option value="Father">Father</option>
        <option value="Mother">Mother</option>
        <option value="aunt_uncle_grandparent">Aunt / Uncle / Grandparent</option>
      </select>

      {/* Phone number input */}
      <input
        type="tel"
        name="secondaryContactNumber"
        value={formData.secondaryContactNumber || ""}
        maxLength={13}
        onChange={(e) => {
          let val = e.target.value.startsWith("+")
            ? "+" + e.target.value.slice(1).replace(/\D/g, "")
            : e.target.value.replace(/\D/g, "");
          setFormData({ ...formData, secondaryContactNumber: val });
        }}
        onBlur={(e) => {
          const val = e.target.value.trim();
          if (val) {
            const isValidUAE = /^(\+9715\d{8}|05\d{8})$/.test(val);
            if (!isValidUAE) {
              alert(
                "Please enter a valid UAE number (e.g., +9715XXXXXXXX or 05XXXXXXXX)"
              );
            }
          }
        }}
        placeholder="Enter UAE number (e.g. +9715XXXXXXXX or 05XXXXXXXX)"
        style={{
          flex: window.innerWidth > 768 ? 1 : "none",
          width: window.innerWidth > 768 ? "auto" : "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 14,
          boxSizing: "border-box",
        }}
      />
    </div>
  </div>
</Row>






  <Input
    ref={fieldRefs.email}
    label="Email *"
    type="email"
    name="email"
    value={formData.email}
    onChange={handleChange}
    required
    style={{
      borderColor: errorField === "email" ? "red" : "#ddd",
      backgroundColor: errorField === "email" ? "#ffe6e6" : "white",
    }}
  />

  <Input
    label="Residence Location"
    name="residence"
    value={formData.residence}
    onChange={handleChange}
    placeholder="Enter home location"
  />
</Card>











          {/* Medical Info */}
   {/* Medical Info */}
{/* Show Medical Info only if no sibling */}
{formData.hasSibling === "no" && (
  <Card title="🩺 Medical Information">
    <p style={{ fontSize: 14, marginBottom: 10 }}>
      Please indicate any conditions (check all that apply):
    </p>
    <div style={styles.checkboxGroup}>
      {["N/A", "Asthma", "Diabetes", "Allergies", "Epilepsy", "Other"].map(
        (cond) => (
          <label key={cond} style={{ fontSize: 14 }}>
            <input
              type="checkbox"
              checked={formData.medicalConditions.includes(cond)}
              onChange={() => handleMedicalCondition(cond)}
              disabled={formData.medicalConditions.includes("N/A") && cond !== "N/A"}
            />{" "}
            {cond}
          </label>
        )
      )}
    </div>

    {formData.medicalConditions.includes("Other") &&
      !formData.medicalConditions.includes("N/A") && (
        <Input
          label="Specify other condition"
          name="otherCondition"
          value={formData.otherCondition}
          onChange={handleChange}
        />
      )}

    <label style={styles.label}>Additional Medical Notes</label>
    <textarea
      name="medicalNotes"
      value={formData.medicalNotes}
      onChange={handleChange}
      placeholder="Write N/A if none"
      disabled={formData.medicalConditions.includes("N/A")}
      style={{
        ...styles.textarea,
        backgroundColor: formData.medicalConditions.includes("N/A")
          ? "#f0f0f0"
          : "#fff",
        cursor: formData.medicalConditions.includes("N/A")
          ? "not-allowed"
          : "text",
      }}
    />
  </Card>
)}



          {/* Agreement */}
          <Card title="🙏 Parent Agreement">
           <label
  ref={fieldRefs.parentAgreement}
  style={{
    fontWeight: 600,
    display: "block",
    marginBottom: 6,
    color: errorField === "parentAgreement" ? "red" : "inherit",
  }}
>
  <input
    type="checkbox"
    name="parentAgreement"
    checked={formData.parentAgreement}
    onChange={handleChange}
    required
  />{" "}
  I agree to be responsible for dropping off and picking up my child from the premises.
</label>
            <Input
              label="Signature of Parent (Type your full name as signature)"
              name="parentSignature"
              value={formData.parentSignature}
              onChange={handleChange}
            />
          </Card>

          <ImportantNotes />

          <button
  type="submit"
  style={{
    ...styles.submitButton,
    opacity: loading ? 0.7 : 1,
    cursor: loading ? "not-allowed" : "pointer",
  }}
  disabled={loading}
>
 {loading ? "Reviewing..." : "✨ Review Form"}
 </button>
{errorField && (
  <div
    style={{
      background: "#ffebeb",
      color: "#a94442",
      border: "1px solid #f5c2c2",
      borderRadius: 8,
      padding: "10px 15px",
      marginTop: 10,
      fontSize: 14,
      textAlign: "center",
    }}
  >
    ⚠️ Please fill out the <strong>{formatFieldName(errorField)}</strong> field before submitting.
  </div>
)}


        </form>
      </div>
    </div>
  );
};

/* ---------------- Styles ---------------- */
const styles = {
  container: {
    fontFamily: "'Poppins', sans-serif",
    background: "linear-gradient(to bottom, #fdfcfb, #f4ede2)",
    padding: 10,
    width: "100%",
    boxSizing: "border-box",
  },
  floatingButton: {
    position: "fixed",
    top: 10,
    right: 10,
    zIndex: 999,
  },
  Homebutton: {
    padding: "5px 16px",
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: "#46464628",
    color: "#000000ff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  formWrapper: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "0 10px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    width: "100%",
  },
  checkboxGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  label: {
    fontWeight: 600,
    display: "block",
    marginBottom: 6,
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    minHeight: 80,
    boxSizing: "border-box",
  },
  submitButton: {
    width: "100%",
    padding: 14,
    fontSize: 15,
    fontWeight: 600,
    backgroundColor: "#6c3483",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 10,
  },
};

/* ---------------- Header ---------------- */
const Header = () => (
  <div style={headerStyles.container}>
    <div style={headerStyles.wrapper}>
      <div style={headerStyles.left}>
        <img src={Logo} alt="Logo2" style={headerStyles.logo} />
      </div>
      <div
  style={{
    textAlign: "center",
    borderRadius: "18px",
    padding: "10px 20px",
    margin: "0 auto 10px",
    maxWidth: "650px",
  }}
>
  <h1
    style={{
      fontSize: "30px",
      color: "#5a2d82",
      textTransform: "uppercase",
      letterSpacing: "1px",
      fontWeight: "900",
      margin: "0 0 10px",
    }}
  >
    DEO GRATIAS – 2025
  </h1>

  <div
    style={{
      width: "70px",
      height: "4px",
      backgroundColor: "#5a2d82",
      borderRadius: "4px",
      margin: "12px auto 18px",
    }}
  ></div>

  <h2
    style={{
      fontSize: "20px",
      color: "#333",
      fontStyle: "italic",
      margin: "0 0 5px",
      fontWeight: "500",
    }}
  >
    Teens & Kids Retreat
  </h2>

  <p
    style={{
      fontSize: "15px",
      color: "#555",
      margin: "0 0 10px",
      letterSpacing: "0.3px",
    }}
  >
    (December 28th to 30th) – 3 Days
  </p>
<div
  style={{
    marginTop: 14,
    textAlign: "center",
    color: "#b02a37", // elegant red
  }}
>
  <div
    style={{
      fontSize: 15,
      fontWeight: 600,
      marginBottom: 4,
      letterSpacing: "0.3px",
    }}
  >
    Age Category
  </div>

  <div
    style={{
      fontSize: 14,
      fontWeight: 500,
    }}
  >
    Kids <strong>8–12 Years</strong>
    <span style={{ margin: "0 12px", opacity: 0.6 }}>|</span>
    Teens <strong>13–18 Years</strong>
  </div>
</div>




  <h3
    style={{
      fontSize: "17px",
      color: "#2c3e50",
      fontWeight: "700",
      margin: "15px 0 5px",
    }}
  >
    St. Mary’s Church, Dubai
  </h3>

  <p
    style={{
      fontSize: "14px",
      color: "#777",
      margin: "0",
    }}
  >
    P.O. BOX: 51200, Dubai, U.A.E
  </p>
        
<h3
  style={{
    fontSize: "17px",
    color: "#e60000",
    fontWeight: "800",
    margin: "15px 0 5px",
  }}
>
  ⚠️ Lanyard Collection – Last Date: December 23, 2025
</h3>

</div>


    
      <div style={headerStyles.right}>
      </div>
    </div>
  </div>
);

const headerStyles = {
  container: {
    width: "100%",
    background: "rgba(255,255,255,0.95)",
    borderTop: "6px solid #6c3483",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    marginBottom: 20,
  
  },
  wrapper: {
    maxWidth: 1000,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    padding: 10,
    boxSizing: "border-box",
    gap: 15,
  },
  left: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
  },
  right: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    textAlign: "center",
  },
  logo: {
    maxWidth: 180,
    height: "auto",
  },
  title: { margin: 0, fontSize: 18, color: "#2c3e50", textTransform: "uppercase" },
  subtitle: { margin: "5px 0", fontSize: 14, color: "#555" },
  text: { margin: "5px 0", fontSize: 12, color: "#666" },
  mainTitle: { marginTop: 5, fontSize: 18, color: "#8b0000", fontWeight: "bold" },
  subTitle: { margin: "5px 0", fontSize: 16, color: "#6c3483" },
  textItalic: { fontSize: 12, fontStyle: "italic", margin: "0 0 5px 0" },
};

/* ---------------- Helpers ---------------- */
const Row = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{children}</div>
);

const Input = ({ label, type = "text", ...props }) => (
  <div style={{ flex: 1, minWidth: "250px", marginBottom: 10 }}>
    <label style={{ fontWeight: 600, marginBottom: 6, display: "block", fontSize: 14 }}>
      {label}
    </label>
    <input
      type={type}
      {...props}
      style={{
        width: "100%",
        padding: 10,
        borderRadius: 8,
        border: "1px solid #ddd",
        fontSize: 14,
        boxSizing: "border-box",
      }}
    />
  </div>
);

const CategoryDisplay = ({ age, category }) => {
  let display = "Enter Date of Birth to see category";
  let bgColor = "#f8f8f8";
  let textColor = "#333";
  let borderColor = "#ddd";
  let isEligible = true;

  if (age) {
    if (category === "Kids") {
      display = `Kids (8–12 Years)`;
      bgColor = "#e8f5e9";
      textColor = "#2e7d32";
      borderColor = "#81c784";
    } else if (category === "Teen") {
      display = `Teens (13–18 Years)`;
      bgColor = "#e3f2fd";
      textColor = "#1565c0";
      borderColor = "#64b5f6";
    } else {
      display = "Not eligible (must be 8–18 Age)";
      bgColor = "#ffebee";
      textColor = "#c62828";
      borderColor = "#ef9a9a";
      isEligible = false;
    }
  }

  return (
    <div style={{ marginTop: 10 }} id="category-display">
      <label
        style={{
          fontWeight: 600,
          marginBottom: 6,
          display: "block",
          fontSize: 14,
        }}
      >
        Category
      </label>
      <div
        style={{
          fontSize: 14,
          padding: 8,
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          background: bgColor,
          color: textColor,
          width: "100%",
          maxWidth: 220,
          fontWeight: 500,
        }}
      >
        {display}
      </div>

  <div
    style={{
      marginTop: 6,
      fontSize: 12,
      color: "#666",
      lineHeight: 1.4,
    }}
  >
    <strong>Age Category:</strong> Kids – 8 to 12 Years / Teens – 13 to 18 Years
  </div>

      
      {/* Pass eligibility status */}
      <input type="hidden" value={isEligible} data-eligible={isEligible} />
    </div>
  );
};



const Card = ({ title, children }) => (
  <div
    style={{
      background: "#fff",
      padding: 15,
      marginBottom: 20,
      borderRadius: 12,
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      borderLeft: "4px solid #6c3483",
      width: "100%",
      boxSizing: "border-box",
    }}
  >
    <h3
      style={{
        marginBottom: 10,
        fontSize: 16,
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

const ImportantNotes = () => (
  <Card title="⚠️ Important Notes">
    <ul style={{ fontSize: 14, lineHeight: 1.6, paddingLeft: 18 }}>
      <li>All participants must have parental consent.</li>
      <li>Medical info must be accurate; carry necessary medications.</li>
      <li>
      Registration for the Teens and Kids Retreat will be confirmed only after submitting this form along with a fee of Dhs. 100/- at the church compound.
      </li>
      <li>
      Participants will be provided with breakfast, lunch, and snacks during the retreat.
       </li>
      <li>Age Category: Kids - 8 to 12 Years / Teens – 13 to 18 Years.</li>
      <li>
      Drop-off at 8:30 AM and pick-up at 3:30 PM will be from the basketball court.
      </li>
      <li>Please carry your ID badge every day.</li>
      <li>
        Transportation will not be provided; Parents are responsible for
        dropping off and picking up thier Children from the premises.
      </li>
      <li>Please bring a Bible, rosary, notebook, and pen.</li>
      <li>
      Smartphones, smartwatches, and other electronic devices are strictly not allowed during the session. Any devices brought by participants will be safely kept and returned after the session.</li>
      <li>
      For any further information or queries, please contact the following numbers:
      </li>
      <ul
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          paddingLeft: 18,
          listStyleType: "circle",
        }}
      >
   
        <li>Prem Das: +971504751801</li>
        <li>Jenny Thekkooden : +971561213388</li>
            <li>Jessin Tom James: +971506994594</li>
        <li>Neema Charles : +971506023112</li>
      </ul>
    </ul>
  </Card>
);

export default Register;
