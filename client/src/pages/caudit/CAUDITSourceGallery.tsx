const sources = [
  ["B01", "Advice, then action", "Campus adviser and technology lead", true],
  ["B02", "A shared education perspective", "University team discussion", true],
  ["B03", "The infrastructure behind the cloud", "Data centre corridor", true],
  ["B04", "People behind managed services", "Operations team at work", true],
  ["B05", "Planning model", "Architectural model — held in reserve", false],
  ["B06", "Accountable incident support", "Headset engineer", true],
  ["B07", "Licensing guidance", "Shared laptop review", true],
  ["B08", "Design workshop", "Printed design materials — held in reserve", false],
] as const;

export default function CAUDITSourceGallery() {
  return (
    <section className="caudit-section caudit-source-section" id="received-footage">
      <div className="caudit-section-heading">
        <div><span className="caudit-kicker">All eight supplied clips</span><h2>The human detail.</h2></div>
        <p>Six selected for the final cut; two retained as alternatives. Numbers follow the received attachment order, not the original prompt order. Full-frame browser copies retain source provenance; source audio is omitted.</p>
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
