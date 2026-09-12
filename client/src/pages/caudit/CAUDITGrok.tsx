import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { PromptCard } from "./CAUDIT";
import { grokBrollItems } from "./caudit-data";
import "./caudit.css";
import CAUDITSourceGallery from "./CAUDITSourceGallery";

function Data3Name() {
  return <span className="caudit-wordmark">Data<sup>#</sup>3</span>;
}

export default function CAUDITGrok() {
  return (
    <main className="caudit-page caudit-grok-page">
      <header className="caudit-header">
        <div className="caudit-brand"><Data3Name /><span className="caudit-edition">CAUDIT 2026</span></div>
        <nav aria-label="Page sections">
          <a href="/caudit">Video</a><a href="/caudit/bible">Bible</a><a href="#prompts">Eight prompts</a>
        </nav>
      </header>

      <section className="caudit-grok-hero">
        <div>
          <a className="caudit-backlink" href="/caudit/bible"><ArrowLeft aria-hidden="true" /> Back to the production Bible</a>
          <span className="caudit-eyebrow"><Sparkles aria-hidden="true" /> B-roll prompt desk</span>
          <h1>Make the film feel <em>alive.</em></h1>
          <p>Eight short, wide B-roll briefs for the moments the existing abstract footage cannot explain on its own: advice, incident ownership, Azure operations, managed services and the people behind the relationship.</p>
        </div>
        <aside className="caudit-grok-note">
          <span>Recommended route</span>
          <strong>Still first → video second</strong>
          <p>Generate a clean 16:9 still, validate the wide composition, then animate one controlled action. Keep 24–28 mm framing, medium distance and generous edge space for editorial type.</p>
          <small>Provider note: any required Grok provenance mark stays visible. These briefs are provider-independent.</small>
        </aside>
      </section>

      <section className="caudit-grok-settings" aria-label="B-roll settings">
        <div><span>Format</span><strong>16:9 landscape</strong></div>
        <div><span>Framing</span><strong>Extra wide · 24–28 mm</strong></div>
        <div><span>Motion</span><strong>One action · one camera move</strong></div>
        <div><span>Text</span><strong>No generated lettering</strong></div>
      </section>

      <CAUDITSourceGallery />
      <section className="caudit-section caudit-grok-intro" id="prompts">
        <div className="caudit-section-heading">
          <div><span className="caudit-kicker">Copy-ready shot briefs</span><h2>Eight cutaways with a job to do</h2></div>
          <p>Use the still prompt first. Then copy only the short image-to-video motion prompt into the animation pass.</p>
        </div>
      </section>

      <section className="caudit-library caudit-grok-library" aria-label="Grok Imagine B-roll prompts">
        {grokBrollItems.map((item) => <PromptCard item={item} key={item.id} />)}
      </section>

      <section className="caudit-guardrail caudit-grok-guardrail">
        <span>Editorial guardrail</span>
        <p>Use the new clips as short human and operational details inside the cinematic film. They should clarify a spoken idea, then get out of the way.</p>
      </section>

      <footer className="caudit-footer">
        <div><Data3Name /><p>CAUDIT 2026 · Microsoft licensing services · B-roll prompt desk</p></div>
        <div><h2>Useful references</h2><a href="https://docs.x.ai/grok/faq" target="_blank" rel="noreferrer">Grok FAQ <ExternalLink aria-hidden="true" /></a><a href="https://x.ai/legal/acceptable-use-policy" target="_blank" rel="noreferrer">Acceptable use policy <ExternalLink aria-hidden="true" /></a></div>
        <p className="caudit-updated">16:9 · wide compositions · eight prompts · ready for exploration</p>
      </footer>
    </main>
  );
}
