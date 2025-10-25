export type FlashCardCategory =
  | "SECURE_CONNECTIVITY"
  | "HYBRID_DC"
  | "COLLAB_CX"
  | "OBSERVABILITY"
  | "EDGE_IOT";

export const flashCardCategories: FlashCardCategory[] = [
  "SECURE_CONNECTIVITY",
  "HYBRID_DC",
  "COLLAB_CX",
  "OBSERVABILITY",
  "EDGE_IOT",
];

export function isFlashCardCategory(value: string): value is FlashCardCategory {
  return flashCardCategories.includes(value as FlashCardCategory);
}

export interface FlashCard {
  id: string;
  category: FlashCardCategory;
  title: string;
  scenario: string;
  prompt: string;
  winningMove: string;
  rationale: string;
  scoringSignals: string[];
}

export const flashCardCategoryMeta: Record<FlashCardCategory, { name: string; accent: string; blurb: string }> = {
  SECURE_CONNECTIVITY: {
    name: "Zero Trust & Secure Connectivity",
    accent: "bg-[#00BCF2]",
    blurb: "Lock the perimeter and the device posture without slowing trusted workflows.",
  },
  HYBRID_DC: {
    name: "Hybrid Cloud Infrastructure",
    accent: "bg-[#8A2BE2]",
    blurb: "Shorten lead times and right-size spend across on-prem and cloud footprints.",
  },
  COLLAB_CX: {
    name: "Collaboration & Customer Experience",
    accent: "bg-[#F97316]",
    blurb: "Remove the friction that keeps agents and knowledge workers from delighting customers.",
  },
  OBSERVABILITY: {
    name: "Observability & Automation",
    accent: "bg-[#38BDF8]",
    blurb: "Detect, triage and resolve incidents before they become customer-facing outages.",
  },
  EDGE_IOT: {
    name: "Edge & IoT Automation",
    accent: "bg-[#22C55E]",
    blurb: "Push intelligence to the edge to eliminate costly delays on the production floor.",
  },
};

export const flashCardDeck: FlashCard[] = [
  {
    id: "secure-vpn-zero-trust",
    category: "SECURE_CONNECTIVITY",
    title: "Finance VPN with lateral movement",
    scenario:
      "Finance analysts still connect to Oracle financials through a legacy VPN. Devices miss posture checks and one compromised laptop accessed twelve systems before the SOC noticed.",
    prompt:
      "What high-scoring move keeps the analysts productive while closing the lateral movement risk right away?",
    winningMove:
      "Pivot the estate onto Cisco Secure Connect with per-application segmentation and enforced device posture. Pair the change with Duo risk-based authentication so analysts stay inside a zero-trust policy without losing access to the finance stack.",
    rationale:
      "This answer lands the secure connectivity dial because it replaces the flat VPN with a SASE fabric, enforces device trust and keeps critical apps reachable without hair-pinning traffic.",
    scoringSignals: [
      "Calls out Secure Connect or SASE with per-app segmentation",
      "Mentions device posture / Duo adaptive access",
      "Keeps the finance workflow online during the cutover",
    ],
  },
  {
    id: "hybrid-capacity-lag",
    category: "HYBRID_DC",
    title: "Provisioning bottleneck in hybrid estate",
    scenario:
      "Three Melbourne data centres run 340 VMs on ageing hardware. Provisioning a new analytics sandbox still takes 6–8 weeks while product teams expect a 48-hour turnaround.",
    prompt:
      "How do you unlock the capacity fast enough for sprint teams without overspending on stranded hardware?",
    winningMove:
      "Stand up Intersight automation to surface the 77% idle compute, then burst the analytics sandboxes into Cisco UCS X-Series managed from the same control plane. Use Terraform workflows so dev teams request capacity that lands in minutes, not weeks.",
    rationale:
      "The response blends optimisation of the on-prem estate with elastic expansion, which is the hybrid cloud dial. It shortens lead time, reuses existing spend and adds automation hooks developers can self-serve.",
    scoringSignals: [
      "Identifies idle capacity and ties it to a control plane (Intersight)",
      "Introduces elastic expansion (X-Series or cloud burst)",
      "Mentions automation / infrastructure-as-code to speed delivery",
    ],
  },
  {
    id: "collab-contact-center",
    category: "COLLAB_CX",
    title: "Low FCR in the contact centre",
    scenario:
      "Customer care only resolves 34% of enquiries on the first call. Agents juggle six disconnected apps and escalate 73% of tickets for supervisor lookups, adding twelve minutes per incident.",
    prompt:
      "What unlocks faster resolutions without adding more headcount?",
    winningMove:
      "Roll Webex Contact Center with the Customer Experience Insights workspace so every interaction pulls CRM, knowledge base and sentiment data into one pane. Layer AI summarisation to feed supervisors real-time coaching instead of manual escalations.",
    rationale:
      "It attacks the collaboration dial by unifying the desktop, reducing handle time and empowering supervisors with data instead of manual catch-up.",
    scoringSignals: [
      "Highlights a unified agent desktop (Webex Contact Center, AI workspaces)",
      "References AI assistance or summarisation to kill the escalations",
      "Connects to FCR / handle time improvements tied to KPIs",
    ],
  },
  {
    id: "observability-latency",
    category: "OBSERVABILITY",
    title: "Reactive incident response",
    scenario:
      "Ops only hears about outages after 23-minute user complaints. Root cause hunts stretch past four hours because telemetry lives in fifteen toolsets.",
    prompt:
      "How do you shrink detection and MTTR so execs trust the platform again?",
    winningMove:
      "Deploy Full-Stack Observability with AppDynamics Cloud and ThousandEyes so digital experience and infrastructure traces land in one timeline. Automate runbooks with Crosswork so alerts trigger remediation playbooks instead of Slack firefights.",
    rationale:
      "Combining FSO visibility with automation delivers the observability dial: faster detection, correlated insights and scripted resolution steps.",
    scoringSignals: [
      "Mentions AppDynamics + ThousandEyes or FSO bundle",
      "Talks about correlated telemetry across stack layers",
      "Calls out automation or runbooks that reduce MTTR",
    ],
  },
  {
    id: "edge-latency-false-shutdowns",
    category: "EDGE_IOT",
    title: "Edge latency causes false shutdowns",
    scenario:
      "Manufacturing sensors push 2.3 TB of data to the cloud each day. The 340 ms round trip means 12 false-positive shutdowns a month, costing $47K in lost production.",
    prompt:
      "What lets operations trust the alerts without waiting on the cloud round trip?",
    winningMove:
      "Move analytics to Cisco Edge Intelligence on ruggedised compute beside the line. Stream only anomalies back to the cloud and feed Site Manager automation so maintenance teams schedule interventions before downtime hits.",
    rationale:
      "Processing data at the edge is the Edge & IoT dial. It slashes latency, reduces false positives and ties insights to automated maintenance actions.",
    scoringSignals: [
      "Calls out edge analytics / Edge Intelligence or similar",
      "Explains how latency drops and false positives disappear",
      "Connects insights to automated maintenance or Site Manager",
    ],
  },
];
