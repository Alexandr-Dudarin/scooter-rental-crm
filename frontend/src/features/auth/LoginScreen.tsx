import { Activity, Bike, Gauge, MapPin } from "lucide-react";
import { type FormEvent, useState } from "react";

type LoginScreenProps = {
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("admin@samo.local");
  const [password, setPassword] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onLogin(email, password);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Не удалось войти в систему"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand brand--login">
          <span className="brand__mark">
            <Bike size={29} strokeWidth={2.2} />
          </span>
          <span>SAMO CRM</span>
        </div>
        <div className="login-copy">
          <p className="eyebrow">Внутренняя система</p>
          <h1>Управляйте парком в одном окне</h1>
          <p>
            Самокаты, аренды, заряд и координаты — актуальная картина без лишних
            переключений.
          </p>
        </div>
        <div className="login-feature-grid">
          <span>
            <Activity size={18} /> Живые статусы
          </span>
          <span>
            <MapPin size={18} /> Геопозиция
          </span>
          <span>
            <Gauge size={18} /> Аналитика
          </span>
        </div>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">Добро пожаловать</p>
            <h2>Вход в CRM</h2>
            <p>Используйте демонстрационную учётную запись.</p>
          </div>
          <label>
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            <span>Пароль</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button primary-button--wide" type="submit">
            {submitting ? "Входим…" : "Войти"}
          </button>
          <p className="demo-hint">Демо: admin@samo.local / admin123</p>
        </form>
      </section>
    </main>
  );
}
