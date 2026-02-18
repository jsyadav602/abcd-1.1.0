import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./Sidebar.css";

const Sidebar = ({ collapsed, onCloseSidebar }) => {
  const navigate = useNavigate();
  const [userOpen, setUserOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const userRef = useRef(null);
  const assetsButtonRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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
                setUserOpen(false);
              }}
            >
              <span className="material-icons">lock</span> Change Password
            </button>
            <button
              onClick={() => {
                setUserOpen(false);
                navigate("/");
              }}
            >
              <span className="material-icons">logout</span> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
