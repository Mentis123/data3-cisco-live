export type TriviaCardCategory =
  | "NETWORKING"
  | "SECURITY"
  | "COLLABORATION"
  | "DATA_CENTER";

export const triviaCardCategories: TriviaCardCategory[] = [
  "NETWORKING",
  "SECURITY",
  "COLLABORATION",
  "DATA_CENTER",
];

export function isTriviaCardCategory(value: string): value is TriviaCardCategory {
  return triviaCardCategories.includes(value as TriviaCardCategory);
}

export interface TriviaCard {
  id: string;
  category: TriviaCardCategory;
  title: string;
  scenario: string;
  prompt: string;
  winningMove: string;
  rationale: string;
  scoringSignals: string[];
}

export const triviaCardCategoryMeta: Record<TriviaCardCategory, { name: string; accent: string; blurb: string; icon: string; color: string; description: string }> = {
  NETWORKING: {
    name: "Networking",
    accent: "bg-[#00BCF2]",
    color: "#00BCF2",
    icon: "🌐",
    blurb: "High-performance secure connectivity that scales with the business.",
    description: "High-performance secure connectivity that scales with the business.",
  },
  SECURITY: {
    name: "Security",
    accent: "bg-[#6B21A8]",
    color: "#6B21A8",
    icon: "🛡️",
    blurb: "Zero trust network access and intelligent threat detection.",
    description: "Zero trust network access and intelligent threat detection.",
  },
  COLLABORATION: {
    name: "Collaboration",
    accent: "bg-[#F97316]",
    color: "#F97316",
    icon: "👥",
    blurb: "Seamless communication and exceptional omnichannel customer experiences.",
    description: "Seamless communication and exceptional omnichannel customer experiences.",
  },
  DATA_CENTER: {
    name: "Cloud & AI",
    accent: "bg-[#059669]",
    color: "#059669",
    icon: "🏢",
    blurb: "Secure, resilient infrastructure for traditional and AI workloads.",
    description: "Secure, resilient infrastructure for traditional and AI workloads.",
  },
};

export const triviaCardDeck: TriviaCard[] = [
  {
    id: "networking-branch-congestion",
    category: "NETWORKING",
    title: "Branch network congestion during peak hours",
    scenario:
      "Eight branch offices experience severe slowdowns between 9-11 AM when video calls spike. The legacy MPLS circuits can't scale without six-month lead times, and IT lacks visibility into which applications consume bandwidth.",
    prompt:
      "How do you restore performance and gain control without waiting for carrier upgrades?",
    winningMove:
      "Deploy Cisco SD-WAN with application-aware routing to prioritize video traffic over the existing internet links. Add Meraki wireless to offload mobile devices and leverage ThousandEyes to monitor end-to-end application performance across all sites.",
    rationale:
      "This solution addresses the networking category by improving connectivity, optimizing traffic flow, and providing visibility without requiring new physical circuits.",
    scoringSignals: [
      "Mentions SD-WAN or intelligent path selection",
      "Addresses application prioritization or QoS",
      "Includes monitoring or visibility tools",
    ],
  },
  {
    id: "security-credential-theft",
    category: "SECURITY",
    title: "Credential theft from phishing campaign",
    scenario:
      "Fifteen employees clicked a phishing link, exposing credentials to internal finance systems. The legacy VPN grants full network access once authenticated, allowing lateral movement before security detected the breach.",
    prompt:
      "What prevents future credential compromises from escalating into full network breaches?",
    winningMove:
      "Implement Cisco Duo for multi-factor authentication and device trust checks on every access attempt. Layer Umbrella DNS security to block phishing domains before users click, and deploy zero trust network access with Secure Access to segment application access by identity.",
    rationale:
      "This response hits the security category by adding identity protection, threat prevention, and zero trust segmentation to contain breaches.",
    scoringSignals: [
      "References MFA, Duo, or identity verification",
      "Mentions zero trust or network segmentation",
      "Includes threat prevention (Umbrella, DNS security)",
    ],
  },
  {
    id: "collaboration-low-fcr",
    category: "COLLABORATION",
    title: "Low first-call resolution in support center",
    scenario:
      "Customer support resolves only 38% of enquiries on the first call. Agents toggle between eight different systems to find customer history, and supervisors lack real-time coaching visibility, resulting in 14-minute average handle times.",
    prompt:
      "How do you improve resolution rates without hiring more agents?",
    winningMove:
      "Deploy Webex Contact Center with an integrated agent desktop that surfaces CRM, knowledge base, and customer sentiment in a single view. Add AI-powered call transcription and real-time supervisor dashboards to enable proactive coaching during live interactions.",
    rationale:
      "This solution targets the collaboration category by unifying communication tools, reducing friction for agents, and improving customer experience metrics.",
    scoringSignals: [
      "Mentions Webex Contact Center or unified desktop",
      "References AI assistance, transcription, or sentiment analysis",
      "Ties solution to metrics like FCR or handle time",
    ],
  },
  {
    id: "datacenter-vm-provisioning",
    category: "DATA_CENTER",
    title: "VM provisioning delays blocking development",
    scenario:
      "The data centre runs 450 virtual machines on aging hardware. Development teams request new environments weekly, but provisioning takes 4-6 weeks due to manual processes and capacity constraints, causing sprint delays.",
    prompt:
      "How do you accelerate provisioning while optimizing existing infrastructure investment?",
    winningMove:
      "Implement Cisco Intersight to gain visibility into underutilized compute resources, then deploy UCS X-Series for elastic capacity expansion. Automate provisioning with Terraform integration so developers self-service environments that spin up in minutes instead of weeks.",
    rationale:
      "This addresses the data centre category by modernizing infrastructure, automating operations, and bridging on-premises capacity with scalable solutions.",
    scoringSignals: [
      "Mentions Intersight, UCS, or infrastructure automation",
      "References capacity optimization or elastic expansion",
      "Includes infrastructure-as-code or self-service provisioning",
    ],
  },
];
