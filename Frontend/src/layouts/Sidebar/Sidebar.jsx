import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../services/api";
import { Modal, Input, Button } from "../../components";
import "./Sidebar.css";

const Sidebar = ({ collapsed, onCloseSidebar }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [userOpen, setUserOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const userRef = useRef(null);
  const assetsButtonRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Change Password modal state
  const [changePwdModal, setChangePwdModal] = useState({
    isOpen: false,
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    error: "",
    isSubmitting: false,
  });

  // Update userName when user data changes
  useEffect(() => {
    if (user && user.name) {
      setUserName(user.name);
    } else {
      setUserName("User");
    }
  }, [user]);

  // Close when clicking outside (for user panel only)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };

    if (userOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userOpen]);

  // Handle menu item click
  const handleMenuItemClick = () => {
    setUserOpen(false);
    // Close sidebar on mobile when menu item is clicked
    if (onCloseSidebar) {
      onCloseSidebar();
    }
  };

  // Calculate dropdown position when Assets button is hovered
  // const handleAssetsHover = () => {
  //   if (assetsButtonRef.current) {
  //     const rect = assetsButtonRef.current.getBoundingClientRect();
  //     setDropdownPos({
  //       top: rect.top,
  //       left: rect.right + 8,
  //     });
  //   }
  // };

  // Handle user panel outside click
  const handleUserPanelClick = (e) => {
    e.stopPropagation();
  };

  const handleCloseChangePwdModal = () => {
    setChangePwdModal({
      isOpen: false,
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      error: "",
      isSubmitting: false,
    });
    setUserOpen(false);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = changePwdModal;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setChangePwdModal((prev) => ({ ...prev, error: "All fields are required" }));
      return;
    }
    if (newPassword.length < 8) {
      setChangePwdModal((prev) => ({ ...prev, error: "New password must be at least 8 characters" }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePwdModal((prev) => ({ ...prev, error: "New password and confirm password do not match" }));
      return;
    }

    setChangePwdModal((prev) => ({ ...prev, error: "", isSubmitting: true }));

    try {
      await authAPI.changePassword(oldPassword, newPassword, confirmPassword);
      handleCloseChangePwdModal();
      // Backend clears refresh token - logout and redirect to login
      await logout();
      navigate("/login");
      if (onCloseSidebar) onCloseSidebar();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to change password";
      setChangePwdModal((prev) => ({ ...prev, error: msg, isSubmitting: false }));
    }
  };

  return (
    <nav className={`menu-bar ${collapsed ? "open" : ""}`}>
      <ul className="menu">
        <li>
          <Link to="/users" onClick={handleMenuItemClick}>
            <span className="material-icons">person</span>
            <span className="menu-text">User</span>
          </Link>
        </li>

        {/* ASSETS - Dropdown Menu */}
        <li 
          className="dropdown"
          // onMouseEnter={handleAssetsHover}
        >
          <button 
            ref={assetsButtonRef}
            className="menu-btn"
          >
            <span className="material-icons">inventory</span>
            <span className="menu-text">Assets</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          <ul 
            className="dropdown-menu"
            style={{
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
            }}
          >
            <li>
              <Link to="/inventory" onClick={handleMenuItemClick}>
                <span className="material-icons">inventory_2</span>
                <span className="menu-text">Inventory</span>
              </Link>
            </li>
            <li>
              <Link to="/accessory" onClick={handleMenuItemClick}>
                <span className="material-icons">devices_other</span>
                <span className="menu-text">Accessories</span>
              </Link>
            </li>
            <li>
              <Link to="/peripheral" onClick={handleMenuItemClick}>
                <span className="material-icons">keyboard</span>
                <span className="menu-text">Peripherals</span>
              </Link>
            </li>
          </ul>
        </li>

        <li>
          <Link to="/issue-item" onClick={handleMenuItemClick}>
            <span className="material-icons">assignment_ind</span>
            <span className="menu-text">Issue To</span>
          </Link>
        </li>

        <li>
          <Link to="/repair" onClick={handleMenuItemClick}>
            <span className="material-icons">build</span>
            <span className="menu-text">Repair</span>
          </Link>
        </li>

        <li>
          <Link to="/upgrade" onClick={handleMenuItemClick}>
            <span className="material-icons">upgrade</span>
            <span className="menu-text">Upgrade</span>
          </Link>
        </li>

        <li>
          <Link to="/report" onClick={handleMenuItemClick}>
            <span className="material-icons">bar_chart</span>
            <span className="menu-text">Report</span>
          </Link>
        </li>

        <li>
          <Link to="/setup" onClick={handleMenuItemClick}>
            <span className="material-icons">settings</span>
            <span className="menu-text">Setup</span>
          </Link>
        </li>
      </ul>

      {/* USER DETAILS (BOTTOM SECTION) */}
      {userName && (
        <div
          ref={userRef}
          className={`user-details ${userOpen ? "active" : ""}`}
        >
          <button
            className="user-toggle"
            onClick={() => setUserOpen((prev) => !prev)}
            title="User menu"
          >
            <span className="material-icons">account_circle</span>
            <span className="menu-text">{userName}</span>
          </button>

          <div className="user-panel" onClick={handleUserPanelClick}>
            <button
              onClick={() => {
                navigate("/profile");
                setUserOpen(false);
              }}
            >
              <span className="material-icons">person</span> Profile
            </button>
            <button onClick={() => setUserOpen(false)}>
              <span className="material-icons">image</span> Change Image
            </button>
            <button
              onClick={() => {
                setChangePwdModal((prev) => ({ ...prev, isOpen: true, error: "" }));
                setUserOpen(false);
              }}
            >
              <span className="material-icons">lock</span> Change Password
            </button>
            <button
              onClick={async () => {
                // Close user panel first
                setUserOpen(false);

                // Perform logout via AuthContext (clears storage + state)
                try {
                  await logout();
                } catch (e) {
                  // Optional: log error, but still navigate away
                  console.error("Logout failed:", e);
                }

                // Redirect to login page
                navigate("/login");

                // Close sidebar on mobile if callback provided
                if (onCloseSidebar) {
                  onCloseSidebar();
                }
              }}
            >
              <span className="material-icons">logout</span> Logout
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <Modal
        isOpen={changePwdModal.isOpen}
        onClose={handleCloseChangePwdModal}
        title="Change Password"
        size="sm"
      >
        <form onSubmit={handleChangePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            type="password"
            label="Current Password"
            placeholder="Enter current password"
            value={changePwdModal.oldPassword}
            onChange={(e) => setChangePwdModal((prev) => ({ ...prev, oldPassword: e.target.value, error: "" }))}
            required
            disabled={changePwdModal.isSubmitting}
          />
          <Input
            type="password"
            label="New Password"
            placeholder="Enter new password (min 8 characters)"
            value={changePwdModal.newPassword}
            onChange={(e) => setChangePwdModal((prev) => ({ ...prev, newPassword: e.target.value, error: "" }))}
            required
            disabled={changePwdModal.isSubmitting}
          />
          <Input
            type="password"
            label="Confirm New Password"
            placeholder="Enter new password again"
            value={changePwdModal.confirmPassword}
            onChange={(e) => setChangePwdModal((prev) => ({ ...prev, confirmPassword: e.target.value, error: "" }))}
            required
            disabled={changePwdModal.isSubmitting}
          />
          {changePwdModal.error && (
            <div style={{ color: "#dc3545", fontSize: "0.875rem" }}>{changePwdModal.error}</div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <Button type="button" variant="secondary" onClick={handleCloseChangePwdModal} disabled={changePwdModal.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={changePwdModal.isSubmitting}>
              {changePwdModal.isSubmitting ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </Modal>
    </nav>
  );
};

export default Sidebar;
