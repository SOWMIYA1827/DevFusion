import { Outlet } from "react-router-dom";
import "./User.css";

function User() {
  return (
    <div className="user-container">
      {/* Page Content Outlet */}
      <main className="user-content">
        <Outlet />
      </main>
    </div>
  );
}

export default User;