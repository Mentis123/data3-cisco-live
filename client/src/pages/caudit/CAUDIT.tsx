import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Download, ExternalLink, Search, Sparkles } from "lucide-react";
import { groups, productionSteps, promptItems, qualityGates, researchLinks, shotIds, type PromptGroup, type PromptItem } from "./caudit-data";
import "./caudit.css";

function Data3Name() {
  return <>Data<sup>#</sup>3</>;
}

function CopyButton({ text, label = "Copy prompt" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="caudit-copy" onClick={copy} type="button" aria-live="polite">
      {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function PromptCard({ item }: { item: PromptItem }) {
  const media = item.video || item.image;

  return (
    <article className={`caudit-prompt-card ${media ? "has-image" : ""}`} id={item.id}>
      {media && (
        <div className="caudit-frame-wrap">
          {item.video ? (
            <video
              src={item.video}
              poster={item.image}
              aria-label={item.alt || item.title}
              className="caudit-frame"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <img src={item.image} alt={item.alt || ""} className="caudit-frame" loading="lazy" />
          )}
          <a className="caudit-download" href={media} download aria-label={`Download ${item.title}`}>
            <Download aria-hidden="true" />
            Download {item.video ? "cut" : "frame"}
          </a>
        </div>
      )}
      <div className="caudit-card-body">
        <div className="caudit-card-topline">
          <span className="caudit-tool">{item.group}</span>
          {item.duration && <span className="caudit-duration">{item.duration}</span>}
        </div>
        <h3>{item.title}</h3>
        <p className="caudit-purpose">{item.purpose}</p>
        {item.input && <p className="caudit-input"><strong>Use in</strong> {item.input}</p>}
        {item.review && <p className="caudit-input"><strong>Production review</strong> {item.review}</p>}
        <div className="caudit-code-wrap">
          <pre><code>{item.prompt}</code></pre>
          <CopyButton text={item.prompt} />
        </div>
        {item.secondaryText && (
          <div className="caudit-secondary">
            <div>
              <span>{item.secondaryLabel}</span>
              <p>{item.secondaryText}</p>
            </div>
            <CopyButton text={item.secondaryText} label={`Copy ${item.secondaryLabel?.toLowerCase()}`} />
          </div>
        )}
      </div>
    </article>
  );
}

function ShotTracker() {
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("caudit-shot-tracker");
      return saved ? JSON.parse(saved) : Object.fromEntries(shotIds.map((id) => [id, true]));
    }
    catch { return Object.fromEntries(shotIds.map((id) => [id, true])); }
  });

  useEffect(() => {
    localStorage.setItem("caudit-shot-tracker", JSON.stringify(done));
  }, [done]);

  const count = Object.values(done).filter(Boolean).length;

  return (
    <section className="caudit-section" id="tracker">
      <div className="caudit-section-heading">
        <div><span className="caudit-kicker">Production control</span><h2>Shot tracker</h2></div>
        <p>{count} of {shotIds.length} complete · saved in this browser</p>
      </div>
      <div className="caudit-progress" aria-hidden="true"><span style={{ width: `${(count / shotIds.length) * 100}%` }} /></div>
      <div className="caudit-shot-grid">
        {shotIds.map((id) => (
          <label key={id} className={done[id] ? "is-done" : ""}>
            <input type="checkbox" checked={Boolean(done[id])} onChange={() => setDone((current) => ({ ...current, [id]: !current[id] }))} />
            <span><Check aria-hidden="true" /></span>
            {id}
          </label>
        ))}
      </div>
    </section>
  );
}

export default function CAUDIT() {
  const [activeGroup, setActiveGroup] = useState<PromptGroup | "All">("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "CAUDIT 2026 production bible | Data#3";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", "A refined, copy-ready production bible for the CAUDIT 2026 LSP video.");
  }, []);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return promptItems.filter((item) => {
      const groupMatch = activeGroup === "All" || item.group === activeGroup;
      const searchMatch = !needle || `${item.title} ${item.purpose} ${item.group} ${item.prompt}`.toLowerCase().includes(needle);
      return groupMatch && searchMatch;
    });
  }, [activeGroup, query]);

  return (
    <main className="caudit-page">
      <header className="caudit-header">
        <div className="caudit-brand"><Data3Name /><span>CAUDIT 2026</span></div>
        <nav aria-label="Page sections">
          <a href="#prompts">Prompts</a><a href="#workflow">Workflow</a><a href="#tracker">Tracker</a><a href="#qa">Quality gates</a>
        </nav>
      </header>

      <section className="caudit-hero">
        <div className="caudit-hero-copy">
          <span className="caudit-eyebrow"><Sparkles aria-hidden="true" /> Refined production workspace</span>
          <h1>Signal through<br /><em>the noise.</em></h1>
          <p>A locked 3:02 review master, one continuous voiceover, two joined music sources and every production prompt in one copy-ready workspace.</p>
        </div>
        <div className="caudit-storyline" aria-label="Film structure">
          <div><span>00:00</span><strong>Real title slide</strong><p>The credible fake-out</p></div>
          <div><span>00:12</span><strong>Education relationship</strong><p>Experience and accountability</p></div>
          <div><span>00:36</span><strong>Licensing lifecycle</strong><p>One connected narrative</p></div>
          <div><span>01:59</span><strong>Connected capability</strong><p>The relationship expands</p></div>
          <div><span>02:35</span><strong>Agreement cycle</strong><p>Clean resolved close</p></div>
        </div>
      </section>

      <section className="caudit-command" id="prompts" aria-label="Prompt library controls">
        <div className="caudit-search"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prompts, shots or tools…" aria-label="Search the prompt library" /></div>
        <div className="caudit-filters" aria-label="Filter by tool">
          {(["All", ...groups] as const).map((group) => (
            <button key={group} type="button" className={activeGroup === group ? "active" : ""} onClick={() => setActiveGroup(group)}>{group}</button>
          ))}
        </div>
        <p>{visibleItems.length} copy-ready blocks</p>
      </section>

      <section className="caudit-library" aria-live="polite">
        {visibleItems.length ? visibleItems.map((item) => <PromptCard item={item} key={item.id} />) : (
          <div className="caudit-empty"><Search aria-hidden="true" /><h2>No prompts found</h2><p>Try a broader search or choose another tool.</p></div>
        )}
      </section>

      <section className="caudit-section caudit-workflow" id="workflow">
        <div className="caudit-section-heading">
          <div><span className="caudit-kicker">From locked deck to final master</span><h2>Production order</h2></div>
          <p>Keep the factual middle source-grounded and build each cinematic cut from an approved keyframe.</p>
        </div>
        <ol>{productionSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
      </section>

      <ShotTracker />

      <section className="caudit-section" id="qa">
        <div className="caudit-section-heading">
          <div><span className="caudit-kicker">Before release</span><h2>Quality gates</h2></div>
          <p>Commercial precision matters as much as visual polish.</p>
        </div>
        <div className="caudit-qa-grid">
          {qualityGates.map((gate) => <article key={gate.title}><h3>{gate.title}</h3><ul>{gate.items.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul></article>)}
        </div>
      </section>

      <section className="caudit-guardrail">
        <span>Final creative guardrail</span>
        <p>The cyberpunk treatment is the hook, not the message. Microsoft licensing begins the relationship; connected capability creates continuing value.</p>
      </section>

      <footer className="caudit-footer">
          <div><Data3Name /><p>Supplied cover artwork and AI-generated production imagery. No generated or post-production lettering; subtitles remain a separate SRT file.</p></div>
        <div><h2>Research sources</h2>{researchLinks.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}<ExternalLink aria-hidden="true" /></a>)}</div>
        <p className="caudit-updated">Review master locked 12 September 2026 · Australian English · Production workspace v4.0</p>
      </footer>
    </main>
  );
}
