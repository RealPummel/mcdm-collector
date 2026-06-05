import React, { useState } from "react";

export default function LoginPage({ onLogin, t }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Temporary hardcoded login - later replace with Supabase auth
  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (email === "admin@ovgu.de" && password === "admin123") {
      onLogin();
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* Logo / Title */}
        <div className="login-header">
          <div className="login-logo">⬡</div>
          <h1>Survey Admin</h1>
          <p>Sign in to manage your surveys</p>
        </div>

        {/* Form */}
        <div className="login-form">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="admin@ovgu.de"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />

          {error && <p className="error-msg">{error}</p>}

          <button
            className="login-btn"
            onClick={handleLogin}
          >
            Sign In →
          </button>
        </div>

        <p className="login-hint">
          Later this will be connected to Supabase auth
        </p>

      </div>
    </div>
  );
}
