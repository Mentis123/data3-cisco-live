import type {
  IncidentDefinition,
  ResponseStyle,
} from "./incident-v03-data";

const runawayAgentIncident: IncidentDefinition = {
  id: "runaway-agent",
  number: "01",
  eyebrow: "Agentic AI",
  title: "Runaway agent",
  theme: "Agents and guardrails",
  teaser: "Automation is compounding a service failure.",
  premise:
    "A customer-ops agent is retrying a failing fulfilment call. Every retry compounds load, and customers are abandoning requests.",
  learning:
    "Make five connected decisions across containment, evidence, recovery, guardrails, and reactivation.",
  briefing: {
    facts: [
      "A customer-ops agent is retrying the same failing fulfilment call.",
      "Each retry adds load and creates more abandoned requests.",
      "The cause is unknown, and live traces will disappear during recovery.",
    ],
    objective:
      "Contain the compounding failure, preserve enough evidence, and restore automation safely.",
  },
  debrief:
    "Resilient agents need bounded retries, observable decisions, and a staged path back to autonomy.",
  conversationPrompt:
    "Ask the Data#3 team how practical guardrails keep agentic AI useful, observable, and accountable.",
  initialState: { service: 40, containment: 25, evidence: 30, governance: 45 },
  stages: [
    {
      id: "contain",
      label: "Decision 01 · Contain",
      title: "The retry storm is accelerating.",
      context:
        "Latency is climbing and the service is buckling. The agent is still creating new work.",
      question: "What do you stop first?",
      takeaway: "Stopping retries removes the source of the extra load.",
      options: [
        {
          id: "R1-A",
          action: "Pause the agent and queue work for people.",
          consequence:
            "The storm stops. But in-flight work drops and the manual queue grows.",
          signals: ["Spread stopped", "Backlog growing"],
          effects: { service: -8, containment: 28, evidence: 2, governance: 5 },
          points: 17,
          style: "controlled",
        },
        {
          id: "R1-B",
          action: "Circuit-break the dependency and keep the agent observable.",
          consequence:
            "The service is protected. But the agent keeps failing while you diagnose.",
          signals: ["Service protected", "Failures visible"],
          effects: { service: 4, containment: 24, evidence: 8, governance: 5 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "R1-C",
          action: "Scale the service to absorb the retries.",
          consequence:
            "Customers recover briefly. But more capacity feeds the storm and masks its cause.",
          signals: ["Service restored", "Cause obscured"],
          effects: { service: 16, containment: -8, evidence: -2, governance: 1 },
          points: 14,
          style: "rapid",
        },
      ],
    },
    {
      id: "evidence",
      label: "Decision 02 · Preserve",
      title: "The live evidence is disappearing.",
      context: (state) =>
        state.containment >= 45
          ? "The retry rate is easing, but a restart will erase the live trail through the agent and its tools."
          : "Retries are still adding load. The fastest recovery will overwrite the only live trail through the agent.",
      question: "What do you capture now?",
      takeaway: "Live agent traces are hardest to recover after a restart.",
      options: [
        {
          id: "R2-A",
          action: "Snapshot prompts, decisions, tool calls, and retry traces.",
          consequence:
            "You preserve the full chain. But recovery waits while the incident channel gets louder.",
          signals: ["Chain preserved", "Recovery delayed"],
          effects: { service: -4, containment: 3, evidence: 30, governance: 5 },
          points: 20,
          style: "evidence",
        },
        {
          id: "R2-B",
          action: "Capture downstream errors and customer-impact metrics.",
          consequence:
            "You prove the impact quickly. But the agent's reasoning remains incomplete.",
          signals: ["Impact proven", "Reasoning partial"],
          effects: { service: 0, containment: 4, evidence: 18, governance: 4 },
          points: 17,
          style: "adaptive",
        },
        {
          id: "R2-C",
          action: "Restore now and reconstruct from backups later.",
          consequence:
            "Service moves sooner. But the retry sequence may never be recoverable.",
          signals: ["Recovery accelerated", "Evidence at risk"],
          effects: { service: 12, containment: 2, evidence: -12, governance: -2 },
          points: 14,
          style: "rapid",
        },
      ],
    },
    {
      id: "restore",
      label: "Decision 03 · Restore",
      title: "Customers need the service back.",
      context: (state) =>
        state.evidence >= 55
          ? "You can trace the retry loop. The recovery path is still untested under customer load."
          : "The retry loop is contained, but its trigger is still uncertain. Any recovery path could restart it.",
      inject: "The service owner is unreachable, and the backlog will breach its target in 30 minutes.",
      question: "How do you restore service?",
      takeaway: "A staged recovery can stop before the retry storm returns.",
      options: [
        {
          id: "R3-A",
          action: "Re-enable with capped retries and backoff.",
          consequence:
            "Automation returns with limits. But a downstream fault could still retrigger it.",
          signals: ["Automation restored", "Residual risk"],
          effects: { service: 24, containment: 8, evidence: 2, governance: 8 },
          points: 18,
          style: "rapid",
        },
        {
          id: "R3-B",
          action: "Restore manually and keep the agent off.",
          consequence:
            "Customer service stabilises. But people absorb the load and the queue slows.",
          signals: ["Service stable", "Manual load"],
          effects: { service: 18, containment: 20, evidence: 3, governance: 5 },
          points: 20,
          style: "controlled",
        },
        {
          id: "R3-C",
          action: "Fail over to the secondary region.",
          consequence:
            "Pressure shifts quickly. But the same configuration may follow it.",
          signals: ["Pressure shifted", "Fallback exposed"],
          effects: { service: 22, containment: 10, evidence: 5, governance: 2 },
          points: 14,
          style: "adaptive",
        },
      ],
    },
    {
      id: "guardrail",
      label: "Decision 04 · Guardrail",
      title: "The failure can recur.",
      context: (state) =>
        state.containment >= 65
          ? "Service is returning behind tighter boundaries. The next run still inherits today's retry rules."
          : "Service is returning, but the agent can still reach the same failure path. Its retry rules have not changed.",
      question: "Where does the guardrail go?",
      takeaway: "Retry limits work best where the repeated calls begin.",
      options: [
        {
          id: "R4-A",
          action: "Set an agent retry budget and backoff.",
          consequence:
            "The storm mechanism is bounded. But recoverable calls may give up too early.",
          signals: ["Retries bounded", "Completion reduced"],
          effects: { service: 7, containment: 18, evidence: 2, governance: 22 },
          points: 20,
          style: "controlled",
        },
        {
          id: "R4-B",
          action: "Protect the dependency with a circuit breaker.",
          consequence:
            "Every caller gets protection. But the agent can still waste cycles upstream.",
          signals: ["Dependency protected", "Agent still active"],
          effects: { service: 10, containment: 16, evidence: 2, governance: 18 },
          points: 17,
          style: "adaptive",
        },
        {
          id: "R4-C",
          action: "Require human approval before every retry.",
          consequence:
            "Risk falls sharply. But the workflow is slower and barely autonomous.",
          signals: ["Human control", "Automation reduced"],
          effects: { service: -3, containment: 16, evidence: 8, governance: 18 },
          points: 14,
          style: "evidence",
        },
      ],
    },
    {
      id: "reactivate",
      label: "Decision 05 · Reactivate",
      title: "Automation is ready to return.",
      context: (state) =>
        state.governance >= 65 && state.evidence >= 50
          ? "Controls and evidence are strong. The team still has to choose how much trust to restore."
          : "Some uncertainty remains. Full autonomy would turn that uncertainty into customer impact.",
      question: "When is it safe to turn the agent back on?",
      takeaway: "Automation earns back authority through observed results.",
      options: [
        {
          id: "R5-A",
          action: "Run in shadow mode until metrics hold.",
          consequence:
            "You validate safely. But customers remain on the manual path longer.",
          signals: ["Behaviour validated", "Value delayed"],
          effects: { service: 5, containment: 8, evidence: 20, governance: 15 },
          points: 20,
          style: "evidence",
        },
        {
          id: "R5-B",
          action: "Go live for low-risk work with alarms.",
          consequence:
            "Value returns quickly. But one fix is being trusted under real load.",
          signals: ["Value restored", "Risk monitored"],
          effects: { service: 18, containment: 7, evidence: 6, governance: 13 },
          points: 18,
          style: "rapid",
        },
        {
          id: "R5-C",
          action: "Wait for full post-incident sign-off.",
          consequence:
            "Reactivation is defensible. But manual operations continue for days.",
          signals: ["Sign-off secured", "Manual load continues"],
          effects: { service: -2, containment: 14, evidence: 8, governance: 20 },
          points: 14,
          style: "controlled",
        },
      ],
    },
  ],
};

const edgePressureIncident: IncidentDefinition = {
  id: "edge-pressure",
  number: "02",
  eyebrow: "Local AI",
  title: "Edge under pressure",
  theme: "Resilient AI at the edge",
  teaser: "Remote sites are degrading on thin links and small boxes.",
  premise:
    "AI inference is degrading across remote sites. Links are thin, devices constrained, and no specialist is on-site.",
  learning:
    "Balance local continuity, fleet safety, evidence, and controlled recovery.",
  briefing: {
    facts: [
      "AI inference is degrading across remote sites.",
      "Links are thin, hardware varies, and no specialist is on-site.",
      "A fleet-wide change could recover every site—or fail every site.",
    ],
    objective:
      "Keep local service useful while containing fleet risk and recovering in observable steps.",
  },
  debrief:
    "Reliable edge AI needs local fallback, representative telemetry, staged rollout, and independent fail-safe behaviour.",
  conversationPrompt:
    "Ask the Data#3 team how local AI can stay useful when connectivity, compute, and specialist support are constrained.",
  initialState: { service: 36, containment: 30, evidence: 25, governance: 42 },
  stages: [
    {
      id: "contain",
      label: "Decision 01 · Contain",
      title: "Degradation is spreading across sites.",
      context:
        "Some sites are slow; others are failing. A fleet-wide change could improve everything—or break everything.",
      question: "How do you stop it spreading?",
      takeaway: "Local fallback protects service without exposing the whole fleet.",
      options: [
        {
          id: "E1-A",
          action: "Isolate degraded nodes from the central network.",
          consequence:
            "The core is protected. But isolated sites lose connected services completely.",
          signals: ["Core protected", "Sites isolated"],
          effects: { service: -10, containment: 26, evidence: 2, governance: 5 },
          points: 17,
          style: "controlled",
        },
        {
          id: "E1-B",
          action: "Fail affected sites to cached local inference.",
          consequence:
            "Basic service continues. But stale models may produce less reliable answers.",
          signals: ["Local service", "Models stale"],
          effects: { service: 12, containment: 20, evidence: 4, governance: 7 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "E1-C",
          action: "Push an emergency update to every site.",
          consequence:
            "The fix arrives fast. But one bad push can turn degradation into a fleet outage.",
          signals: ["Fast intervention", "Fleet exposed"],
          effects: { service: 10, containment: -10, evidence: -2, governance: -4 },
          points: 14,
          style: "rapid",
        },
      ],
    },
    {
      id: "evidence",
      label: "Decision 02 · Preserve",
      title: "The links cannot carry every log.",
      context: (state) =>
        state.service >= 45
          ? "Local fallback is buying time, but telemetry and recovery still share the same thin links."
          : "Affected sites are losing useful service. Heavy collection could take the bandwidth needed to recover them.",
      question: "What evidence do you pull?",
      takeaway: "A representative sample protects both evidence and bandwidth.",
      options: [
        {
          id: "E2-A",
          action: "Sample telemetry from representative affected sites.",
          consequence:
            "You expose the pattern without saturating links. But rare site-specific faults may be missed.",
          signals: ["Pattern visible", "Outliers missed"],
          effects: { service: 0, containment: 3, evidence: 28, governance: 5 },
          points: 20,
          style: "evidence",
        },
        {
          id: "E2-B",
          action: "Pull full logs from every affected site.",
          consequence:
            "You get the complete picture. But recovery traffic now competes with log traffic.",
          signals: ["Logs complete", "Links saturated"],
          effects: { service: -9, containment: 2, evidence: 24, governance: 4 },
          points: 16,
          style: "adaptive",
        },
        {
          id: "E2-C",
          action: "Trust central monitoring and collect nothing locally.",
          consequence:
            "Recovery stays fast. But edge-only failures remain inside the blind spot.",
          signals: ["Links preserved", "Blind spot remains"],
          effects: { service: 7, containment: 1, evidence: -10, governance: -2 },
          points: 14,
          style: "rapid",
        },
      ],
    },
    {
      id: "restore",
      label: "Decision 03 · Restore",
      title: "The fleet needs a recovery path.",
      context: (state) =>
        state.evidence >= 50
          ? "The affected hardware pattern is clearer. The worst sites are also the hardest to reach and validate."
          : "The fleet pattern is still incomplete. One uniform recovery could repeat the same fault everywhere.",
      inject: "Your edge specialist is in flight, and two remote sites are about to lose local service.",
      question: "How do you bring the sites back?",
      takeaway: "Wave-based recovery limits how many sites one mistake can affect.",
      options: [
        {
          id: "E3-A",
          action: "Restore in waves and validate each wave.",
          consequence:
            "Each step is proven. But the worst-hit sites wait the longest.",
          signals: ["Recovery proven", "Slowest sites wait"],
          effects: { service: 18, containment: 12, evidence: 15, governance: 10 },
          points: 20,
          style: "evidence",
        },
        {
          id: "E3-B",
          action: "Restore every site from a known-good image.",
          consequence:
            "The fleet returns quickly. But a subtle image fault repeats everywhere.",
          signals: ["Fleet restored", "Common-mode risk"],
          effects: { service: 26, containment: 2, evidence: 2, governance: 1 },
          points: 14,
          style: "rapid",
        },
        {
          id: "E3-C",
          action: "Hold sites local-only while the core stabilises.",
          consequence:
            "The core stays safe. But sites run degraded and stale for longer.",
          signals: ["Core stable", "Sites degraded"],
          effects: { service: 10, containment: 20, evidence: 5, governance: 6 },
          points: 18,
          style: "controlled",
        },
      ],
    },
    {
      id: "guardrail",
      label: "Decision 04 · Guardrail",
      title: "One bad push could cascade again.",
      context: (state) =>
        state.service >= 65
          ? "The fleet is returning, but the same release still has to cross unreliable links and varied hardware."
          : "Some sites remain degraded. The next release still needs to cross unreliable links and varied hardware safely.",
      question: "How do you contain the next bad push?",
      takeaway: "Health checks and local fallback stop one bad release spreading.",
      options: [
        {
          id: "E4-A",
          action: "Stage releases with health checks and auto-rollback.",
          consequence:
            "A bad push stops early. But every future release takes longer.",
          signals: ["Cascade limited", "Releases slower"],
          effects: { service: 8, containment: 18, evidence: 7, governance: 22 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "E4-B",
          action: "Give each site an independent safe-mode breaker.",
          consequence:
            "Each site can fail safely. But stale local models can drift unnoticed.",
          signals: ["Local resilience", "Drift possible"],
          effects: { service: 9, containment: 20, evidence: 2, governance: 18 },
          points: 17,
          style: "controlled",
        },
        {
          id: "E4-C",
          action: "Create one central kill-switch for the fleet.",
          consequence:
            "Control is immediate. But one button can now dark every site.",
          signals: ["Immediate control", "Single failure point"],
          effects: { service: 4, containment: 15, evidence: 1, governance: 12 },
          points: 14,
          style: "rapid",
        },
      ],
    },
    {
      id: "reactivate",
      label: "Decision 05 · Reactivate",
      title: "Edge inference is ready to return.",
      context: (state) =>
        state.governance >= 65
          ? "Rollback and safe-mode controls are ready. Site health still varies."
          : "Fleet controls remain uneven. A fast return trades consistency for speed.",
      question: "When do you reactivate the fleet?",
      takeaway: "Each site should prove readiness before receiving full trust.",
      options: [
        {
          id: "E5-A",
          action: "Re-enable each site after its health checks pass.",
          consequence:
            "Every site proves readiness. But the weakest sites wait longest.",
          signals: ["Readiness proven", "Recovery staggered"],
          effects: { service: 14, containment: 10, evidence: 18, governance: 14 },
          points: 20,
          style: "evidence",
        },
        {
          id: "E5-B",
          action: "Use a canary cohort, then restore the fleet.",
          consequence:
            "Speed and safety balance. But the canary may not represent every site.",
          signals: ["Canary validated", "Variation remains"],
          effects: { service: 20, containment: 9, evidence: 9, governance: 15 },
          points: 18,
          style: "adaptive",
        },
        {
          id: "E5-C",
          action: "Re-enable everything and monitor closely.",
          consequence:
            "Full service returns fastest. But the fix is now tested by customers.",
          signals: ["Fleet live", "Customers testing"],
          effects: { service: 26, containment: 1, evidence: 3, governance: 5 },
          points: 14,
          style: "rapid",
        },
      ],
    },
  ],
};

const poisonedContextIncident: IncidentDefinition = {
  id: "poisoned-context",
  number: "03",
  eyebrow: "Trusted knowledge",
  title: "Poisoned context",
  theme: "Knowledge, identity, and trust",
  teaser: "The assistant is confidently recommending unsafe actions.",
  premise:
    "An AI assistant is giving confident, unsafe recommendations. Its data, tool, or borrowed identity may be compromised.",
  learning:
    "Rebuild trust across evidence, provenance, identity, and staged autonomy.",
  briefing: {
    facts: [
      "An assistant is producing confident, unsafe recommendations.",
      "The problem may be poisoned data, a compromised tool, or borrowed identity.",
      "You do not know when the trust chain was first compromised.",
    ],
    objective:
      "Stop unsafe action, preserve the trust trail, and rebuild a source you can defend.",
  },
  debrief:
    "Trusted AI depends on verified sources, least privilege, preserved evidence, and graduated authority.",
  conversationPrompt:
    "Ask the Data#3 team how trusted knowledge, RAG, and governed tool access can keep AI grounded.",
  initialState: { service: 48, containment: 20, evidence: 28, governance: 35 },
  stages: [
    {
      id: "contain",
      label: "Decision 01 · Contain",
      title: "Confident advice can no longer be trusted.",
      context:
        "The assistant is still active. You do not yet know whether data, a tool, or an identity is tainted.",
      question: "What do you cut off first?",
      takeaway: "Stop access to suspect context before filtering the answers.",
      options: [
        {
          id: "P1-A",
          action: "Disconnect the suspect context source.",
          consequence:
            "Unsafe grounding stops. But the assistant becomes blind to useful knowledge.",
          signals: ["Source isolated", "Knowledge reduced"],
          effects: { service: -8, containment: 28, evidence: 5, governance: 8 },
          points: 20,
          style: "controlled",
        },
        {
          id: "P1-B",
          action: "Switch to read-only, human-approved operation.",
          consequence:
            "The assistant remains useful. But every action now consumes scarce staff time.",
          signals: ["Human oversight", "Delivery slower"],
          effects: { service: 2, containment: 20, evidence: 7, governance: 10 },
          points: 17,
          style: "adaptive",
        },
        {
          id: "P1-C",
          action: "Roll back the knowledge base to yesterday.",
          consequence:
            "A cleaner state returns quickly. But yesterday may already be poisoned.",
          signals: ["Context restored", "Entry time unknown"],
          effects: { service: 14, containment: 6, evidence: -3, governance: 2 },
          points: 14,
          style: "rapid",
        },
      ],
    },
    {
      id: "evidence",
      label: "Decision 02 · Preserve",
      title: "Cleanup could destroy the trust trail.",
      context: (state) =>
        state.containment >= 42
          ? "The suspect source is isolated, but its access and decision trail is still volatile."
          : "The assistant can still act on suspect context. Immediate cleanup would erase how that context became trusted.",
      question: "What do you protect before cleanup?",
      takeaway: "Source, access, and decision records show how bad context became trusted.",
      options: [
        {
          id: "P2-A",
          action: "Preserve records, access logs, and identity tokens.",
          consequence:
            "The forensic chain survives. But known-bad material must remain isolated and stored.",
          signals: ["Chain preserved", "Bad data retained"],
          effects: { service: -3, containment: 6, evidence: 30, governance: 8 },
          points: 20,
          style: "evidence",
        },
        {
          id: "P2-B",
          action: "Preserve recent recommendations and customer impact.",
          consequence:
            "You prove what happened quickly. But the entry point remains uncertain.",
          signals: ["Impact proven", "Entry unclear"],
          effects: { service: 0, containment: 4, evidence: 18, governance: 5 },
          points: 16,
          style: "adaptive",
        },
        {
          id: "P2-C",
          action: "Purge and rebuild the context immediately.",
          consequence:
            "Unsafe data disappears. But so does evidence of the compromised trust path.",
          signals: ["Context cleaned", "Evidence destroyed"],
          effects: { service: 10, containment: 14, evidence: -16, governance: -4 },
          points: 14,
          style: "rapid",
        },
      ],
    },
    {
      id: "restore",
      label: "Decision 03 · Restore",
      title: "The business needs a trusted source again.",
      context: (state) =>
        state.evidence >= 55
          ? "You can trace the suspect source through the assistant's decisions. Proving a clean replacement will still take time."
          : "You cannot yet prove where trust broke. A fast restore may carry the same poison into a new source.",
      inject: "The assistant influenced a live change. Security needs the tainted source and affected decisions identified in 30 minutes.",
      question: "How do you restore trusted context?",
      takeaway: "A trusted restore begins with a source you can verify.",
      options: [
        {
          id: "P3-A",
          action: "Rebuild from a verified, signed source.",
          consequence:
            "Trust has a defensible origin. But validation slows restoration.",
          signals: ["Origin verified", "Recovery slower"],
          effects: { service: 14, containment: 20, evidence: 8, governance: 18 },
          points: 20,
          style: "controlled",
        },
        {
          id: "P3-B",
          action: "Keep the context and add an output filter.",
          consequence:
            "Useful answers return quickly. But a filter is guarding a source you still distrust.",
          signals: ["Answers restored", "Source untrusted"],
          effects: { service: 24, containment: 2, evidence: 0, governance: 6 },
          points: 14,
          style: "rapid",
        },
        {
          id: "P3-C",
          action: "Restore a clean snapshot and diff forward.",
          consequence:
            "Recovery balances speed and proof. But poison before the snapshot survives.",
          signals: ["Context restored", "Earlier risk remains"],
          effects: { service: 20, containment: 12, evidence: 12, governance: 12 },
          points: 18,
          style: "adaptive",
        },
      ],
    },
    {
      id: "guardrail",
      label: "Decision 04 · Guardrail",
      title: "The trust path needs a durable control.",
      context: (state) =>
        state.containment >= 60
          ? "A cleaner source is returning. Future context and tool access still need to prove origin and authority."
          : "Useful context is returning, but the trust boundary is still weak. Future sources and tools need proof before use.",
      question: "How do you stop bad context being trusted?",
      takeaway: "Provenance and scoped identity stop unknown context from becoming authority.",
      options: [
        {
          id: "P4-A",
          action: "Verify provenance and integrity on every source.",
          consequence:
            "Tainted inputs lose trust. But every source needs strong signing and maintenance.",
          signals: ["Provenance verified", "Overhead added"],
          effects: { service: 5, containment: 18, evidence: 10, governance: 24 },
          points: 20,
          style: "controlled",
        },
        {
          id: "P4-B",
          action: "Use least privilege and short-lived tool credentials.",
          consequence:
            "A stolen identity reaches less. But authorised bad data can still enter.",
          signals: ["Access narrowed", "Data risk remains"],
          effects: { service: 8, containment: 15, evidence: 6, governance: 20 },
          points: 17,
          style: "adaptive",
        },
        {
          id: "P4-C",
          action: "Filter unsafe recommendations before delivery.",
          consequence:
            "Obvious harm is caught. But the unsafe source stays trusted upstream.",
          signals: ["Outputs screened", "Cause remains"],
          effects: { service: 10, containment: 8, evidence: 12, governance: 14 },
          points: 14,
          style: "evidence",
        },
      ],
    },
    {
      id: "reactivate",
      label: "Decision 05 · Reactivate",
      title: "Recommendations can return.",
      context: (state) =>
        state.governance >= 65 && state.evidence >= 50
          ? "The trust chain is stronger and explainable. Autonomy still changes the consequence of error."
          : "Trust has improved, but evidence or controls remain incomplete.",
      question: "When do you trust its recommendations again?",
      takeaway: "Higher-consequence actions need stronger evidence and human oversight.",
      options: [
        {
          id: "P5-A",
          action: "Use advisory mode until provenance holds.",
          consequence:
            "People confirm every recommendation. But decisions regain human latency.",
          signals: ["Advice supervised", "Latency restored"],
          effects: { service: 8, containment: 9, evidence: 18, governance: 18 },
          points: 20,
          style: "evidence",
        },
        {
          id: "P5-B",
          action: "Automate low-risk actions; review high-risk ones.",
          consequence:
            "Value returns in stages. But someone must draw the risk boundary correctly.",
          signals: ["Trust graduated", "Boundary critical"],
          effects: { service: 18, containment: 10, evidence: 8, governance: 18 },
          points: 18,
          style: "adaptive",
        },
        {
          id: "P5-C",
          action: "Fully re-enable after a test set passes.",
          consequence:
            "Autonomy returns fastest. But the test set may not represent real attacks.",
          signals: ["Autonomy restored", "Coverage uncertain"],
          effects: { service: 25, containment: 2, evidence: 4, governance: 7 },
          points: 14,
          style: "rapid",
        },
      ],
    },
  ],
};

const brokenHandoffIncident: IncidentDefinition = {
  id: "broken-handoff",
  number: "04",
  eyebrow: "Connected operations",
  title: "Broken hand-off",
  theme: "Observable, accountable workflow",
  teaser: "Work is reaching the wrong people without trusted context.",
  premise:
    "An AI-assisted customer hand-off is misrouting work and dropping context between systems and people.",
  learning:
    "Protect continuity, trace decisions, and restore automation without repeating the routing fault.",
  briefing: {
    facts: [
      "AI-assisted routing is sending customer work to the wrong queues.",
      "Context is being dropped between systems and people.",
      "Some cases are delayed, some exposed, and some silently lost.",
    ],
    objective:
      "Stop the misrouting, trace the broken hand-off, and restore accountable automation.",
  },
  debrief:
    "Reliable hand-offs need traceable decisions, validated context, clear destinations, and staged reactivation.",
  conversationPrompt:
    "Ask the Data#3 team how connected platforms and observability make automated hand-offs accountable end to end.",
  initialState: { service: 42, containment: 22, evidence: 24, governance: 38 },
  stages: [
    {
      id: "contain",
      label: "Decision 01 · Contain",
      title: "Cases are reaching the wrong queues.",
      context:
        "Some work is delayed, some exposed, and some silently lost. The routing engine is still active.",
      question: "How do you stop the misrouting now?",
      takeaway: "Pause silent misrouting before trying to clear the queue.",
      options: [
        {
          id: "H1-A",
          action: "Pause AI routing and use one manual queue.",
          consequence:
            "Misrouting stops immediately. But people are swamped and response times grow.",
          signals: ["Misrouting stopped", "Queue overloaded"],
          effects: { service: -8, containment: 28, evidence: 4, governance: 7 },
          points: 20,
          style: "controlled",
        },
        {
          id: "H1-B",
          action: "Require confirmation at every hand-off.",
          consequence:
            "Wrong routes are caught. But every case now carries extra friction.",
          signals: ["Routes checked", "Friction added"],
          effects: { service: 0, containment: 20, evidence: 7, governance: 10 },
          points: 18,
          style: "adaptive",
        },
        {
          id: "H1-C",
          action: "Send every case to the senior queue.",
          consequence:
            "Nothing disappears. But scarce specialists become the new bottleneck.",
          signals: ["Cases retained", "Experts blocked"],
          effects: { service: 9, containment: 10, evidence: 2, governance: 3 },
          points: 14,
          style: "rapid",
        },
      ],
    },
    {
      id: "evidence",
      label: "Decision 02 · Preserve",
      title: "The broken hand-off is hard to see.",
      context: (state) =>
        state.containment >= 45
          ? "New misroutes have slowed, but context from in-flight cases is still disappearing between systems."
          : "The routing engine is still sending cases. Complaints reveal only the hand-offs people noticed.",
      question: "What shows you where it broke?",
      takeaway: "The routing decision and transferred context must be traced together.",
      options: [
        {
          id: "H2-A",
          action: "Capture routing decisions and each context payload.",
          consequence:
            "The broken hop becomes visible. But sensitive context now needs careful handling.",
          signals: ["Broken hop visible", "Data handling grows"],
          effects: { service: -2, containment: 4, evidence: 30, governance: 8 },
          points: 20,
          style: "evidence",
        },
        {
          id: "H2-B",
          action: "Capture only the cases customers reported.",
          consequence:
            "Impact is triaged quickly. But silent misroutes stay outside the sample.",
          signals: ["Impact prioritised", "Silent cases missed"],
          effects: { service: 2, containment: 4, evidence: 17, governance: 4 },
          points: 16,
          style: "adaptive",
        },
        {
          id: "H2-C",
          action: "Restore now and reconstruct from CRM later.",
          consequence:
            "Work moves sooner. But ephemeral hand-off context will not be in the CRM.",
          signals: ["Flow accelerated", "Context lost"],
          effects: { service: 12, containment: 1, evidence: -12, governance: -2 },
          points: 14,
          style: "rapid",
        },
      ],
    },
    {
      id: "restore",
      label: "Decision 03 · Restore",
      title: "The backlog is growing.",
      context: (state) =>
        state.evidence >= 50
          ? "The failed hand-off is visible. In-flight cases still need repair before the queue can be trusted."
          : "You cannot yet prove which hand-off failed. A fresh sync could import the same routing mistake.",
      inject: "A priority customer says sensitive case details reached the wrong team.",
      question: "How do you restore routing?",
      takeaway: "Repair affected cases before trusting the routing pipeline again.",
      options: [
        {
          id: "H3-A",
          action: "Restore the last good rules and replay stuck cases.",
          consequence:
            "Routing returns predictably. But in-flight cases still need manual repair.",
          signals: ["Rules restored", "Cases need repair"],
          effects: { service: 22, containment: 13, evidence: 8, governance: 12 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "H3-B",
          action: "Re-route everything from a fresh context sync.",
          consequence:
            "The backlog moves quickly. But the sync may import the corrupted mapping.",
          signals: ["Backlog moving", "Fault may return"],
          effects: { service: 26, containment: 2, evidence: 1, governance: 2 },
          points: 14,
          style: "rapid",
        },
        {
          id: "H3-C",
          action: "Manually triage the backlog before re-enabling AI.",
          consequence:
            "Affected customers are handled safely. But recovery is slow and labour-heavy.",
          signals: ["Customers protected", "Recovery slow"],
          effects: { service: 14, containment: 22, evidence: 7, governance: 8 },
          points: 18,
          style: "controlled",
        },
      ],
    },
    {
      id: "guardrail",
      label: "Decision 04 · Guardrail",
      title: "The next hand-off needs proof.",
      context: (state) =>
        state.evidence >= 50
          ? "Routing is returning, and the failed hop is visible. Each new transfer still needs proof of context and destination."
          : "Routing is returning without a complete trace. Each new transfer still needs proof of context and destination.",
      question: "How do you protect future hand-offs?",
      takeaway: "A safe hand-off verifies the payload, destination, and confidence.",
      options: [
        {
          id: "H4-A",
          action: "Validate context integrity and destination before transfer.",
          consequence:
            "Every hand-off is defensible. But verification adds another processing hop.",
          signals: ["Transfer verified", "Latency added"],
          effects: { service: 5, containment: 18, evidence: 16, governance: 22 },
          points: 20,
          style: "evidence",
        },
        {
          id: "H4-B",
          action: "Send low-confidence routes to people.",
          consequence:
            "Uncertain cases get judgement. But a poor threshold either floods people or leaks errors.",
          signals: ["Uncertainty routed", "Threshold critical"],
          effects: { service: 8, containment: 14, evidence: 8, governance: 18 },
          points: 17,
          style: "adaptive",
        },
        {
          id: "H4-C",
          action: "Allow only a fixed list of routes.",
          consequence:
            "Unexpected destinations are blocked. But legitimate edge cases bounce.",
          signals: ["Routes constrained", "Edge cases blocked"],
          effects: { service: 3, containment: 18, evidence: 2, governance: 16 },
          points: 14,
          style: "controlled",
        },
      ],
    },
    {
      id: "reactivate",
      label: "Decision 05 · Reactivate",
      title: "Automated routing can return.",
      context: (state) =>
        state.governance >= 62 && state.evidence >= 50
          ? "Routes are more observable and controlled. Confidence still varies by case."
          : "Routing works again, but visibility or controls remain incomplete.",
      question: "When do you let it route alone again?",
      takeaway: "Automation should expand only while real routing accuracy holds.",
      options: [
        {
          id: "H5-A",
          action: "Use suggest mode until routing accuracy holds.",
          consequence:
            "People validate every route. But hand-offs remain slower during recovery.",
          signals: ["Accuracy observed", "Hand-offs slower"],
          effects: { service: 9, containment: 8, evidence: 20, governance: 16 },
          points: 20,
          style: "evidence",
        },
        {
          id: "H5-B",
          action: "Auto-route high-confidence cases only.",
          consequence:
            "Most value returns quickly. But the confidence score now carries operational risk.",
          signals: ["Value restored", "Confidence trusted"],
          effects: { service: 19, containment: 10, evidence: 8, governance: 17 },
          points: 18,
          style: "adaptive",
        },
        {
          id: "H5-C",
          action: "Fully re-enable after test cases pass.",
          consequence:
            "Automation returns fastest. But the sample may not cover real customer variation.",
          signals: ["Automation restored", "Coverage uncertain"],
          effects: { service: 25, containment: 2, evidence: 4, governance: 6 },
          points: 14,
          style: "rapid",
        },
      ],
    },
  ],
};

export const incidents: IncidentDefinition[] = [
  runawayAgentIncident,
  edgePressureIncident,
  poisonedContextIncident,
  brokenHandoffIncident,
];

export const responseProfiles: Record<
  ResponseStyle,
  { title: string; description: string; strength: string; tradeoff: string }
> = {
  controlled: {
    title: "The first responder",
    description: "You stop the bleeding and limit the blast radius before restoring autonomy.",
    strength: "Fast containment",
    tradeoff: "Over-isolation can cost service or evidence.",
  },
  evidence: {
    title: "The investigator",
    description: "You protect the why, so recovery fixes the cause rather than only the symptom.",
    strength: "Strong root-cause thinking",
    tradeoff: "Evidence gathering can delay recovery.",
  },
  rapid: {
    title: "The restorer",
    description: "You get customers served quickly and keep the organisation moving under pressure.",
    strength: "Fast service recovery",
    tradeoff: "Speed can hide the cause or repeat the fault.",
  },
  adaptive: {
    title: "The adaptive strategist",
    description: "You change posture as the incident reveals new constraints.",
    strength: "Context-aware judgement",
    tradeoff: "Frequent course changes need clear ownership.",
  },
};
