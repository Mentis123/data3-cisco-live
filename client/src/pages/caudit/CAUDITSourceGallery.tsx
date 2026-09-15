const sources = [
  ["B01", "Advice, then action", "Campus adviser and technology lead", true],
  ["B02", "A shared education perspective", "University team discussion", true],
  ["B03", "The infrastructure behind the cloud", "Data centre corridor", true],
  ["B04", "People behind managed services", "Operations team at work", true],
  ["B05", "Planning model", "Architectural model — held in reserve", false],
  ["B06", "Accountable incident support", "Headset engineer", true],
  ["B07", "Licensing guidance", "Shared laptop review", true],
  ["B08", "Design workshop", "Printed design materials — held in reserve", false],
  ["B09_AI_GOVERNANCE", "AI governance in practice", "University leadership and technology governance", true],
  ["B10_AI_READINESS", "Copilot readiness workshop", "Practical adoption planning with university stakeholders", true],
  ["B11_AZURE_MIGRATION", "Azure cloud journey", "Landing-zone, migration and modernisation visual", true],
  ["B12_UNIVERSITY_WORK", "University work in context", "Everyday academic and professional-services activity", true],
  ["B13_AI_OPERATIONS_RESERVE", "AI operations concept", "Alternative concept — held in reserve", false],
  ["B14_AI_ADOPTION", "AI adoption planning", "Cross-functional adoption and value workshop", true],
] as const;

export default function CAUDITSourceGallery() {
  return (
    <section className="caudit-section caudit-source-section" id="received-footage">
      <div className="caudit-section-heading">
        <div><span className="caudit-kicker">Fourteen supplied clips</span><h2>The human detail.</h2></div>
        <p>Eleven selected across the production; three retained as alternatives. Full-frame browser copies retain source provenance and omit native source audio.</p>
      </div>
      <div className="caudit-source-grid">
        {sources.map(([id, title, description, used]) => (
          <article key={id} className="caudit-source-card">
            <video controls playsInline preload="none" poster={`/caudit/${id}_SOURCE.png`} src={`/caudit/${id}_SOURCE.mp4`} aria-label={`${id}: ${title}`} />
            <div><span className="caudit-kicker">{id} · {used ? "In the final film" : "Reserve"}</span><h3>{title}</h3><p>{description}</p><a href={`/caudit/${id}_SOURCE.mp4`} download>Download browser copy</a></div>
          </article>
        ))}
      </div>
    </section>
  );
}
