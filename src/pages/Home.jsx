import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../images//church logo2.png"; // Your logo path

const Home = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "90vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#ffff",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "20px",
          padding: "40px 30px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        }}
      >
      <div
  style={{
    marginBottom: "30px",
    textAlign: "center",
    padding: "20px 10px",
  
    borderRadius: "12px",
  }}
>
  <img
    src={Logo}
    alt="Logo"
    style={{
      maxWidth: 200,
      marginBottom: 8,
    }}
  />
  <h2
    style={{
      fontSize: 22,
      color: "#6c3483",
      textTransform: "uppercase",
      letterSpacing: "1px",
      fontWeight: 700,
      margin: "6px 0",
    }}
  >
    Deo Gratias 2025
  </h2>
  <p
    style={{
      fontSize: 14,
      color: "#000",
      fontStyle: "italic",
      margin: "2px 0 4px",
      fontWeight:'bold'
    }}
  >
    Teens & Kids Retreat
  </p>
  <p
    style={{
      fontSize: 14,
      color: "#6c3483",
      fontWeight: 500,
      margin: "0 0 8px",
    }}
  >
    (December 28th – 30th) - 3 Days
  </p>
    <div
    style={{
      fontSize: 14,
      fontWeight: 500,
      color:"red",
    }}
  >
    Kids <strong>8–12 Years</strong>
    <span style={{ margin: "0 12px", opacity: 0.6 }}>|</span>
    Teens <strong>13–18 Years</strong>
  </div>
  <div
    style={{
      borderTop: "1px solid #e0d5f5",
      width: "60%",
      margin: "10px auto",
    }}
  ></div>
  <h3
    style={{
      fontSize: 15,
      color: "#2c3e50",
      margin: "5px 0",
      fontWeight: 600,
    }}
  >
    St. Mary’s Church, Dubai
  </h3>
  <p
    style={{
      fontSize: 13,
      color: "#777",
      margin: 0,
    }}
  >
    P.O. BOX: 51200, Dubai, U.A.E
  </p>
  <h2
  style={{
    fontSize: "17px",
    color: "#e60000",
    fontWeight: "800",
    margin: "10px 0 0px",
  }}
>
  ⚠️ Lanyard Collection – Last Date: December 27, 2025
</h2>
</div>

        {/* Buttons Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "15px",
              fontSize: "18px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              background: "linear-gradient(90deg, #f05a28, #e94e77)",
              color: "#fff",
              transition: "transform 0.2s",
     
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            Register
          </button>

          {/* <button
            onClick={() => navigate("/volunteer-register")}
            style={{
              padding: "15px",
              fontSize: "18px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              background: "linear-gradient(90deg, #3498db, #2ecc71)",
              color: "#fff",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            Volunteer Registration
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default Home;
