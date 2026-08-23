import { useEffect } from "react";
import { Link } from "wouter";
import "./coming-soon.css";

const experienceThemes = [
  { label: "Engage", className: "coming-soon__theme--engage" },
  { label: "Connect", className: "coming-soon__theme--connect" },
  { label: "Learn", className: "coming-soon__theme--learn" },
  { label: "Grow", className: "coming-soon__theme--grow" },
];

export default function ComingSoon() {
  useEffect(() => {
    document.title = "Cisco Live 2026 | Data#3";

    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    description?.setAttribute(
      "content",
      "The next Data#3 Cisco Live experience is taking shape, with new ways to engage, connect, learn, and grow.",
    );
  }, []);

  return (
    <div className="coming-soon">
      <div className="coming-soon__atmosphere" aria-hidden="true">
        <div className="coming-soon__glow coming-soon__glow--one" />
        <div className="coming-soon__glow coming-soon__glow--two" />
        <div className="coming-soon__grid" />
        <div className="coming-soon__scanline" />
      </div>

      <header className="coming-soon__header">
        <img
          className="coming-soon__logo"
          src="/Data3_Logo_Blue_Blue_Boxed-01.png"
          alt="Data#3"
        />

        <div className="coming-soon__status" role="status">
          <span className="coming-soon__status-dot" aria-hidden="true" />
          Building for 2026
        </div>
      </header>

      <main className="coming-soon__main">
        <section className="coming-soon__copy" aria-labelledby="coming-soon-title">
          <p className="coming-soon__eyebrow">
            <span>Under construction</span>
            <span className="coming-soon__eyebrow-rule" aria-hidden="true" />
            Cisco Live 2026
          </p>

          <h1 id="coming-soon-title">
            Something worth stopping for
            <span> is taking shape.</span>
          </h1>

          <p className="coming-soon__intro">
            The Data<sup>#</sup>3 team is creating fresh, hands-on ways to engage,
            connect, learn, and grow in 2026.
          </p>

          <p className="coming-soon__supporting-copy">
            We&apos;re experimenting, listening, and building in the open. Expect useful
            ideas, memorable experiences, and a few surprises along the way.
          </p>

          <Link href="/2025" className="coming-soon__archive-link">
            <span>
              <small>Still curious?</small>
              Explore the 2025 experience
            </span>
            <span className="coming-soon__archive-arrow" aria-hidden="true">↗</span>
          </Link>
        </section>

        <section
          className="coming-soon__system"
          aria-label="The 2026 experience is taking shape around four themes: engage, connect, learn, and grow."
        >
          <div className="coming-soon__orbit coming-soon__orbit--outer" aria-hidden="true" />
          <div className="coming-soon__orbit coming-soon__orbit--middle" aria-hidden="true" />
          <div className="coming-soon__orbit coming-soon__orbit--inner" aria-hidden="true" />

          <div className="coming-soon__core">
            <span>Experience</span>
            <strong>2026</strong>
            <small>In progress</small>
          </div>

          {experienceThemes.map((theme, index) => (
            <div
              key={theme.label}
              className={`coming-soon__theme ${theme.className}`}
              aria-hidden="true"
              style={{ "--theme-index": index } as React.CSSProperties}
            >
              <span className="coming-soon__theme-index">0{index + 1}</span>
              {theme.label}
            </div>
          ))}

          <div className="coming-soon__system-caption">
            <span className="coming-soon__caption-marker" aria-hidden="true" />
            <p>
              <strong>Built to be useful.</strong>
              Designed to be experienced.
            </p>
          </div>
        </section>
      </main>

      <footer className="coming-soon__footer">
        <p>
          Data<sup>#</sup>3
          <span aria-hidden="true"> · </span>
          Delivering the Digital Future
        </p>
        <span className="coming-soon__footer-code" aria-hidden="true">
          D3 / CL / 26
        </span>
      </footer>
    </div>
  );
}
