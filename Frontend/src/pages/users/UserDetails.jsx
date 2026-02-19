import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchUserById } from "../../services/userApi";
import { PageLoader } from "../../components/Loader/Loader.jsx";
import Button from "../../components/Button/Button.jsx";
import { ErrorNotification } from "../../components/ErrorBoundary/ErrorNotification.jsx";
import { SetPageTitle } from "../../components/SetPageTitle/SetPageTitle.jsx";
import "./UserDetails.css";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchUserById(id);
        setUser({
          ...data,
          _id: data._id || data.id,
          status: data.isActive ? "Active" : "Inactive",
        });
      } catch (err) {
        setError(err.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadUser();
  }, [id]);

  if (loading && !user) return <PageLoader message="Loading user..." />;

  return (
    <div className="user-details-page">
      <SetPageTitle title={user ? `${user.name} | User Details` : "User Details"} />

      {error && (
        <ErrorNotification error={new Error(error)} onClose={() => setError(null)} />
      )}

      <div className="user-details-header">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <h2>{user ? user.name : "User Details"}</h2>
      </div>

      <section className="user-details-card">
        <div className="user-details-row">
          <div className="user-details-label">User ID</div>
          <div className="user-details-value">{user?.userId || "--"}</div>
        </div>

        <div className="user-details-row">
          <div className="user-details-label">Full Name</div>
          <div className="user-details-value">{user?.name || "--"}</div>
        </div>

        <div className="user-details-row">
          <div className="user-details-label">Designation</div>
          <div className="user-details-value">{user?.designation || "--"}</div>
        </div>

        <div className="user-details-row">
          <div className="user-details-label">Department</div>
          <div className="user-details-value">{user?.department || "--"}</div>
        </div>

        <div className="user-details-row">
          <div className="user-details-label">Email</div>
          <div className="user-details-value">{user?.email || "--"}</div>
        </div>

        <div className="user-details-row">
          <div className="user-details-label">Phone</div>
          <div className="user-details-value">{user?.phone_no || "--"}</div>
        </div>

        <div className="user-details-row">
          <div className="user-details-label">Role</div>
          <div className="user-details-value">{user?.role || "--"}</div>
        </div>

        <div className="user-details-row">
          <div className="user-details-label">Status</div>
          <div className="user-details-value">{user?.status || "--"}</div>
        </div>

        <div className="user-details-row">
          <div className="user-details-label">Can Login</div>
          <div className="user-details-value">{user?.canLogin ? "Yes" : "No"}</div>
        </div>

        <div className="user-details-row user-details-remarks">
          <div className="user-details-label">Remarks</div>
          <div className="user-details-value">{user?.remarks || "--"}</div>
        </div>
      </section>

      <section className="user-details-extensions">
        <div className="user-details-extensions__header">
          <h3>Extensions</h3>
          <p className="muted">Placeholders for future sections such as issue items.</p>
        </div>

        <div className="user-details-extensions__grid">
          <div className="extension-card">
            <div className="extension-card__title">Issue Items</div>
            <div className="extension-card__body">
              <p className="muted">No items yet. Future: list or assign items to this user.</p>
              <div style={{ marginTop: '0.5rem' }}>
                <Button onClick={() => alert('Add Issue Item - future feature')}>Add Issue Item</Button>
              </div>
            </div>
          </div>

          <div className="extension-card">
            <div className="extension-card__title">More Details</div>
            <div className="extension-card__body">
              <p className="muted">Add other user-specific details here in future.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserDetails;
