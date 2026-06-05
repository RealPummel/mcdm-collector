import React, { useState } from "react";

const mockUsers = [
  { id: 1, email: "admin@ovgu.de", role: "admin", status: "active" },
];

export default function UsersPage({ t }) {
  const [users, setUsers] = useState(mockUsers);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Add new admin ──
  const addUser = () => {
    if (!email.trim()) { setError(t.enterEmail); return; }
    if (users.find(u => u.email === email)) { setError(t.userExists); return; }
    setUsers([...users, { id: Date.now(), email, role: "admin", status: "pending" }]);
    setEmail("");
    setError("");
    setSuccess(t.userInvited);
    setTimeout(() => setSuccess(""), 3000);
  };

  // ── Remove admin ──
  const removeUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="admin-container">

      {/* ── Page title ── */}
      <div className="admin-header">
        <h1>{t.userManagement}</h1>
        <p>{t.manageAdmins}</p>
      </div>

      {/* ── Invite new admin ── */}
      <div className="admin-card">
        <h2>{t.inviteAdmin}</h2>
        <label>Email</label>
        <div className="row-input-group">
          <input
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="colleague@ovgu.de"
            onKeyDown={e => e.key === "Enter" && addUser()}
          />
          <button className="add-row-btn" onClick={addUser}>+</button>
        </div>
        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>{t.inviteHint}</p>
      </div>

      {/* ── Admin list ── */}
      <div className="admin-card">
        <h2>{t.admins} <span className="count">{users.length}</span></h2>
        {users.map(u => (
          <div key={u.id} className="question-item">
            <div className="question-item-info">
              {/* Email and role */}
              <strong>{u.email}</strong>
              <span className="rows-preview">
                {u.role} ·
                {/* Green if active, orange if pending */}
                <span style={{ color: u.status === "active" ? "#1e7e34" : "#e67e00" }}>
                  {" "}{u.status}
                </span>
              </span>
            </div>
            {/* Can't remove the main admin */}
            {u.email !== "admin@ovgu.de" && (
              <button className="delete-btn" onClick={() => removeUser(u.id)}>
                {t.remove}
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
