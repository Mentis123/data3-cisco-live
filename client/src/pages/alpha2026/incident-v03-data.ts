export type IncidentState = {
  service: number;
  containment: number;
  evidence: number;
  governance: number;
};

export type ResponseStyle = "adaptive" | "rapid" | "evidence" | "controlled";

export type IncidentOption = {
  id: string;
  action: string;
  consequence: string;
  signals: [string, string];
  effects: IncidentState;
  points: number;
  style: ResponseStyle;
};

export type IncidentStage = {
  id: string;
  label: string;
  title: string;
  context: string | ((state: IncidentState) => string);
  question: string;
  options: IncidentOption[];
};

export const INITIAL_INCIDENT_STATE: IncidentState = {
  service: 40,
  containment: 25,
  evidence: 30,
  governance: 45,
};

export const runawayAgentIncident = {
  id: "runaway-agent",
  eyebrow: "Incident 01 · Agentic AI",
  title: "Runaway agent",
  premise:
    "An autonomous customer-service agent is repeatedly calling a degraded fulfilment service. Response times are climbing, retries are multiplying, and customers are abandoning requests. The cause is not yet confirmed.",
  learning:
    "Practise balancing service restoration, containment, evidence and governance when every action creates a trade-off.",
  stages: [
    {
      id: "retry-pressure",
      label: "Decision 01 · Stabilise",
      title: "The retry storm is accelerating.",
      context:
        "The agent has retried failed calls thousands of times. The fulfilment service is still responding, but latency and customer abandonment are rising.",
      question: "What do you do first?",
      options: [
        {
          id: "R1-A",
          action: "Pause the agent and queue new requests for manual processing.",
          consequence:
            "Retry pressure falls and the service can breathe. The new queue begins growing beyond the manual team's capacity.",
          signals: ["Spread contained", "Backlog growing"],
          effects: { service: -8, containment: 26, evidence: 4, governance: 6 },
          points: 17,
          style: "controlled",
        },
        {
          id: "R1-B",
          action: "Apply a retry budget and circuit breaker, while keeping low-risk requests online.",
          consequence:
            "Pressure drops and low-risk service continues. The system remains degraded, but the incident is no longer accelerating.",
          signals: ["Pressure reduced", "Partial service retained"],
          effects: { service: 10, containment: 20, evidence: 3, governance: 4 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "R1-C",
          action: "Hold changes for 90 seconds and capture distributed traces first.",
          consequence:
            "The trace reveals a repeatable failure pattern. During the capture window, abandonment grows and the service moves closer to saturation.",
          signals: ["Evidence improved", "Impact expanding"],
          effects: { service: -10, containment: -5, evidence: 24, governance: 2 },
          points: 14,
          style: "evidence",
        },
      ],
    },
    {
      id: "recovery-path",
      label: "Decision 02 · Recover",
      title: "A fallback is available, but unproven.",
      context: (state) =>
        state.containment >= 45
          ? "Retry pressure is slowing, but requests are now queued or running through partial service. A fallback service is available, although it has not been tested at this volume."
          : "The retry storm is still spreading through the service. A fallback is available, although it has not been tested at this volume and could inherit the same pressure.",
      question: "How do you use the fallback?",
      options: [
        {
          id: "R2-A",
          action: "Redirect all requests to the fallback at full load.",
          consequence:
            "Throughput improves quickly. The fallback begins showing resource pressure under a workload it has never carried before.",
          signals: ["Service restored", "Fallback exposed"],
          effects: { service: 24, containment: 2, evidence: 2, governance: -5 },
          points: 15,
          style: "rapid",
        },
        {
          id: "R2-B",
          action: "Keep the agent restricted until the original failure is confirmed.",
          consequence:
            "The investigation gains a cleaner evidence trail. Customer queues continue to grow while the team isolates the failure.",
          signals: ["Evidence improved", "Queues growing"],
          effects: { service: -8, containment: 8, evidence: 22, governance: 7 },
          points: 18,
          style: "evidence",
        },
        {
          id: "R2-C",
          action: "Send a small canary to the fallback with clear abort thresholds.",
          consequence:
            "The canary produces clean evidence. The team can increase traffic gradually without simply transferring the incident.",
          signals: ["Canary stable", "Exposure limited"],
          effects: { service: 17, containment: 10, evidence: 13, governance: 8 },
          points: 20,
          style: "adaptive",
        },
      ],
    },
    {
      id: "identity-blast-radius",
      label: "Decision 03 · Contain",
      title: "The agent has more authority than expected.",
      context:
        "The agent uses a shared service identity with write access across test and production, plus several administrative tools. No malicious activity has been confirmed.",
      question: "How do you contain its authority?",
      options: [
        {
          id: "R3-A",
          action: "Revoke the agent token and issue a scoped, time-limited identity.",
          consequence:
            "Broad authority is removed. Recovery becomes controlled and traceable, although several actions now require explicit approval.",
          signals: ["Authority scoped", "Actions attributable"],
          effects: { service: -2, containment: 18, evidence: 8, governance: 24 },
          points: 20,
          style: "controlled",
        },
        {
          id: "R3-B",
          action: "Rotate the shared credential across every dependent service.",
          consequence:
            "The original credential is invalidated quickly. Two dependent integrations fail and create a second operational queue.",
          signals: ["Credential invalidated", "Dependencies disrupted"],
          effects: { service: -14, containment: 14, evidence: -5, governance: 12 },
          points: 16,
          style: "rapid",
        },
        {
          id: "R3-C",
          action: "Restrict the network path and monitor tool calls before changing identity.",
          consequence:
            "Visibility improves and suspicious tool use can be observed. The shared identity remains a latent weakness if another path opens.",
          signals: ["Visibility increased", "Identity risk remains"],
          effects: { service: 3, containment: 7, evidence: 20, governance: -2 },
          points: 15,
          style: "evidence",
        },
      ],
    },
    {
      id: "customer-operations",
      label: "Decision 04 · Restore",
      title: "Customer demand is returning.",
      context: (state) => {
        if (state.service < 45) {
          return "Customer queues remain high and patience is falling. Low-risk requests can be automated, but high-impact cases still need judgement.";
        }
        if (state.containment < 50) {
          return "Service is improving, but the incident can still compound if automation expands too quickly. High-impact cases still need judgement.";
        }
        return "Low-risk service is stabilising and demand is returning. High-impact cases still require judgement before automation expands.";
      },
      question: "What do you restore next?",
      options: [
        {
          id: "R4-A",
          action: "Restore every customer intent with enhanced monitoring.",
          consequence:
            "Backlogs fall quickly. One high-impact request reaches the degraded dependency before monitoring stops the flow.",
          signals: ["Backlog falling", "High-impact regression"],
          effects: { service: 22, containment: -8, evidence: 4, governance: -7 },
          points: 16,
          style: "rapid",
        },
        {
          id: "R4-B",
          action: "Restore low-risk intents and send high-impact work to people with full context.",
          consequence:
            "Most customers return to normal service. High-impact work is slower, but each decision remains accountable and informed.",
          signals: ["Low-risk service restored", "Judgement retained"],
          effects: { service: 16, containment: 10, evidence: 8, governance: 17 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "R4-C",
          action: "Keep automation restricted and clear the backlog manually.",
          consequence:
            "No automated regression occurs. The backlog clears slowly while fatigue and deferred work begin to accumulate.",
          signals: ["Regression avoided", "Manual load rising"],
          effects: { service: 3, containment: 15, evidence: 8, governance: 10 },
          points: 17,
          style: "controlled",
        },
      ],
    },
    {
      id: "reactivation-gate",
      label: "Decision 05 · Govern",
      title: "The immediate impact is stabilising.",
      context:
        "The team needs a safe path back to normal operation. The strength of the root-cause evidence and the remaining control gaps depend on the choices already made.",
      question: "What must be true before full reactivation?",
      options: [
        {
          id: "R5-A",
          action: "Re-enable after synthetic tests pass, then review production behaviour.",
          consequence:
            "Synthetic checks pass. Production monitoring now carries the risk of conditions the test path did not reproduce.",
          signals: ["Tests passed", "Production carries uncertainty"],
          effects: { service: 18, containment: -3, evidence: 5, governance: 1 },
          points: 15,
          style: "rapid",
        },
        {
          id: "R5-B",
          action: "Keep the agent disabled until a formal root-cause and control review is complete.",
          consequence:
            "The incident is well documented and structural improvements are identified. Manual operating cost continues during the review.",
          signals: ["Root cause documented", "Manual cost continues"],
          effects: { service: -5, containment: 9, evidence: 20, governance: 18 },
          points: 17,
          style: "evidence",
        },
        {
          id: "R5-C",
          action: "Stage the re-enable with scoped authority, live thresholds, tracing and an independent kill switch.",
          consequence:
            "Low-risk service returns first. Authority expands only while outcomes stay inside agreed thresholds and every action remains traceable.",
          signals: ["Reactivation staged", "Guardrails enforceable"],
          effects: { service: 16, containment: 14, evidence: 12, governance: 20 },
          points: 20,
          style: "adaptive",
        },
      ],
    },
  ] satisfies IncidentStage[],
};

export const responseProfiles: Record<ResponseStyle, {
  title: string;
  strength: string;
  tradeoff: string;
}> = {
  adaptive: {
    title: "Adaptive responder",
    strength: "You balanced restoration, evidence, containment and control as the incident changed.",
    tradeoff: "This approach relies on strong observability and clear ownership; a nuanced response can become complex.",
  },
  rapid: {
    title: "Rapid restorer",
    strength: "You prioritised customer momentum and returned useful service quickly.",
    tradeoff: "Speed can leave residual uncertainty or move the incident into another part of the system.",
  },
  evidence: {
    title: "Evidence-first investigator",
    strength: "You preserved information and reduced the risk of treating a symptom as the cause.",
    tradeoff: "Investigation time can extend customer and operational impact.",
  },
  controlled: {
    title: "Controlled stabiliser",
    strength: "You reduced the blast radius and kept consequential actions attributable.",
    tradeoff: "Approvals and manual steps can slow restoration and increase operating load.",
  },
};
