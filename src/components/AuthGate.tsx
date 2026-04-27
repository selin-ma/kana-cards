import { useState } from "react";

interface Props {
  onSignIn: (email: string, password: string) => Promise<Error | null>;
  onSignUp: (email: string, password: string) => Promise<Error | null>;
}

export default function AuthGate({ onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const err =
      mode === "signin"
        ? await onSignIn(email, password)
        : await onSignUp(email, password);

    setLoading(false);

    if (err) {
      setError(err.message);
    } else if (mode === "signup") {
      setMessage("注册成功，请检查邮箱确认后登录。");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #D8E4D8",
    background: "#FEFCF8",
    fontSize: "14px",
    color: "#3A4A3C",
    outline: "none",
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#F5F2EC" }}
    >
      <h1
        className="text-2xl font-semibold tracking-widest mb-10"
        style={{ color: "#6A9070" }}
      >
        假名记忆
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#7A9E82")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#D8E4D8")}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#7A9E82")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#D8E4D8")}
        />

        {error && (
          <p className="text-xs text-center" style={{ color: "#C08878" }}>
            {error}
          </p>
        )}
        {message && (
          <p className="text-xs text-center" style={{ color: "#7AAA7A" }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="py-2.5 rounded-2xl text-sm font-medium tracking-wide transition-colors disabled:opacity-40"
          style={{ background: "#7A9E82", color: "#F8FCF8" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#628070")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#7A9E82")}
        >
          {loading ? "请稍候…" : mode === "signin" ? "登录" : "注册"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError("");
            setMessage("");
          }}
          className="text-xs text-center transition-colors"
          style={{ color: "#B8C4B8" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#7A9E82")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#B8C4B8")}
        >
          {mode === "signin" ? "还没有账号？注册" : "已有账号？登录"}
        </button>
      </form>
    </div>
  );
}
