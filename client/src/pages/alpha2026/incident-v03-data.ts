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
  inject?: string;
  question: string;
  takeaway: string;
  options: IncidentOption[];
};

export type IncidentDefinition = {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  theme: string;
  teaser: string;
  premise: string;
  learning: string;
  briefing?: {
    facts: [string, string, string];
    objective: string;
  };
  debrief: string;
  conversationPrompt?: string;
  initialState: IncidentState;
  stages: IncidentStage[];
};

const runawayAgentIncident: IncidentDefinition = {
  id: "runaway-agent",
  number: "01",
  eyebrow: "Agentic AI",
  title: "Runaway agent",
  theme: "Agents and guardrails",
  teaser: "Automation is compounding a service failure.",
  premise:
    "A customer-service agent is hammering a degraded fulfilment service. Retries are multiplying, and customers are abandoning requests. The cause is unclear.",
  learning:
    "Balance service, evidence, containment, and control while the incident changes.",
  debrief:
    "Strong agent recovery limits compounding load, narrows authority, and restores autonomy in observable stages.",
  initialState: { service: 40, containment: 25, evidence: 30, governance: 45 },
  stages: [
    {
      id: "retry-pressure",
      label: "Decision 01 · Stabilise",
      title: "The retry storm is accelerating.",
      context:
        "Thousands of retries are driving latency and abandonment. The service is degraded, but still responding.",
      question: "What do you do first?",
      takeaway: "Stop compounding load before chasing a perfect diagnosis.",
      options: [
        {
          id: "R1-A",
          action: "Pause the agent. Queue new work for people.",
          consequence:
            "Retry pressure falls. The manual queue soon exceeds the team's capacity.",
          signals: ["Spread contained", "Backlog growing"],
          effects: { service: -8, containment: 26, evidence: 4, governance: 6 },
          points: 15,
          style: "controlled",
        },
        {
          id: "R1-B",
          action: "Set a retry budget and circuit breaker. Keep low-risk requests live.",
          consequence:
            "Pressure drops, and low-risk service continues. The incident stops accelerating.",
          signals: ["Pressure reduced", "Partial service retained"],
          effects: { service: 10, containment: 20, evidence: 3, governance: 4 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "R1-C",
          action: "Rate-limit at the gateway. Trace the failure before changing the agent.",
          consequence:
            "The trace exposes a repeatable call pattern. Customer impact continues at a slower rate.",
          signals: ["Evidence improved", "Impact slowed"],
          effects: { service: -4, containment: 10, evidence: 22, governance: 4 },
          points: 18,
          style: "evidence",
        },
      ],
    },
    {
      id: "recovery-path",
      label: "Decision 02 · Recover",
      title: "A fallback is available.",
      context: (state) =>
        state.containment >= 45
          ? "Pressure is slowing, but requests are queued. The fallback has not carried this volume."
          : "The retry storm is still spreading. The untested fallback could inherit the same pressure.",
      question: "How do you use it?",
      takeaway: "Recovery is safer when it is observable and reversible.",
      options: [
        {
          id: "R2-A",
          action: "Move read-only requests to the fallback. Queue all writes.",
          consequence:
            "Useful service returns quickly. Write requests continue building in the queue.",
          signals: ["Reads restored", "Writes queued"],
          effects: { service: 20, containment: 7, evidence: 3, governance: 2 },
          points: 18,
          style: "rapid",
        },
        {
          id: "R2-B",
          action: "Keep the agent restricted. Test the failing path with synthetic requests.",
          consequence:
            "The failure boundary becomes clearer. Customers wait while testing continues.",
          signals: ["Failure isolated", "Queue growing"],
          effects: { service: -5, containment: 9, evidence: 22, governance: 7 },
          points: 16,
          style: "evidence",
        },
        {
          id: "R2-C",
          action: "Canary the fallback with live abort thresholds.",
          consequence:
            "The canary is stable. Traffic can increase without transferring the whole incident.",
          signals: ["Recovery tested", "Exposure bounded"],
          effects: { service: 17, containment: 10, evidence: 13, governance: 8 },
          points: 20,
          style: "adaptive",
        },
      ],
    },
    {
      id: "identity-blast-radius",
      label: "Decision 03 · Contain",
      title: "The agent has broad authority.",
      context:
        "Its shared identity can write to test, production, and several admin tools. No malicious activity is confirmed.",
      question: "How do you narrow the blast radius?",
      takeaway: "An agent's blast radius follows its identity and tools.",
      options: [
        {
          id: "R3-A",
          action: "Revoke its token. Issue a scoped, time-limited identity.",
          consequence:
            "Broad authority disappears. Recovery stays traceable, although more actions need approval.",
          signals: ["Authority scoped", "Actions attributable"],
          effects: { service: -2, containment: 18, evidence: 8, governance: 24 },
          points: 20,
          style: "controlled",
        },
        {
          id: "R3-B",
          action: "Rotate the shared credential using the dependency runbook.",
          consequence:
            "The exposed credential is replaced. Two slow dependencies extend the recovery window.",
          signals: ["Credential rotated", "Recovery delayed"],
          effects: { service: -6, containment: 16, evidence: 2, governance: 16 },
          points: 18,
          style: "rapid",
        },
        {
          id: "R3-C",
          action: "Restrict its network path. Inspect every tool call before changing identity.",
          consequence:
            "Visibility improves. The shared identity remains a latent weakness if another path opens.",
          signals: ["Tool calls visible", "Identity risk remains"],
          effects: { service: 3, containment: 9, evidence: 20, governance: 1 },
          points: 15,
          style: "evidence",
        },
      ],
    },
    {
      id: "customer-operations",
      label: "Decision 04 · Restore",
      title: "Demand is returning.",
      context: (state) => {
        if (state.service < 50) return "Queues remain high. Low-risk work can run, but high-impact cases need judgement.";
        if (state.containment < 55) return "Service is improving, but automation could still compound the incident.";
        return "Low-risk service is stable. High-impact cases still need judgement.";
      },
      question: "What do you restore next?",
      takeaway: "Restore automation in proportion to consequence.",
      options: [
        {
          id: "R4-A",
          action: "Restore intents that pass synthetic checks. Monitor for automatic rollback.",
          consequence:
            "Backlogs fall. One high-impact request reaches the degraded dependency before rollback.",
          signals: ["Backlog falling", "One regression"],
          effects: { service: 20, containment: -3, evidence: 7, governance: 2 },
          points: 18,
          style: "rapid",
        },
        {
          id: "R4-B",
          action: "Restore low-risk work. Send high-impact cases to people with full context.",
          consequence:
            "Most customers return to normal. Consequential work stays slower, but accountable.",
          signals: ["Service restored", "Judgement retained"],
          effects: { service: 16, containment: 10, evidence: 8, governance: 17 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "R4-C",
          action: "Keep automation restricted. Clear the backlog manually.",
          consequence:
            "No automated regression occurs. Fatigue and deferred work begin to accumulate.",
          signals: ["Regression avoided", "Manual load rising"],
          effects: { service: 3, containment: 15, evidence: 8, governance: 10 },
          points: 16,
          style: "controlled",
        },
      ],
    },
    {
      id: "reactivation-gate",
      label: "Decision 05 · Govern",
      title: "The impact is stabilising.",
      context:
        "The team needs a safe path back to normal. Root-cause confidence depends on earlier choices.",
      question: "What unlocks full reactivation?",
      takeaway: "Reactivation is a control decision, not a switch.",
      options: [
        {
          id: "R5-A",
          action: "Require clean synthetic tests, an error budget, and automatic rollback.",
          consequence:
            "Tests pass, and service returns. Production still carries conditions the test path missed.",
          signals: ["Tests passed", "Residual uncertainty"],
          effects: { service: 18, containment: 5, evidence: 7, governance: 7 },
          points: 18,
          style: "rapid",
        },
        {
          id: "R5-B",
          action: "Stay offline until root-cause and control reviews finish.",
          consequence:
            "Structural improvements are clear. Manual operating cost continues during review.",
          signals: ["Root cause documented", "Value deferred"],
          effects: { service: -5, containment: 9, evidence: 20, governance: 18 },
          points: 16,
          style: "evidence",
        },
        {
          id: "R5-C",
          action: "Stage reactivation with scoped authority, live thresholds, tracing, and a separate kill switch.",
          consequence:
            "Low-risk work returns first. Authority expands only while outcomes stay acceptable.",
          signals: ["Reactivation staged", "Guardrails enforceable"],
          effects: { service: 16, containment: 14, evidence: 12, governance: 20 },
          points: 20,
          style: "adaptive",
        },
      ],
    },
  ],
};

const edgeAiIncident: IncidentDefinition = {
  id: "edge-ai-degradation",
  number: "02",
  eyebrow: "Edge AI",
  title: "Edge under pressure",
  theme: "Edge AI and resilience",
  teaser: "Inference is slowing across distributed sites.",
  premise:
    "A new vision model is live at 18 distribution sites. Inference is slowing, frame queues are growing, and cloud spillover is crowding business traffic.",
  learning:
    "Separate model, compute, and network signals while protecting site operations.",
  debrief:
    "Resilient edge AI needs correlated telemetry, bounded cloud fallback, and cohort-based change with fast rollback.",
  initialState: { service: 38, containment: 28, evidence: 32, governance: 46 },
  stages: [
    {
      id: "latency-spike",
      label: "Decision 01 · Detect",
      title: "Latency triples at 18 sites.",
      context:
        "The spike followed a model update. Device health looks normal, but model, camera, and network data sit in separate views.",
      question: "What is your first move?",
      takeaway: "Correlate model, compute, network, and business impact.",
      options: [
        {
          id: "E1-A",
          action: "Roll back affected sites. Keep one site shadowing the new model.",
          consequence:
            "Most sites recover. The shadow site preserves evidence without carrying production decisions.",
          signals: ["Latency reduced", "Evidence preserved"],
          effects: { service: 16, containment: 17, evidence: 12, governance: 8 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "E1-B",
          action: "Shift all inference to cloud. Inspect the edge after service returns.",
          consequence:
            "Inference resumes quickly. Uplink use climbs, and other site applications begin slowing.",
          signals: ["Inference restored", "Network pressure rising"],
          effects: { service: 20, containment: -6, evidence: 4, governance: -4 },
          points: 15,
          style: "rapid",
        },
        {
          id: "E1-C",
          action: "Freeze rollout. Trace camera-to-decision latency at two sites.",
          consequence:
            "The bottleneck becomes visible. Frame queues keep growing during the trace window.",
          signals: ["Bottleneck visible", "Queues growing"],
          effects: { service: -5, containment: 10, evidence: 24, governance: 7 },
          points: 18,
          style: "evidence",
        },
      ],
    },
    {
      id: "memory-pressure",
      label: "Decision 02 · Contain",
      title: "Memory pressure is the constraint.",
      context: (state) =>
        state.evidence >= 50
          ? "The trace links pressure to the larger model and extended video retention."
          : "Sampling points to the larger model and video retention, but the evidence is incomplete.",
      question: "How do you create headroom?",
      takeaway: "Capacity fixes should preserve evidence of the real constraint.",
      options: [
        {
          id: "E2-A",
          action: "Reduce input resolution and retention. Keep the latency target.",
          consequence:
            "Latency recovers. Lower-resolution inputs slightly reduce detection quality.",
          signals: ["Capacity restored", "Quality reduced"],
          effects: { service: 18, containment: 10, evidence: 3, governance: 2 },
          points: 18,
          style: "rapid",
        },
        {
          id: "E2-B",
          action: "Restart edge nodes in waves. Leave one affected node untouched.",
          consequence:
            "Headroom returns briefly. The untouched node proves the pressure will recur.",
          signals: ["Short-term recovery", "Cause retained"],
          effects: { service: 12, containment: 8, evidence: 16, governance: 8 },
          points: 16,
          style: "controlled",
        },
        {
          id: "E2-C",
          action: "Shadow old and new models at one site. Sample video only during trace windows.",
          consequence:
            "Capacity stabilises. The comparison shows the new model needs a different resource profile.",
          signals: ["Capacity stable", "Model cost measured"],
          effects: { service: 14, containment: 14, evidence: 20, governance: 10 },
          points: 20,
          style: "adaptive",
        },
      ],
    },
    {
      id: "network-contention",
      label: "Decision 03 · Protect",
      title: "Fallback traffic hits the network.",
      context: (state) =>
        state.containment < 45
          ? "Cloud spillover is still growing. Packet loss now affects warehouse applications at peak volume."
          : "Spillover is bounded, but peak traffic still affects warehouse applications.",
      question: "What gets priority?",
      takeaway: "Cloud fallback moves load; it does not remove it.",
      options: [
        {
          id: "E3-A",
          action: "Reserve capacity for site operations. Cap spillover per site.",
          consequence:
            "Warehouse applications stabilise. Some inference waits locally instead of flooding the link.",
          signals: ["Operations protected", "Inference queued"],
          effects: { service: 10, containment: 18, evidence: 8, governance: 12 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "E3-B",
          action: "Stop cloud spillover. Fail late inferences to manual review.",
          consequence:
            "Network pressure disappears. Manual review volume rises sharply at busy sites.",
          signals: ["Network recovered", "Manual queue rising"],
          effects: { service: -5, containment: 20, evidence: 5, governance: 13 },
          points: 18,
          style: "controlled",
        },
        {
          id: "E3-C",
          action: "Move spillover to backup links after a fast capacity test.",
          consequence:
            "Primary links recover. Backup-link latency makes several decisions arrive too late.",
          signals: ["Primary link clear", "Decision latency rising"],
          effects: { service: 13, containment: 4, evidence: 7, governance: 1 },
          points: 15,
          style: "rapid",
        },
      ],
    },
    {
      id: "input-shift",
      label: "Decision 04 · Diagnose",
      title: "The model is not the only change.",
      context:
        "Model hashes match. Camera firmware at six sites changed colour processing and shifted the inputs.",
      question: "How do you restore confidence?",
      takeaway: "Model quality depends on the whole input pipeline.",
      options: [
        {
          id: "E4-A",
          action: "Roll back camera firmware at the six changed sites.",
          consequence:
            "Input consistency returns. The interaction is contained, but not yet explained.",
          signals: ["Inputs restored", "Cause still open"],
          effects: { service: 16, containment: 11, evidence: 7, governance: 7 },
          points: 16,
          style: "controlled",
        },
        {
          id: "E4-B",
          action: "Quarantine six sites. Restore the old model and compare input drift there.",
          consequence:
            "Affected sites recover. The comparison isolates the firmware-model interaction.",
          signals: ["Sites recovered", "Interaction isolated"],
          effects: { service: 15, containment: 15, evidence: 20, governance: 10 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "E4-C",
          action: "Keep the new model. Raise confidence thresholds and review exceptions.",
          consequence:
            "False positives fall. More valid events move to manual review while evidence builds.",
          signals: ["Noise reduced", "Review load rising"],
          effects: { service: 7, containment: 10, evidence: 17, governance: 11 },
          points: 18,
          style: "evidence",
        },
      ],
    },
    {
      id: "edge-rollout-gate",
      label: "Decision 05 · Govern",
      title: "The next rollout is waiting.",
      context:
        "Operations want the model's benefits. The team now understands the capacity and input dependencies.",
      question: "What controls the next release?",
      takeaway: "Distributed AI needs cohort rollout and automatic rollback.",
      options: [
        {
          id: "E5-A",
          action: "Resume globally after a 15-minute service target passes. Keep automatic rollback.",
          consequence:
            "The release moves quickly. Short validation misses one site's peak-volume behaviour.",
          signals: ["Rollout resumed", "Peak risk missed"],
          effects: { service: 18, containment: 2, evidence: 5, governance: 7 },
          points: 16,
          style: "rapid",
        },
        {
          id: "E5-B",
          action: "Hold release until capacity modelling and root-cause review finish.",
          consequence:
            "The release plan is well evidenced. Operational benefits remain delayed.",
          signals: ["Capacity understood", "Benefits delayed"],
          effects: { service: -3, containment: 9, evidence: 20, governance: 17 },
          points: 18,
          style: "evidence",
        },
        {
          id: "E5-C",
          action: "Release by cohort with quality, cost, capacity, and network abort thresholds.",
          consequence:
            "Each cohort expands only while business and technical outcomes stay inside limits.",
          signals: ["Change bounded", "Outcomes observable"],
          effects: { service: 16, containment: 14, evidence: 13, governance: 20 },
          points: 20,
          style: "adaptive",
        },
      ],
    },
  ],
};

const poisonedContextIncident: IncidentDefinition = {
  id: "corrupted-agent-context",
  number: "03",
  eyebrow: "AI security",
  title: "Poisoned context",
  theme: "AI security and provenance",
  teaser: "Trusted context is triggering unsafe actions.",
  premise:
    "An internal support agent recommends a privileged fix from a newly indexed document. It has attempted the same admin tool call across several tickets.",
  learning:
    "Contain unsafe actions, trace poisoned context, and restore a trustworthy action chain.",
  debrief:
    "Secure agents need source provenance, runtime inspection, scoped tool access, and tests that cover the complete action chain.",
  initialState: { service: 55, containment: 20, evidence: 25, governance: 35 },
  stages: [
    {
      id: "unsafe-recommendation",
      label: "Decision 01 · Contain",
      title: "The agent is repeating a risky fix.",
      context:
        "Tool calls are stopping at approval, but users still see the recommendation. Support demand is rising.",
      question: "What do you contain first?",
      takeaway: "Contain actions while preserving the evidence trail.",
      options: [
        {
          id: "P1-A",
          action: "Take the agent offline. Send users to static support content.",
          consequence:
            "Unsafe advice stops. Support queues grow, and live session evidence is lost.",
          signals: ["Advice stopped", "Queues growing"],
          effects: { service: -12, containment: 24, evidence: -3, governance: 10 },
          points: 16,
          style: "controlled",
        },
        {
          id: "P1-B",
          action: "Switch the agent to read-only. Block the tool and preserve sessions.",
          consequence:
            "Useful support continues. Unsafe actions stop, and the evidence trail remains intact.",
          signals: ["Actions blocked", "Sessions preserved"],
          effects: { service: 8, containment: 22, evidence: 13, governance: 12 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "P1-C",
          action: "Keep approval blocking. Trace retrieval and tool calls for 60 seconds.",
          consequence:
            "No tool action completes. More users see the unsafe recommendation while tracing runs.",
          signals: ["Actions blocked", "Exposure continuing"],
          effects: { service: -4, containment: 9, evidence: 24, governance: 5 },
          points: 18,
          style: "evidence",
        },
      ],
    },
    {
      id: "source-lineage",
      label: "Decision 02 · Trace",
      title: "One runbook points to the source.",
      context: (state) =>
        state.evidence >= 45
          ? "Retrieval logs identify one runbook. Copies may remain in caches and another index."
          : "A recent runbook is the lead, but retrieval evidence is incomplete and copies may exist.",
      question: "How do you isolate it?",
      takeaway: "Treat context as a supply chain with provenance.",
      options: [
        {
          id: "P2-A",
          action: "Delete the source. Purge and rebuild every index.",
          consequence:
            "The recommendation disappears. Broad rebuilding removes useful context and obscures its path.",
          signals: ["Content removed", "Lineage obscured"],
          effects: { service: -8, containment: 20, evidence: -5, governance: 8 },
          points: 14,
          style: "rapid",
        },
        {
          id: "P2-B",
          action: "Quarantine its fingerprint. Preserve a snapshot and query index lineage.",
          consequence:
            "The content stops resolving. The team can see where it entered and propagated.",
          signals: ["Content quarantined", "Lineage mapped"],
          effects: { service: 4, containment: 18, evidence: 22, governance: 13 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "P2-C",
          action: "Freeze index updates. Manually review the most retrieved chunks.",
          consequence:
            "Review finds two suspicious variants. Stale content continues serving elsewhere.",
          signals: ["Variants found", "Stale context remains"],
          effects: { service: -2, containment: 8, evidence: 23, governance: 9 },
          points: 16,
          style: "evidence",
        },
      ],
    },
    {
      id: "tool-identity",
      label: "Decision 03 · Authorise",
      title: "The tool token is overpowered.",
      context:
        "The connector uses one long-lived token. It has more admin scope than support work requires.",
      question: "How do you control tool access?",
      takeaway: "Agents need identities and permissions matched to each action.",
      options: [
        {
          id: "P3-A",
          action: "Replace it with scoped, short-lived access tied to an owner and action.",
          consequence:
            "Every tool call becomes attributable. Some automated flows now need explicit approval.",
          signals: ["Access scoped", "Ownership clear"],
          effects: { service: -3, containment: 18, evidence: 11, governance: 24 },
          points: 20,
          style: "controlled",
        },
        {
          id: "P3-B",
          action: "Rotate the shared token. Update dependent agents through the runbook.",
          consequence:
            "The old token dies quickly. Shared scope remains after a careful but slow rotation.",
          signals: ["Token rotated", "Shared scope remains"],
          effects: { service: -5, containment: 14, evidence: 5, governance: 14 },
          points: 18,
          style: "rapid",
        },
        {
          id: "P3-C",
          action: "Allowlist tools at the gateway. Keep the token while tracing every call.",
          consequence:
            "Unsafe tools are blocked and behaviour becomes visible. The long-lived credential persists.",
          signals: ["Tools restricted", "Credential persists"],
          effects: { service: 5, containment: 15, evidence: 18, governance: 11 },
          points: 18,
          style: "evidence",
        },
      ],
    },
    {
      id: "context-propagation",
      label: "Decision 04 · Eradicate",
      title: "The instruction has travelled.",
      context: (state) =>
        state.containment >= 55
          ? "The source is contained, but its instruction remains in two cached summaries and a test agent's memory."
          : "The source and its instruction remain active across caches and a test agent's memory.",
      question: "How do you remove persistence?",
      takeaway: "Poisoned context can persist beyond its original source.",
      options: [
        {
          id: "P4-A",
          action: "Clear all agent memory. Rebuild from known-clean sources.",
          consequence:
            "Persistent instructions disappear. Useful working context also resets across every agent.",
          signals: ["Memory cleared", "Useful context lost"],
          effects: { service: -8, containment: 22, evidence: 3, governance: 14 },
          points: 16,
          style: "controlled",
        },
        {
          id: "P4-B",
          action: "Block the content fingerprint. Invalidate affected caches and test adjacent paths.",
          consequence:
            "Known copies disappear. Adjacent retrieval tests stay clean without a full reset.",
          signals: ["Copies removed", "Adjacent paths tested"],
          effects: { service: 8, containment: 20, evidence: 16, governance: 14 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "P4-C",
          action: "Hold caches read-only. Map every retrieval before cleanup.",
          consequence:
            "The full propagation path becomes clear. Unsafe recommendations remain visible to investigators only.",
          signals: ["Propagation mapped", "Cleanup delayed"],
          effects: { service: -3, containment: 10, evidence: 24, governance: 8 },
          points: 18,
          style: "evidence",
        },
      ],
    },
    {
      id: "secure-reactivation",
      label: "Decision 05 · Validate",
      title: "A clean build is ready.",
      context:
        "Support needs the agent back. Clean outputs alone do not prove the complete action chain is safe.",
      question: "What earns reactivation?",
      takeaway: "Test the action chain, not only the model response.",
      options: [
        {
          id: "P5-A",
          action: "Enable read-only service after clean evaluation. Add tools in a later release.",
          consequence:
            "Useful answers return quickly. Tool-assisted resolution remains unavailable.",
          signals: ["Answers restored", "Tools deferred"],
          effects: { service: 15, containment: 12, evidence: 8, governance: 12 },
          points: 18,
          style: "rapid",
        },
        {
          id: "P5-B",
          action: "Stay offline until every source owner attests their documents.",
          consequence:
            "Source accountability improves. The broad attestation process delays useful service.",
          signals: ["Sources attested", "Service delayed"],
          effects: { service: -6, containment: 10, evidence: 18, governance: 19 },
          points: 16,
          style: "evidence",
        },
        {
          id: "P5-C",
          action: "Red-team retrieval and tools. Enforce provenance, scoped access, and approval for high-impact actions.",
          consequence:
            "The full chain survives adversarial tests. High-impact actions remain human-approved.",
          signals: ["Action chain tested", "High impact governed"],
          effects: { service: 14, containment: 16, evidence: 15, governance: 20 },
          points: 20,
          style: "adaptive",
        },
      ],
    },
  ],
};

const handoffIncident: IncidentDefinition = {
  id: "customer-handoff-failure",
  number: "04",
  eyebrow: "Connected experience",
  title: "Broken hand-off",
  theme: "Collaboration and trust",
  teaser: "Customers and context are reaching the wrong people.",
  premise:
    "A virtual service agent is transferring complex cases without reliable context. Customers repeat themselves, queues grow, and one summary contains the wrong account detail.",
  learning:
    "Restore a fast hand-off without losing context, identity, or human accountability.",
  debrief:
    "Trusted hand-offs preserve source context, minimise sensitive data, and give people a clear way to verify and override AI-generated summaries.",
  initialState: { service: 35, containment: 30, evidence: 35, governance: 42 },
  stages: [
    {
      id: "misrouted-cases",
      label: "Decision 01 · Stabilise",
      title: "High-impact cases hit the wrong queue.",
      context:
        "Original transcripts exist, but summaries are incomplete. Customers are waiting and repeating details.",
      question: "What do you change first?",
      takeaway: "Protect high-impact journeys without abandoning useful automation.",
      options: [
        {
          id: "H1-A",
          action: "Pause the virtual agent. Route every case to people.",
          consequence:
            "Bad transfers stop. General queues surge, including simple requests automation handled well.",
          signals: ["Transfers stopped", "Queues surging"],
          effects: { service: -10, containment: 22, evidence: 5, governance: 10 },
          points: 16,
          style: "controlled",
        },
        {
          id: "H1-B",
          action: "Send high-impact cases to specialists with transcripts. Keep simple cases automated.",
          consequence:
            "Complex cases reach accountable people. Useful self-service remains available.",
          signals: ["Cases prioritised", "Self-service retained"],
          effects: { service: 12, containment: 18, evidence: 10, governance: 16 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "H1-C",
          action: "Keep routing. Require people to verify every summary before acting.",
          consequence:
            "Incorrect actions are avoided. Cases still land in the wrong queues and handling slows.",
          signals: ["Actions checked", "Routing still wrong"],
          effects: { service: -5, containment: 7, evidence: 18, governance: 13 },
          points: 18,
          style: "evidence",
        },
      ],
    },
    {
      id: "handoff-trace",
      label: "Decision 02 · Diagnose",
      title: "The failure could be anywhere.",
      context: (state) =>
        state.evidence >= 50
          ? "Early samples implicate summary generation and routing-field mapping."
          : "Transcription, summary generation, and routing-field mapping are all still suspects.",
      question: "How do you find the break?",
      takeaway: "Trace the whole hand-off, not just the summary.",
      options: [
        {
          id: "H2-A",
          action: "Roll back the last model release. Watch transfer errors.",
          consequence:
            "Summary quality improves slightly. Misrouting continues because the field mapping is unchanged.",
          signals: ["Summaries improved", "Misrouting remains"],
          effects: { service: 8, containment: 5, evidence: 10, governance: 5 },
          points: 15,
          style: "rapid",
        },
        {
          id: "H2-B",
          action: "Compare transcript, summary, and route for a failing sample.",
          consequence:
            "The sample isolates two faults: missing context and a stale routing map.",
          signals: ["Faults isolated", "Evidence linked"],
          effects: { service: 3, containment: 12, evidence: 24, governance: 12 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "H2-C",
          action: "Ask frontline staff to tag bad hand-offs for 30 minutes.",
          consequence:
            "Real examples reveal a clear pattern. Customers keep carrying the impact during collection.",
          signals: ["Pattern visible", "Impact continuing"],
          effects: { service: -4, containment: 5, evidence: 22, governance: 9 },
          points: 16,
          style: "evidence",
        },
      ],
    },
    {
      id: "identity-mismatch",
      label: "Decision 03 · Protect",
      title: "One detail reached the wrong queue.",
      context:
        "An incorrect account number appeared in a summary. No action was taken, but the wrong queue could see it.",
      question: "How do you protect identity and context?",
      takeaway: "Context must be accurate, minimised, and visible only where needed.",
      options: [
        {
          id: "H3-A",
          action: "Remove account details from summaries. Require lookup in the system of record.",
          consequence:
            "Sensitive errors disappear from summaries. Each transfer now needs an extra verified lookup.",
          signals: ["Data minimised", "Lookup added"],
          effects: { service: -3, containment: 17, evidence: 8, governance: 22 },
          points: 19,
          style: "controlled",
        },
        {
          id: "H3-B",
          action: "Re-run identity lookup from the system of record. Requeue affected contacts.",
          consequence:
            "Known contacts are corrected. Summary visibility remains broader than each queue needs.",
          signals: ["Contacts corrected", "Visibility still broad"],
          effects: { service: 5, containment: 10, evidence: 9, governance: 12 },
          points: 18,
          style: "rapid",
        },
        {
          id: "H3-C",
          action: "Scope summary visibility by queue. Link source fields and alert on identity mismatch.",
          consequence:
            "People see only relevant context and can verify its source. Mismatches stop the hand-off.",
          signals: ["Visibility scoped", "Mismatch blocked"],
          effects: { service: 6, containment: 18, evidence: 15, governance: 20 },
          points: 20,
          style: "adaptive",
        },
      ],
    },
    {
      id: "restore-confidence",
      label: "Decision 04 · Restore",
      title: "Routing is fixed. Trust is not.",
      context: (state) =>
        state.governance >= 60
          ? "Context is now scoped and traceable. People still distrust summaries, and customers repeat details."
          : "Routing works, but summary controls remain weak. People distrust the context they receive.",
      question: "How do you restore the hand-off?",
      takeaway: "Trust returns when people can verify AI-generated context.",
      options: [
        {
          id: "H4-A",
          action: "Show summary and transcript. Ask people to confirm critical details.",
          consequence:
            "Customers repeat less. People can verify high-impact details before acting.",
          signals: ["Context retained", "Details verified"],
          effects: { service: 17, containment: 12, evidence: 13, governance: 17 },
          points: 20,
          style: "adaptive",
        },
        {
          id: "H4-B",
          action: "Use transcripts only until summary confidence recovers.",
          consequence:
            "Source context stays complete. Reading time increases, and queues clear slowly.",
          signals: ["Source retained", "Handling slower"],
          effects: { service: 4, containment: 13, evidence: 17, governance: 12 },
          points: 18,
          style: "evidence",
        },
        {
          id: "H4-C",
          action: "Resume summaries for simple cases. Coach people to correct errors.",
          consequence:
            "Simple handling speeds up. Corrections remain dependent on individual attention.",
          signals: ["Speed restored", "Control inconsistent"],
          effects: { service: 18, containment: 3, evidence: 5, governance: 4 },
          points: 15,
          style: "rapid",
        },
      ],
    },
    {
      id: "handoff-gate",
      label: "Decision 05 · Govern",
      title: "The queue is recovering.",
      context:
        "The service can scale again. A fast queue is not enough if customers or receiving staff still carry hidden friction.",
      question: "What proves the hand-off is ready?",
      takeaway: "Measure whether the customer and receiving human both succeed.",
      options: [
        {
          id: "H5-A",
          action: "Require queue and transfer-time targets. Review summary quality weekly.",
          consequence:
            "Operational targets recover quickly. Quality issues can persist until the next review.",
          signals: ["Queues recovered", "Quality lagging"],
          effects: { service: 19, containment: 5, evidence: 6, governance: 8 },
          points: 18,
          style: "rapid",
        },
        {
          id: "H5-B",
          action: "Require human approval for every AI hand-off.",
          consequence:
            "Accountability is explicit. Approval becomes a bottleneck even for low-risk transfers.",
          signals: ["Approval explicit", "Bottleneck added"],
          effects: { service: -4, containment: 15, evidence: 8, governance: 18 },
          points: 16,
          style: "controlled",
        },
        {
          id: "H5-C",
          action: "Stage by case risk. Track repeat rate, identity errors, quality samples, and instant fallback.",
          consequence:
            "Scale returns by risk. Customer and human outcomes decide whether automation expands.",
          signals: ["Scale staged", "Outcomes measured"],
          effects: { service: 16, containment: 15, evidence: 14, governance: 20 },
          points: 20,
          style: "adaptive",
        },
      ],
    },
  ],
};

export const incidents: IncidentDefinition[] = [
  runawayAgentIncident,
  edgeAiIncident,
  poisonedContextIncident,
  handoffIncident,
];

export const incidentSummaries = incidents.map(({ id, number, title, theme, teaser }) => ({
  id,
  number,
  title,
  theme,
  teaser,
}));

export const responseProfiles: Record<ResponseStyle, {
  title: string;
  strength: string;
  tradeoff: string;
}> = {
  adaptive: {
    title: "Adaptive responder",
    strength: "You balanced recovery, evidence, containment, and control as conditions changed.",
    tradeoff: "This approach needs strong observability and clear ownership to stay manageable.",
  },
  rapid: {
    title: "Rapid restorer",
    strength: "You prioritised momentum and returned useful service quickly.",
    tradeoff: "Speed can leave uncertainty or move the incident elsewhere.",
  },
  evidence: {
    title: "Evidence-first investigator",
    strength: "You preserved information and avoided treating a symptom as the cause.",
    tradeoff: "Investigation time can extend customer and operational impact.",
  },
  controlled: {
    title: "Controlled stabiliser",
    strength: "You narrowed the blast radius and kept consequential actions attributable.",
    tradeoff: "Approvals and manual steps can slow recovery and increase workload.",
  },
};
