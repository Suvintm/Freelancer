import { useNavigate } from "react-router-dom";

const EditorHome = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1>Welcome Editor!</h1>
      <p>
        Here you can showcase portfolio, accept projects and track earnings.
      </p>

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#4ade80",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Return to Home
      </button>
    </div>
  );
};

export default EditorHome;
