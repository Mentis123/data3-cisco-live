import { useEffect } from "react";
import "./caudit.css";

const versions = [
  { id: "notebooklm", title: "01 — Original NotebookLM film", time: "03:49", file: "CAUDIT_NOTEBOOKLM_ORIGINAL", poster: "CAUDIT_NOTEBOOKLM_POSTER.jpg", captions: false, description: "The original supplied reference. Preserved unchanged as the starting point of the production." },
  { id: "review", title: "02 — First cinematic review", time: "03:02", file: "CAUDIT_2026_LSP_REVIEW", poster: "P01_COVER_SLIDE.png", captions: true, description: "The previously published cut, preserved unchanged — including its original mix, repeated footage and historical captions." },
  { id: "previous-final", title: "03 — First final cinematic film", time: "03:05", file: "CAUDIT_2026_LSP_FINAL_V1", poster: "P01_COVER_SLIDE.png", captions: true, description: "The first completed cinematic cut, preserved unchanged before the expanded team, Azure and AI adoption story." },
  { id: "final", title: "04 — Director's cut", time: "05:20", file: "CAUDIT_2026_LSP_FINAL", poster: "P01_COVER_SLIDE.png", captions: true, description: "The approved full-story edit: real team and capability evidence, expanded Azure and AI adoption chapters, forward-only cinematic footage, newly word-aligned captions, a voice-dominant mix and the return to the original cover slide." },
];

export default function CAUDITArchive() {
  useEffect(() => { document.title = "CAUDIT film archive | Data#3"; }, []);
  return (
    <main className="caudit-page">
      <header className="caudit-header"><div className="caudit-brand"><span className="caudit-wordmark">Data<sup>#</sup>3</span><span className="caudit-edition">CAUDIT 2026</span></div></header>
      <section className="caudit-section caudit-archive-intro">
        <span className="caudit-kicker">Production history</span><h1>From reference to final film.</h1>
        <p>Four stages of the same story. Earlier cuts stay here for comparison; the shareable CAUDIT page always showcases the current director's cut.</p>
        <div className="caudit-release-links"><a href="/caudit">Watch the final film →</a><a href="/caudit/bible">Back to the Bible →</a></div>
      </section>
      <div className="caudit-archive-list">
        {versions.map((version) => (
          <article className="caudit-archive-card" key={version.id} id={version.id}>
            <div><span className="caudit-kicker">{version.time} · {version.id === "final" ? "Current release" : "Historical version"}</span><h2>{version.title}</h2><p>{version.description}</p></div>
            <video controls playsInline preload="none" poster={`/caudit/${version.poster}`} aria-label={version.title}>
              <source src={`/caudit/${version.file}.mp4${version.id === "final" ? "?v=20260915-directors-cut" : ""}`} type="video/mp4" />
              {version.captions && <track kind="captions" src={`/caudit/${version.file}.vtt${version.id === "final" ? "?v=20260915-directors-cut" : ""}`} srcLang="en" label="English" />}
            </video>
            <div className="caudit-release-links"><a href={`/caudit/${version.file}.mp4`} download>Download MP4</a>{version.captions && <a href={`/caudit/${version.file}.srt`} download>Download captions</a>}</div>
          </article>
        ))}
      </div>
      <footer className="caudit-footer"><div><p>Supplied source material and illustrative AI-generated footage. Historical versions are not the current release.</p><a href="/caudit/bible">See the production Bible →</a></div></footer>
    </main>
  );
}
