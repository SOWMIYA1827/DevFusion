import { useNavigate } from "react-router-dom";

function Signout() {
  const navigate = useNavigate();

  function handleLogout() {
    alert("Logged out successfully!");
    navigate("/");
  }

  return (
    <button onClick={handleLogout}>
      Sign Out
    </button>
  );
}

export default Signout;