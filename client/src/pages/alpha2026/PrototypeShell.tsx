import { FormEvent, ReactNode, useEffect, useState } from "react";
import { ArrowLeft, Check, MessageSquareWarning, X } from "lucide-react";

export function Data3Name() {
  return <>Data<sup>#</sup>3</>;
}

interface PrototypeShellProps {
  code: string;
  concept: string;
  title: string;
  description: string;
  progress?: string;
  briefing?: boolean;
  children: ReactNode;
}

export function PrototypeShell({
  code,
  concept,
  title,
  description,
  progress,
  briefing = false,
  children,
}: PrototypeShellProps) {
  useEffect(() => {
    document.title = `${concept} alpha | Cisco Live 2026 | Data#3`;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", description);
  }, [concept, description]);

  return (
    <div className={`alpha-page prototype-page prototype-page--${code}`}>
      <div className="alpha-grid" aria-hidden="true" />
      <header className="alpha-header prototype-header">
        <a href="/2026alpha" className="alpha-brand" aria-label="Return to the prototype lab">
          <img src="/Data3_Logo_Blue_Blue_Boxed-01.png" alt="Data#3" />
        </a>
        <a className="alpha-back" href="/2026alpha">
          <ArrowLeft aria-hidden="true" />
          All concepts
        </a>
      </header>

      <main className={`prototype-shell ${briefing ? "prototype-shell--briefing" : ""}`}>
        {!briefing && (
          <header className="prototype-heading">
            <div>
              <p className="alpha-kicker">{code} · Interactive alpha · {concept}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {progress && <div className="prototype-progress" aria-live="polite">{progress}</div>}
          </header>
        )}
        {children}
      </main>

      <footer className="alpha-footer prototype-footer">
        <p>Prototype build · Responses stay on this device</p>
        <p><Data3Name /> · Delivering the Digital Future</p>
      </footer>
    </div>
  );
}

const challengeTypes = [
  "I found a bug",
  "This does not feel right",
  "A customer would do something else",
  "This was useful",
];

export function ChallengePanel({ context }: { context: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [type, setType] = useState(challengeTypes[1]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (!open) {
    return (
      <button className="prototype-challenge-trigger" type="button" onClick={() => setOpen(true)}>
        <MessageSquareWarning aria-hidden="true" />
        Challenge this prototype
      </button>
    );
  }

  return (
    <aside className="prototype-challenge" aria-label="Prototype feedback">
      <button className="prototype-icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close feedback">
        <X aria-hidden="true" />
      </button>
      {sent ? (
        <div className="prototype-challenge__sent" role="status">
          <Check aria-hidden="true" />
          <div>
            <strong>Captured for this alpha session</strong>
            <p>A production version would attach this to “{context}” and its exact content version.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit}>
          <p className="alpha-kicker">Improve it live</p>
          <h2>What should the team reconsider?</h2>
          <label>
            Feedback type
            <select value={type} onChange={(event) => setType(event.target.value)}>
              {challengeTypes.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Your note
            <textarea required minLength={8} placeholder="What would make this more credible or useful?" />
          </label>
          <button className="prototype-primary" type="submit">Save feedback locally</button>
        </form>
      )}
    </aside>
  );
}
