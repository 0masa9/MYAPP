import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const LoginPage = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await signup(username, password);
      }
      navigate("/books");
    } catch (err) {
      setError((err as Error).message || "ログインに失敗しました");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: 80 }}>
      <div className="section">
        <h2 style={{ marginTop: 0 }}>Book Memory</h2>
        <p>自分だけの本棚とメモを管理しましょう。</p>
        <form onSubmit={handleSubmit}>
          <label className="label">ユーザー名</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" required />
          <label className="label" style={{ marginTop: 12 }}>
            パスワード
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="password"
            required
            minLength={6}
          />
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          <div className="footer-actions">
            <button type="submit">{mode === "login" ? "ログイン" : "サインアップ"}</button>
            <button
              type="button"
              className="secondary"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "アカウントを作成" : "ログインへ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
