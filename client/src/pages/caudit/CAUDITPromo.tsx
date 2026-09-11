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
        <span className="caudit-promo-status">Review master · 03:02</span>
      </header>

      <section className="caudit-promo-stage" aria-label="CAUDIT 2026 video">
        <video
          controls
          playsInline
          preload="metadata"
          poster="/caudit/P01_COVER_SLIDE.png"
          aria-label="Delivering the Digital Future in Education"
        >
          <source src="/caudit/CAUDIT_2026_LSP_REVIEW.mp4" type="video/mp4" />
          <track
            kind="captions"
            src="/caudit/CAUDIT_2026_LSP_REVIEW.vtt"
            srcLang="en"
            label="English"
          />
          Your browser does not support HTML video.
        </video>
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
