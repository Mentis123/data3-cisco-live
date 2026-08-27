import { useEffect } from "react";
import { ArrowUpRight, GitBranch, Radar, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import "./alpha-2026.css";

const mobilePrototypeUrl = "https://data3-cisco-live.vercel.app/2026alpha";

const concepts = [
  {
    number: "01",
    title: "Cascade",
    description: "Make critical decisions during a live technology incident and watch the consequences spread.",
    action: "Take command",
    duration: "3–4 minutes",
    href: "/2026alpha/archive/v0.1/cascade",
    icon: GitBranch,
    className: "alpha-card--cascade",
  },
  {
    number: "02",
    title: "Permission to act",
    description: "Set an AI agent’s boundaries, then discover what happens when it meets the unexpected.",
    action: "Govern the agent",
    duration: "60–90 seconds",
    href: "/2026alpha/archive/v0.1/permission-to-act",
    icon: ShieldCheck,
    className: "alpha-card--permission",
  },
  {
    number: "03",
    title: "The Signal Room",
    description: "Choose the one signal worth escalating and help the room reveal the real incident.",
    action: "Enter the room",
    duration: "45–90 seconds",
    href: "/2026alpha/archive/v0.1/signal-room",
    icon: Radar,
    className: "alpha-card--signal",
  },
];

function useAlphaMeta(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} | Cisco Live 2026 | Data#3`;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", description);
  }, [description, title]);
}

export function Alpha2026Archive() {
  useAlphaMeta(
    "Earlier 2026 activation concepts",
    "Review three archived Data#3 Cisco Live 2026 activation concepts.",
  );

  return (
    <div className="alpha-page">
      <div className="alpha-grid" aria-hidden="true" />
      <header className="alpha-header">
        <a href="/2026alpha" className="alpha-brand" aria-label="Return to the current Data#3 Cisco Live 2026 prototype">
          <img src="/Data3_Logo_Blue_Blue_Boxed-01.png" alt="Data#3" />
        </a>
        <div className="alpha-status"><span />Archive · v0.1</div>
      </header>

      <main className="alpha-launcher">
        <section className="alpha-intro" aria-labelledby="alpha-title">
          <p className="alpha-kicker">Prototype archive · v0.1</p>
          <h1 id="alpha-title">Earlier explorations.</h1>
          <div className="alpha-intro__aside">
            <p>
              These three experiments informed the current adaptive challenge. They remain available
              for reference and testing.
            </p>
            <a
              className="alpha-qr"
              href={mobilePrototypeUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open the 2026 prototype lab on your mobile"
            >
              <span className="alpha-qr__code" aria-hidden="true">
                <QRCodeSVG
                  value={mobilePrototypeUrl}
                  size={116}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000025"
                  title="QR code for the Data#3 2026 prototype lab"
                />
              </span>
              <span className="alpha-qr__copy">
                <strong>Scan the current challenge</strong>
                <small>Opens the latest prototype</small>
              </span>
            </a>
          </div>
        </section>

        <section className="alpha-card-grid" aria-label="Activation prototypes">
          {concepts.map(({ icon: Icon, ...concept }) => (
            <a
              key={concept.title}
              className={`alpha-card ${concept.className}`}
              href={concept.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${concept.title} prototype in a new tab`}
            >
              <div className="alpha-card__topline">
                <span>{concept.number}</span>
                <span>{concept.duration}</span>
              </div>
              <div className="alpha-card__visual" aria-hidden="true">
                <Icon strokeWidth={1.35} />
              </div>
              <div className="alpha-card__copy">
                <h2>{concept.title}</h2>
                <p>{concept.description}</p>
              </div>
              <div className="alpha-card__action">
                {concept.action}
                <ArrowUpRight aria-hidden="true" />
              </div>
            </a>
          ))}
        </section>
      </main>

      <footer className="alpha-footer">
        <p>Archive · v0.1 · Superseded prototype directions</p>
        <p>Data<sup>#</sup>3 · Delivering the Digital Future</p>
      </footer>
    </div>
  );
}
