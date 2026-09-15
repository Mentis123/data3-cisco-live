import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import "./caudit-promo.css";

function Data3Name() {
  return <span className="caudit-promo-wordmark">Data<sup>#</sup>3</span>;
}

export default function CAUDITPromo() {
  useEffect(() => {
    document.title = "Delivering the Digital Future in Education | Data#3";
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute(
        "content",
        "How Data#3 can help CAUDIT members maximise value from their Microsoft investment.",
      );
  }, []);

  return (
    <main className="caudit-promo">
      <header className="caudit-promo-header">
        <div className="caudit-promo-brand">
          <Data3Name />
          <span className="caudit-promo-edition">CAUDIT 2026</span>
        </div>
        <span className="caudit-promo-status">Director's cut · 05:20</span>
      </header>

      <section className="caudit-promo-stage" aria-label="CAUDIT 2026 video">
        <video
          controls
          playsInline
          preload="metadata"
          poster="/caudit/P01_COVER_SLIDE.png"
          aria-label="Delivering the Digital Future in Education"
        >
          <source src="/caudit/CAUDIT_2026_LSP_FINAL.mp4?v=20260915-directors-cut" type="video/mp4" />
          <track
            kind="captions"
            src="/caudit/CAUDIT_2026_LSP_FINAL.vtt?v=20260915-directors-cut"
            srcLang="en"
            label="English"
          />
          Your browser does not support HTML video.
        </video>
      </section>

      <section className="caudit-promo-about" aria-labelledby="caudit-promo-title">
        <span>CAUDIT 2026 · Microsoft licensing services</span>
        <h1 id="caudit-promo-title">Delivering the Digital Future in Education</h1>
        <p>
          A cinematic look at how Data<sup>#</sup>3 helps CAUDIT members make clear Microsoft agreement choices, execute with confidence and build continuing value across licensing, support, Azure, security, data and AI.
        </p>
        <p>
          Created for IT, commercial and procurement leaders at CAUDIT member institutions. Meet the education team, see the support model in action and explore a practical path from agreement execution to responsible AI adoption.
        </p>
        <p className="caudit-promo-disclosure">Illustrative AI-generated footage, with supplied presentation artwork and narration. Optional and separately scoped services are identified in the film.</p>
        <a className="caudit-promo-download" href="/caudit/CAUDIT_2026_LSP_FINAL.mp4" download>Download the final film · MP4</a>
      </section>

      <footer className="caudit-promo-footer">
        <a href="/caudit/bible">
          See the production Bible
          <ArrowRight aria-hidden="true" />
        </a>
      </footer>
    </main>
  );
}
