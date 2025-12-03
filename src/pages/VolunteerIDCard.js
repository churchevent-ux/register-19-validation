import React, { useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import Logo from "../images/bcst.jpeg";
import Logo2 from "../images/logo.jpg";
import Logo3 from "../images/logo2.png";
import { sendRegistrationEmail, initEmailJS } from "../services/emailService";

const VolunteerIDCard = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const cardRef = useRef();
  const buttonRef = useRef();

  // Initialize EmailJS and send email on mount
  useEffect(() => {
    initEmailJS();
    
    if (state?.formData?.email) {
      console.log("🔔 Volunteer ID Card loaded, sending confirmation email...");
      console.log("🔔 Email will be sent to:", state.formData.email);
      
      sendRegistrationEmail(state.formData)
        .then((result) => {
          console.log("✅ Volunteer confirmation email sent successfully!", result);
        })
        .catch((emailError) => {
          console.error("❌ Failed to send confirmation email:", emailError);
          console.error("❌ Email error details:", emailError.text || emailError.message);
        });
    }
  }, [state]);

  // If page opened directly without data, go back to register
  if (!state || !state.formData) {
    navigate("/volunteer-register");
    return null;
  }
  const { formData } = state;

  // Use Firestore’s volunteerId as the display ID
  const volunteerId = formData.volunteerId || "VOL-000";

  const handleDownload = async () => {
    if (!cardRef.current) return;
    if (buttonRef.current) buttonRef.current.style.display = "none";
    try {
      const dataUrl = await toPng(cardRef.current);
      const link = document.createElement("a");
      link.download = `${formData.fullName.replace(/\s+/g, "_")}_ID.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      if (buttonRef.current) buttonRef.current.style.display = "inline-block";
    }
  };

  return (
    <div style={{ fontFamily: "'Georgia', serif", padding: 20, display: "flex", justifyContent: "center" }}>
      <div
        ref={cardRef}
        style={{
          width: 340,
          background: "#fff",
          border: "4px solid #6c3483",
          borderRadius: 16,
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          textAlign: "center",
          padding: 20,
          position: "relative",
        }}
      >
        {/* Header Logos */}
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 15 }}>
          <img src={Logo2} alt="Logo2" style={{ maxHeight: 50 }} />
          <img src={Logo3} alt="Logo3" style={{ maxHeight: 50 }} />
          <img src={Logo} alt="Logo" style={{ maxHeight: 50 }} />
        </div>

        <h2 style={{ margin: "10px 0", color: "#6c3483", fontSize: 22 }}>Volunteer ID 2025</h2>
        <p style={{ margin: "4px 0", fontWeight: "bold", fontSize: 16 }}>{formData.fullName}</p>

        <div style={{ margin: "6px 0", fontSize: 14, color: "#333" }}>
          <p>Role: {formData.preferredRole || "Volunteer"}</p>
          <p>Location: {formData.preferredLocation || "—"}</p>
          <p>T-Shirt: {formData.tshirtSize || "—"}</p>
        </div>

        <h3 style={{ margin: "10px 0", color: "#8b0000" }}>ID: {volunteerId}</h3>

        {/* QR Code with the Volunteer ID */}
        <div style={{ marginTop: 15 }}>
          <QRCodeCanvas value={volunteerId} size={150} />
        </div>

        <button
          ref={buttonRef}
          onClick={handleDownload}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            backgroundColor: "#6c3483",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Download ID
        </button>
      </div>
    </div>
  );
};

export default VolunteerIDCard;
