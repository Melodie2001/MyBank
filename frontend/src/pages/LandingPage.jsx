import { useTheme } from "../context/ThemeContext";
import "../styles/LandingPage.css";

export default function LandingPage() {
  const { dark: darkMode, toggleDark } = useTheme();

  return (
    <div className={`landing ${darkMode ? "dark" : ""}`}>
      <header className="landing-header">
        <div className="logo">
          <div className="logo-icon">N</div>
          <span className="logo-text">Nexo Finance</span>
        </div>

        <nav className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>

        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleDark} aria-label="Toggle dark mode">
            {darkMode ? "☀️" : "🌙"}
          </button>

          <a href="/login" className="btn btn-ghost">Log in</a>
          <a href="/register" className="btn btn-primary">Sign up</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> Secure · JWT authentication
          </div>
          <h1>
            See your money clearly.
            <br />
            <span>Spend with confidence.</span>
          </h1>
          <p>
            Nexo Finance tracks every expense and income, sorts it into
            categories you choose, and warns you before a budget runs out —
            so you always know where you stand.
          </p>
          <div className="hero-ctas">
            <a href="/register" className="btn btn-cta-primary">Create your free account</a>
            <a href="/login" className="btn btn-cta-secondary">Log in</a>
          </div>
        </div>

        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-header">
              <div>
                <span className="preview-label">Current balance</span>
                <span className="preview-balance">2,480.50€</span>
              </div>
              <span className="preview-pill">+12% this month</span>
            </div>

            <div className="preview-bars">
              {[40, 65, 90, 55, 75, 35, 85, 60, 48, 72].map((h, i) => (
                <div
                  key={i}
                  className={`preview-bar ${i === 2 || i === 6 ? "active" : ""}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <div className="preview-rows">
              <div className="preview-row">
                <div className="preview-row-left">
                  <span className="preview-row-icon">🛒</span>
                  <div>
                    <span className="preview-row-title">Groceries</span>
                    <span className="preview-row-sub">Today · Food &amp; drink</span>
                  </div>
                </div>
                <span className="amount-neg">-€42.30</span>
              </div>
              <div className="preview-row">
                <div className="preview-row-left">
                  <span className="preview-row-icon">💼</span>
                  <div>
                    <span className="preview-row-title">Monthly salary</span>
                    <span className="preview-row-sub">Jun 1 · Income</span>
                  </div>
                </div>
                <span className="amount-pos">+2,800.00€</span>
              </div>
              <div className="preview-row">
                <div className="preview-row-left">
                  <span className="preview-row-icon">🎬</span>
                  <div>
                    <span className="preview-row-title">Streaming subscription</span>
                    <span className="preview-row-sub">Jun 3 · Subscriptions</span>
                  </div>
                </div>
                <span className="amount-neg">-€15.99</span>
              </div>
            </div>
          </div>

          <div className="floating-tag">
            <span className="floating-tag-icon">🎯</span>
            <div>
              <span className="floating-tag-title">Dining budget</span>
              <span className="floating-tag-sub">245€ /250€ this month</span>
            </div>
          </div>
        </div>

        <div className="stats-strip">
          <div className="stat">
            <span className="stat-num">100%</span>
            <span className="stat-label">Free to use</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">3 min</span>
            <span className="stat-label">To get set up</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">24/7</span>
            <span className="stat-label">Access anywhere</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">JWT</span>
            <span className="stat-label">Secured by default</span>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="how-it-works-intro">
          <span className="section-eyebrow">How it works</span>
          <h2>
            Three steps to <br />
            feeling in control
          </h2>
          <p>
            No spreadsheets, no complicated setup. Sign up, log what comes in
            and out, and let Nexo Finance do the rest.
          </p>
        </div>

        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-marker">1</div>
            <div className="timeline-content">
              <h3>Create your account</h3>
              <p>
                Sign up in seconds with your email. Your account is reviewed
                and activated quickly so you can get started fast.
              </p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker">2</div>
            <div className="timeline-content">
              <h3>Log your operations</h3>
              <p>
                Add your income and expenses as they happen, and sort them
                into categories that make sense for you.
              </p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker">3</div>
            <div className="timeline-content">
              <h3>Track and adjust</h3>
              <p>
                Watch your dashboard update in real time, set budgets per
                category, and get alerted before you overspend.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="features-header">
          <span className="section-eyebrow">What you get</span>
          <h2>Everything you need, nothing you don't</h2>
        </div>

        <div className="feature-row">
          <div className="feature-text">
            <span className="feature-icon">📊</span>
            <h3>A dashboard that breathes</h3>
            <p>
              See your balance, income, and spending update in real time.
              Every operation you log instantly reflects in your overview —
              no refresh, no waiting.
            </p>
          </div>
          <div className="feature-visual">
            <div className="mini-card">
              <span className="mini-card-label">Income vs Expenses</span>
              <div className="mini-bars">
                <div className="mini-bar-group">
                  <div className="mini-bar income" style={{ height: "85%" }} />
                  <div className="mini-bar expense" style={{ height: "40%" }} />
                </div>
                <div className="mini-bar-group">
                  <div className="mini-bar income" style={{ height: "70%" }} />
                  <div className="mini-bar expense" style={{ height: "55%" }} />
                </div>
                <div className="mini-bar-group">
                  <div className="mini-bar income" style={{ height: "95%" }} />
                  <div className="mini-bar expense" style={{ height: "30%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="feature-row reverse">
          <div className="feature-text">
            <span className="feature-icon">🏷️</span>
            <h3>Categories your way</h3>
            <p>
              Organize every expense the way that fits your life, not a
              one-size-fits-all bank template. Create, rename, and delete
              categories whenever you need to.
            </p>
          </div>
          <div className="feature-visual">
            <div className="mini-card">
              <span className="mini-card-label">Your categories</span>
              <div className="mini-tags">
                <span className="mini-tag">🛒 Groceries</span>
                <span className="mini-tag">🚌 Transport</span>
                <span className="mini-tag">🎬 Subscriptions</span>
                <span className="mini-tag">🍽️ Dining out</span>
                <span className="mini-tag">⚡ Utilities</span>
                <span className="mini-tag add">+ New</span>
              </div>
            </div>
          </div>
        </div>

        <div className="feature-row">
          <div className="feature-text">
            <span className="feature-icon">🎯</span>
            <h3>Gentle budget nudges</h3>
            <p>
              Set a monthly limit per category and get a clear heads-up the
              moment you're close to it — before it becomes a problem, not
              after.
            </p>
          </div>
          <div className="feature-visual">
            <div className="mini-card">
              <span className="mini-card-label">Dining out</span>
              <div className="mini-progress-row">
                <span className="mini-progress-amount">245€ / 250€</span>
                <span className="mini-progress-pct">98%</span>
              </div>
              <div className="mini-progress-bg">
                <div className="mini-progress-fill warn" style={{ width: "98%" }} />
              </div>
              <div className="mini-alert">
                ⚠️ Almost at your limit for this category
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section" id="about">
        <div className="cta-bg-logo">N</div>
        <div className="cta-content">
          <h2>Ready to see where your money actually goes?</h2>
          <p>
            Create your free account today and get a clear picture of your
            finances in minutes.
          </p>
          <a href="/register" className="btn btn-cta-light">Create your account →</a>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-left">
          <div className="logo-icon small">N</div>
          <span className="footer-text">
            © {new Date().getFullYear()} Nexo Finance. Built with care.
          </span>
        </div>
        <div className="footer-links">
          <a href="/login">Log in</a>
          <a href="/register">Sign up</a>
          <a href="#about">Contact</a>
          <span className="footer-sep" />
          <a href="http://localhost:5174/login" className="footer-admin-link" target="_blank" rel="noopener noreferrer">
            <span className="admin-dot" />
            Administrator
          </a>
        </div>
      </footer>
    </div>
  );
}