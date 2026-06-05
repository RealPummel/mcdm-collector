import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function LoginPage({ onLogin, t }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // Temporary hardcoded login - later replace with Supabase auth
  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      onLogin();
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
            disabled={loading}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="admin@ovgu.de"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            disabled={loading}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          {error && <p className="error-msg">{error}</p>}

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </div>

        <p className="login-hint">MCDM</p>
      </div>
    </div>
  );
}
