import { useEffect } from "react";
import { ArrowRight, Boxes, GitBranch } from "lucide-react";
import "./alpha-2026.css";

export default function VersionArchive() {
  useEffect(() => {
    document.title = "Prototype archive | Cisco Live 2026 | Data#3";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "Review archived Data#3 Cisco Live 2026 activation prototypes.",
    );
  }, []);

  return (
    <div className="alpha-page">
      <div className="alpha-grid" aria-hidden="true" />
      <header className="alpha-header">
        <a href="/2026alpha" className="alpha-brand" aria-label="Return to the current prototype">
          <img src="/Data3_Logo_Blue_Blue_Boxed-01.png" alt="Data#3" />
        </a>
        <a className="alpha-back" href="/2026alpha">Current · v0.3</a>
      </header>
      <main className="alpha-launcher">
        <section className="alpha-intro">
          <p className="alpha-kicker">Prototype history</p>
          <h1>Earlier thinking, kept visible.</h1>
          <div className="alpha-intro__aside">
            <p>Each version records a different gameplay direction. They remain available for comparison and testing.</p>
          </div>
        </section>
        <section className="alpha-card-grid alpha-card-grid--versions" aria-label="Archived versions">
          <a className="alpha-card alpha-card--cascade" href="/2026alpha/archive/v0.2">
            <div className="alpha-card__topline"><span>02</span><span>Superseded</span></div>
            <div className="alpha-card__visual" aria-hidden="true"><GitBranch strokeWidth={1.35} /></div>
            <div className="alpha-card__copy">
              <h2>v0.2 · Adaptive quiz</h2>
              <p>Five adaptive trivia questions across networking, security, collaboration and AI.</p>
            </div>
            <div className="alpha-card__action">Open v0.2 <ArrowRight aria-hidden="true" /></div>
          </a>
          <a className="alpha-card alpha-card--permission" href="/2026alpha/archive/v0.1">
            <div className="alpha-card__topline"><span>01</span><span>Original explorations</span></div>
            <div className="alpha-card__visual" aria-hidden="true"><Boxes strokeWidth={1.35} /></div>
            <div className="alpha-card__copy">
              <h2>v0.1 · Three concepts</h2>
              <p>Cascade, Permission to act and The Signal Room in their original prototype forms.</p>
            </div>
            <div className="alpha-card__action">Open v0.1 <ArrowRight aria-hidden="true" /></div>
          </a>
        </section>
      </main>
      <footer className="alpha-footer">
        <p>Prototype archive · Cisco Live 2026</p>
        <p>Data<sup>#</sup>3 · Delivering the Digital Future</p>
      </footer>
    </div>
  );
}

