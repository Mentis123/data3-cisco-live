-- Generated SQL INSERT statements for trivia_items
-- Run this in your Neon SQL Editor

BEGIN;

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-001',
  'SECURE_CONNECTIVITY',
  'Best first step to kick off a Zero Trust rollout for a hybrid workforce?',
  '{"Mandate MFA across all apps","Segment VLANs by site","Replace SD-WAN hardware"}',
  0,
  2,
  'Start with identity verification everywhere.',
  1,
  '{"zero trust","mfa","identity"}',
  'Identity-first controls (MFA) reduce credential abuse and work across remote/on-prem.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-002',
  'SECURE_CONNECTIVITY',
  'Early KPI to prove SASE value:',
  '{"% of traffic inspected via cloud security","Number of tunnels up","Count of branch routers"}',
  0,
  1,
  'Measure inspection, not hardware counts.',
  1,
  '{"sase","inspection","kpi"}',
  'Inspection coverage shows policy efficacy; device counts don''t reflect security posture.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-003',
  'SECURE_CONNECTIVITY',
  'Most robust remote access policy object for least privilege:',
  '{"User/Group/Device identity","Static IP ranges","Open port list"}',
  0,
  2,
  'Think identity, not addresses.',
  1,
  '{"policy","zero trust","identity"}',
  'Identity-aware policies bind to people/devices; IP/ports are brittle.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-004',
  'SECURE_CONNECTIVITY',
  'Quick win to reduce lateral movement risk:',
  '{"Micro-segment crown-jewel apps","Increase perimeter firewall rules","Rely on NAC posture only"}',
  0,
  2,
  'Protect the highest impact targets first.',
  2,
  '{"microsegmentation","lateral movement"}',
  'Start where compromise hurts most; perimeter rules alone don''t stop east-west.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-005',
  'SECURE_CONNECTIVITY',
  'Good metric for VPN modernization impact:',
  '{"% users on clientless/ZTNA vs legacy VPN","Total VPN logins per day","Help-desk tickets created"}',
  0,
  1,
  'Track adoption of the safer path.',
  2,
  '{"ztna","vpn","adoption"}',
  'Measuring safe-path adoption shows risk reduction and experience gains.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-006',
  'SECURE_CONNECTIVITY',
  'Foundational DNS security control to deploy first:',
  '{"Protective DNS with policy blocks","Split-horizon DNS only","Legacy DNS over UDP only"}',
  0,
  2,
  'Block known bad before it resolves.',
  1,
  '{"dns","security","protective dns"}',
  'Protective DNS blocks C2/malware domains early in the kill chain.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-007',
  'SECURE_CONNECTIVITY',
  'Zero Trust principle most often skipped in pilot:',
  '{"Continuous verification","Strong authentication","Encryption in transit"}',
  0,
  2,
  'Don’t just check once at login.',
  2,
  '{"zero trust","verification"}',
  'Policies must re-evaluate context (device posture, location, behavior).'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-008',
  'SECURE_CONNECTIVITY',
  'Signal that MFA rollout is effective:',
  '{"% high-risk sign-ins challenged","Number of MFA vendors","Average password length"}',
  0,
  1,
  'Quality of coverage over tooling quantity.',
  1,
  '{"mfa","risk","coverage"}',
  'Target risky sessions; breadth of enforcement matters more than vendor count.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-009',
  'SECURE_CONNECTIVITY',
  'Policy evaluation location in SASE most aligned with Zero Trust:',
  '{"Cloud edge close to user","On-prem perimeter only","Data center core"}',
  0,
  2,
  'Meet users at the edge.',
  2,
  '{"sase","edge","policy"}',
  'Edge enforcement reduces latency and follows users/apps globally.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-010',
  'SECURE_CONNECTIVITY',
  'Best early control to reduce phishing risk:',
  '{"FIDO2/WebAuthn for priority users","Longer passwords for everyone","More frequent password changes"}',
  0,
  2,
  'Phish-resistant beats password tweaks.',
  2,
  '{"phishing","fido2","mfa"}',
  'Phish-resistant auth eliminates OTP/credential replay vectors.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-011',
  'SECURE_CONNECTIVITY',
  'Best control to reduce session hijack in BYOD:',
  '{"Device posture checks + conditional access","Static IP allowlists","VPN split tunneling off"}',
  0,
  1,
  'Check device health & gate access.',
  2,
  '{"byod","posture","conditional access"}',
  'Continuous posture + conditional policies block risky devices.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-012',
  'SECURE_CONNECTIVITY',
  'Good metric for least-privilege policy maturity:',
  '{"% policies scoped to groups/attributes","Firewall rules count","Mean rule length"}',
  0,
  1,
  'Scope, not volume.',
  2,
  '{"least privilege","abac"}',
  'Attribute-based scoping signals precise access.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-013',
  'SECURE_CONNECTIVITY',
  'Which improves SaaS control fastest:',
  '{"CASB with inline controls","Local PAC files","Manual SaaS audits"}',
  0,
  2,
  'Inline beats periodic checks.',
  2,
  '{"saas","casb"}',
  'CASB/SSE provides continuous control & visibility.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-014',
  'SECURE_CONNECTIVITY',
  'Safer email auth config baseline:',
  '{"DMARC enforced (p=reject)","SPF softfail only","No DKIM"}',
  0,
  2,
  'Stop spoof at the gate.',
  1,
  '{"email","dmarc"}',
  'DMARC reject blocks spoofed domains effectively.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-015',
  'SECURE_CONNECTIVITY',
  'Effective lateral movement detector:',
  '{"East-west traffic baselines & anomalies","North-south egress only","DNS NXDOMAIN count"}',
  0,
  1,
  'Watch the inside paths.',
  3,
  '{"east-west","anomaly"}',
  'Behavioral baselines inside the network catch pivots.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-016',
  'SECURE_CONNECTIVITY',
  'Best response to discovered credential stuffing:',
  '{"Enforce step-up MFA + block IP ranges","Rotate all TLS certs","Increase MTU"}',
  0,
  2,
  'Raise auth bar + block campaigns.',
  1,
  '{"credential","mfa"}',
  'Step-up MFA + IP/risk blocks reduce success rate immediately.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-017',
  'SECURE_CONNECTIVITY',
  'SSE feature most linked to user experience:',
  '{"Local egress with nearest POP","More signatures","Bigger blocklists"}',
  0,
  2,
  'Latency matters.',
  2,
  '{"sse","pop","latency"}',
  'Nearest POP reduces round-trip overhead.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-018',
  'SECURE_CONNECTIVITY',
  'Primary risk when lifting firewall rules verbatim into cloud:',
  '{"Overly permissive flat networks","Higher egress fees","More subnets"}',
  0,
  2,
  'Cloud ≠ datacenter.',
  2,
  '{"cloud","security","network"}',
  'Flat allowlists expose services without perimeter assumptions.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-019',
  'SECURE_CONNECTIVITY',
  'Network segmentation that scales with identity:',
  '{"SDP/identity-based segmentation","VLAN-only segmentation","ACL per IP"}',
  0,
  2,
  'Bind to entities, not addresses.',
  2,
  '{"sdp","segmentation"}',
  'Identity-based allows dynamic & remote contexts.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-020',
  'SECURE_CONNECTIVITY',
  'Best quick win to reduce shadow IT risk:',
  '{"Block unsanctioned apps via category policy","Increase firewall log retention","Quarterly staff survey"}',
  0,
  1,
  'Control usage, not logs.',
  1,
  '{"shadow it","policy"}',
  'Category policies curb risky unsanctioned usage.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-021',
  'SECURE_CONNECTIVITY',
  'SSO misconfig most harmful:',
  '{"No conditional access on external users","Custom favicon missing","SSO login text not branded"}',
  0,
  2,
  'External trust boundary is weakest.',
  2,
  '{"sso","external"}',
  'External users need tailored risk checks & scopes.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-022',
  'SECURE_CONNECTIVITY',
  'PKI practice to avoid outages:',
  '{"Automated renewal & alerting","Manual CSR rotation","Wildcard everywhere"}',
  0,
  2,
  'Automation prevents surprise expiries.',
  1,
  '{"pki","certs"}',
  'Auto-renew and alerts avoid cert-expiry incidents.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-023',
  'SECURE_CONNECTIVITY',
  'Zero Trust data protection priority:',
  '{"Encrypt data at rest and in transit","Single large perimeter","IP allowlists only"}',
  0,
  2,
  'Assume breach.',
  1,
  '{"data","encryption"}',
  'Defense-in-depth protects assets even if perimeter fails.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-024',
  'SECURE_CONNECTIVITY',
  'SSO + SCIM value KPI:',
  '{"% accounts lifecycle-managed","# of IdPs","Login page views"}',
  0,
  1,
  'Provisioning quality matters.',
  2,
  '{"scim","sso","iam"}',
  'Lifecycle management reduces orphaned and overprivileged accounts.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'SEC-025',
  'SECURE_CONNECTIVITY',
  'Most effective phishing training pattern:',
  '{"Simulations with just-in-time coaching","Annual long courses","Phishing posters"}',
  0,
  1,
  'Reps beat lectures.',
  1,
  '{"awareness","phishing"}',
  'Realistic drills + immediate feedback change behavior.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-001',
  'HYBRID_DC',
  'Metric that best captures steady-state cloud cost efficiency:',
  '{"$/workload per month","Total egress GB","Number of regions used"}',
  0,
  2,
  'Focus on unit economics.',
  1,
  '{"cost","cloud","unit economics"}',
  'Unit cost normalizes scale and compares alternatives.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-002',
  'HYBRID_DC',
  'First architecture step to reduce outage blast radius:',
  '{"Define service boundaries & failure domains","Increase CPU reservations","Poll more SNMP OIDs"}',
  0,
  2,
  'Architecture before tuning.',
  1,
  '{"resilience","fault domains"}',
  'Isolation limits cascade failures.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-003',
  'HYBRID_DC',
  'Readiness signal for migration at scale:',
  '{"% infrastructure as code coverage","Number of AMIs/images","Tickets closed last month"}',
  0,
  2,
  'Repeatability enables velocity.',
  1,
  '{"iac","migration","readiness"}',
  'IaC enables consistent, safe automation.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-004',
  'HYBRID_DC',
  'Good KPI for platform team maturity:',
  '{"Self-service golden path adoption %","# of YAML files","Jira story points completed"}',
  0,
  2,
  'Measure developer uptake.',
  2,
  '{"platform","golden path","kpi"}',
  'Adoption shows platform usefulness.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-005',
  'HYBRID_DC',
  'When to consider repatriation of a workload:',
  '{"Predictable steady load with high cloud unit cost","Any workload with legacy OS","All workloads in >2 regions"}',
  0,
  1,
  'Economics + predictability matter.',
  2,
  '{"repatriation","cost"}',
  'Steady loads may be cheaper on owned capacity.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-006',
  'HYBRID_DC',
  'Best way to curb cloud drift:',
  '{"Guardrails + policy as code","Manual monthly audits","Bigger tagging spreadsheets"}',
  0,
  2,
  'Automate enforcement.',
  1,
  '{"governance","policy as code"}',
  'Guardrails prevent misconfig proactively.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-007',
  'HYBRID_DC',
  'Golden signal to watch during migration cutover:',
  '{"p95 latency on critical endpoints","CPU idle % on old hosts","Disk free % on bastion"}',
  0,
  2,
  'User-perceived performance first.',
  1,
  '{"observability","cutover","latency"}',
  'Latency reflects customer impact.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-008',
  'HYBRID_DC',
  'Backbone for hybrid connectivity resilience:',
  '{"Dual provider circuits or SD-WAN paths","One big MPLS","Single VPN tunnel"}',
  0,
  2,
  'Eliminate single points.',
  1,
  '{"network","resilience","sd-wan"}',
  'Provider diversity reduces correlated failures.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-009',
  'HYBRID_DC',
  'Metric to prove platform reliability to app teams:',
  '{"SLO attainment % per month","MTTR minutes only","Incident count only"}',
  0,
  2,
  'Outcomes over raw counts.',
  2,
  '{"slo","reliability"}',
  'SLO attainment connects to UX.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-010',
  'HYBRID_DC',
  'Authoritative config source:',
  '{"Git repo with PR workflows","Individual consoles","Shared drive docs"}',
  0,
  2,
  'One source of truth.',
  1,
  '{"gitops","governance"}',
  'Versioned, reviewed changes lower risk.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-011',
  'HYBRID_DC',
  'Which migration order reduces risk:',
  '{"Low-risk ancillary services first","Core database first","All at once"}',
  0,
  2,
  'Stabilize supporting pieces.',
  2,
  '{"migration","risk"}',
  'Move support services to build patterns safely.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-012',
  'HYBRID_DC',
  'KPI for build pipeline health:',
  '{"Lead time for changes","Total pipeline YAML lines","# of runners"}',
  0,
  1,
  'Flow, not size.',
  1,
  '{"dora","pipeline"}',
  'Lead time maps to throughput and friction.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-013',
  'HYBRID_DC',
  'Cost control during experiments:',
  '{"Use ephemeral environments","Long-lived shared test env","Test in prod without flags"}',
  0,
  2,
  'Spin up/down as needed.',
  1,
  '{"cost","ephemeral"}',
  'Ephemeral envs avoid idle spend.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-014',
  'HYBRID_DC',
  'Reliability guard for third-party dependency:',
  '{"Timeouts + circuit breakers","Longer retries only","Ignore failures"}',
  0,
  2,
  'Fail fast, degrade gracefully.',
  2,
  '{"resilience","circuit breaker"}',
  'Breakers stop cascading failures.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-015',
  'HYBRID_DC',
  'Signal multi-cloud is justified:',
  '{"Regulatory/data residency constraints","We like optionality","Vendor logo diversity"}',
  0,
  2,
  'Concrete constraints.',
  2,
  '{"multicloud","compliance"}',
  'Residency/sovereignty often force it.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-016',
  'HYBRID_DC',
  'Good storage tiering practice:',
  '{"Hot/warm/cold by access patterns","One big hot tier","Cold-only archive"}',
  0,
  1,
  'Match cost to usage.',
  1,
  '{"storage","tiering"}',
  'Tiering optimizes cost-performance.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-017',
  'HYBRID_DC',
  'Metric for autoscaling quality:',
  '{"SLA/SLO hit rate during spikes","Max node count","Pod churn"}',
  0,
  2,
  'Outcome-based.',
  2,
  '{"autoscale","slo"}',
  'Hitting SLOs shows scaling worked.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-018',
  'HYBRID_DC',
  'Kubernetes upgrade risk reducer:',
  '{"Blue/green control plane tests","Manual drain only","Ignore deprecations"}',
  0,
  2,
  'Test the control plane safely.',
  2,
  '{"k8s","upgrade"}',
  'Blue/green makes rollback easy.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-019',
  'HYBRID_DC',
  'CI cache strategy win:',
  '{"Scoped, immutable cache keys","Global mutable cache","No cache"}',
  0,
  2,
  'Determinism matters.',
  2,
  '{"ci","cache"}',
  'Immutable keys prevent poisoning & flakiness.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-020',
  'HYBRID_DC',
  'Best budget predictor for cloud:',
  '{"Reserved/committed usage planning","Hope for savings plans later","On-demand only"}',
  0,
  2,
  'Plan ahead.',
  1,
  '{"finops","forecast"}',
  'Commitment planning reduces variance and cost.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-021',
  'HYBRID_DC',
  'IaC drift detection approach:',
  '{"Continuous diff against live state","Quarterly manual checks","Comment-only PRs"}',
  0,
  2,
  'Automate detection.',
  2,
  '{"iac","drift"}',
  'Continuous diffing catches drift early.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-022',
  'HYBRID_DC',
  'Image supply chain hardening:',
  '{"Signed images + provenance","Bigger registry disks","Single giant base image"}',
  0,
  2,
  'Trust but verify.',
  2,
  '{"supply chain","sigstore"}',
  'Signatures & provenance block tampering.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-023',
  'HYBRID_DC',
  'Golden path success metric:',
  '{"Time-to-first-deploy for new team","# of docs pages","Slack channel count"}',
  0,
  1,
  'Measure developer speed.',
  1,
  '{"platform","golden path"}',
  'TTFD reflects friction reduction.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-024',
  'HYBRID_DC',
  'Backup validation that actually works:',
  '{"Periodic restore drills","Daily checksum emails","Tape rotation only"}',
  0,
  2,
  'Restore > backup.',
  2,
  '{"backup","dr"}',
  'Only restores prove recoverability.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'HDC-025',
  'HYBRID_DC',
  'Network egress surprise prevention:',
  '{"Egress budgets + alerts","Bigger NAT gateways","Turn off logging"}',
  0,
  2,
  'Visibility & guardrails.',
  1,
  '{"egress","finops"}',
  'Budgets/alerts catch unexpected costs.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-001',
  'COLLAB_CX',
  'Fastest lever to improve first-contact resolution (FCR):',
  '{"AI-suggested knowledge articles","New hold music","More ring groups"}',
  0,
  2,
  'Improve answers, not waiting.',
  1,
  '{"fcr","knowledge","ai assist"}',
  'Relevant knowledge boosts correct first responses.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-002',
  'COLLAB_CX',
  'KPI most predictive of agent burnout:',
  '{"After-Call Work (ACW) backlog","Average handle time only","Number of queues"}',
  0,
  2,
  'Backlog drives stress.',
  2,
  '{"acw","burnout","kpi"}',
  'Sustained ACW backlog correlates with fatigue.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-003',
  'COLLAB_CX',
  'Security hardening that protects meeting content most:',
  '{"Enable E2EE where supported","Lower bitrates","Custom backgrounds required"}',
  0,
  2,
  'Protect data, not decor.',
  1,
  '{"e2ee","security","meeting"}',
  'E2EE mitigates interception.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-004',
  'COLLAB_CX',
  'Signal your IVR design needs work:',
  '{"High zero-out rate to agent","Short greetings","Few menu levels"}',
  0,
  2,
  'Users are escaping the tree.',
  1,
  '{"ivr","design","cx"}',
  'Zero-outs indicate confusion.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-005',
  'COLLAB_CX',
  'Contact centre metric that ties to revenue confidence:',
  '{"FCR % trend","Longest call duration","Agent seat count"}',
  0,
  2,
  'Resolution quality wins.',
  1,
  '{"revenue","fcr","confidence"}',
  'Better FCR reduces churn.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-006',
  'COLLAB_CX',
  'Best early pilot for agent assistance AI:',
  '{"Suggest next best action & citations","Auto-mute on noise","Emoji reactions"}',
  0,
  2,
  'Trust requires sources.',
  2,
  '{"ai","assistance","pilot"}',
  'Citations build trust in suggestions.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-007',
  'COLLAB_CX',
  'Good KPI for meeting quality improvement:',
  '{"% calls with MOS ≥ target","Number of emojis used","Max attendees per week"}',
  0,
  2,
  'Measure experience.',
  1,
  '{"mos","quality","kpi"}',
  'MOS captures perceived quality.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-008',
  'COLLAB_CX',
  'Queue design to reduce abandonment:',
  '{"Offer callback & accurate wait time","Play ads in queue","Disable SLA targets"}',
  0,
  1,
  'Offer control & honesty.',
  1,
  '{"queue","abandonment","callback"}',
  'Callbacks and ETAs reduce drops.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-009',
  'COLLAB_CX',
  'Metric to watch when adding AI summarization:',
  '{"Reduction in ACW minutes","Agent sentiment emojis","Transcript character count"}',
  0,
  2,
  'Shorter wrap-up is tangible.',
  1,
  '{"summarization","acw","ai"}',
  'Summaries should shrink ACW.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-010',
  'COLLAB_CX',
  'Sign of knowledge base health:',
  '{"Article deflection rate %","Total articles count","Unique authors count"}',
  0,
  1,
  'Outcomes over volume.',
  2,
  '{"kb","deflection","self-service"}',
  'Deflection shows customers self-serve.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-011',
  'COLLAB_CX',
  'Which improves CSAT fastest:',
  '{"Resolve intent accurately first time","Add branded ringtones","More wrap-up codes"}',
  0,
  2,
  'Outcomes over cosmetics.',
  1,
  '{"csat","intent"}',
  'Correct intent handling lifts satisfaction.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-012',
  'COLLAB_CX',
  'Routing strategy for spikes:',
  '{"Skill-based + overflow rules","Random agent assignment","FIFO only"}',
  0,
  2,
  'Use skills and overflow.',
  2,
  '{"routing","spikes"}',
  'Skill routing plus overflow keeps SLAs.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-013',
  'COLLAB_CX',
  'Privacy feature for transcripts:',
  '{"PII redaction at capture","Only manual redaction","No transcription"}',
  0,
  1,
  'Protect at source.',
  2,
  '{"pii","redaction"}',
  'Redact PII early to minimize exposure.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-014',
  'COLLAB_CX',
  'Which metric indicates bot deflection success:',
  '{"Containment rate %","Bot uptime %","Menu depth"}',
  0,
  2,
  'Measure resolved without human.',
  1,
  '{"bot","deflection"}',
  'Containment shows the bot solved it.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-015',
  'COLLAB_CX',
  'Agent coaching program that sticks:',
  '{"Short, frequent micro-coaching","Annual day-long training","Quarterly PDF guides"}',
  0,
  2,
  'Reps + feedback loops.',
  1,
  '{"coaching","learning"}',
  'Micro-coaching sustains behavior change.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-016',
  'COLLAB_CX',
  'Security baseline for meeting join:',
  '{"Waiting room + host admit","Open links to anyone","No passwords"}',
  0,
  2,
  'Gate entry.',
  1,
  '{"security","meetings"}',
  'Host admit reduces bombing/abuse.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-017',
  'COLLAB_CX',
  'Real-time KPI for live assistance AI:',
  '{"Agent accept/use rate","Model size","Token count"}',
  0,
  1,
  'Adoption is value proxy.',
  2,
  '{"ai","adoption"}',
  'Usage shows usefulness to agents.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-018',
  'COLLAB_CX',
  'Reduce handle time without hurting FCR:',
  '{"Surface next best actions with sources","Shorten greeting scripts","Play faster hold music"}',
  0,
  2,
  'Quality + speed.',
  2,
  '{"handle time","nba"}',
  'Guided actions with evidence cut time safely.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-019',
  'COLLAB_CX',
  'Privacy-first analytics approach:',
  '{"Aggregate/opt-in analytics","Per-agent keystroke logs","Always-on screen capture"}',
  0,
  2,
  'Respect privacy.',
  2,
  '{"privacy","analytics"}',
  'Aggregate metrics reduce intrusiveness.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-020',
  'COLLAB_CX',
  'Good IVR experiment design:',
  '{"A/B test intents with success KPIs","Change many things at once","Only ask agents"}',
  0,
  2,
  'Test with outcomes.',
  2,
  '{"ivr","experiment"}',
  'A/B with KPIs finds causal improvements.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-021',
  'COLLAB_CX',
  'Best indicator of knowledge freshness:',
  '{"Median article age on top intents","Total authors","Image count"}',
  0,
  1,
  'Fresh answers matter.',
  2,
  '{"kb","freshness"}',
  'Measure recency on high-traffic intents.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-022',
  'COLLAB_CX',
  'Modern call recording security:',
  '{"At-rest encryption + KMS","ZIP files on NAS","Shared passwords"}',
  0,
  2,
  'Encrypt with managed keys.',
  1,
  '{"security","recordings"}',
  'KMS-backed encryption is standard.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-023',
  'COLLAB_CX',
  'Chat escalation trigger worth monitoring:',
  '{"Repeat intents within session","Emoji usage","Window size"}',
  0,
  1,
  'Signal of frustration.',
  1,
  '{"chat","escalation"}',
  'Repeats suggest the bot isn''t resolving.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-024',
  'COLLAB_CX',
  'Omnichannel readiness KPI:',
  '{"% intents enabled across channels","Total channels added","Has a roadmap"}',
  0,
  2,
  'Coverage over count.',
  2,
  '{"omnichannel","coverage"}',
  'Enable top intents consistently across channels.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'CCX-025',
  'COLLAB_CX',
  'Best hearing-access feature for webinars:',
  '{"Live captions + transcript","Animated backgrounds","Louder intro music"}',
  0,
  2,
  'Accessibility first.',
  1,
  '{"a11y","captions"}',
  'Captions improve accessibility & search.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-001',
  'OBSERVABILITY',
  'SLO that best reduces alert fatigue for a login API:',
  '{"p95 latency during business hours","Monthly CPU <70%","Any error triggers paging"}',
  0,
  2,
  'Focus on user experience windows.',
  1,
  '{"slo","latency","alerting"}',
  'Latency SLO aligned to user hours balances signal/noise.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-002',
  'OBSERVABILITY',
  'Cheapest way to curb metric cardinality blowup:',
  '{"Drop high-card labels at ingest","Buy bigger TSDB","Add more dashboards"}',
  0,
  2,
  'Reduce series, not just storage.',
  1,
  '{"cardinality","metrics","cost"}',
  'Filtering labels limits explosion upstream.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-003',
  'OBSERVABILITY',
  'Alerting pattern that prevents flapping:',
  '{"Rate-of-change + duration window","Absolute static thresholds only","Any error triggers"}',
  0,
  2,
  'Stability over spikes.',
  1,
  '{"alerts","roc","hysteresis"}',
  'Combine ROC with duration to avoid noise.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-004',
  'OBSERVABILITY',
  'Good KPI for log pipeline health:',
  '{"% logs parsed & structured","Total log GB ingested","# of parsers installed"}',
  0,
  2,
  'Quality over quantity.',
  1,
  '{"logs","parsing","kpi"}',
  'Structured logs enable search & analytics.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-005',
  'OBSERVABILITY',
  'Tracing metric that signals dependency issues:',
  '{"Upstream span error rate","Heap size on one pod","Number of dashboards"}',
  0,
  2,
  'Follow failing edges.',
  2,
  '{"tracing","errors","dependencies"}',
  'Span errors at edges reveal failing services.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-006',
  'OBSERVABILITY',
  'During incident, most actionable first graph:',
  '{"p95 latency by endpoint","CPU by node","Total container count"}',
  0,
  2,
  'User path first.',
  1,
  '{"incident","latency","endpoint"}',
  'Endpoint latency maps to customer pain.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-007',
  'OBSERVABILITY',
  'Best place to compute SLOs for consistency:',
  '{"Central SLO service/pipeline","Individual dashboards","Each microservice independently"}',
  0,
  2,
  'One truth for SLO math.',
  2,
  '{"slo","governance"}',
  'Centralization avoids drift.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-008',
  'OBSERVABILITY',
  'Primary benefit of RED/USE frameworks:',
  '{"Standardization of signals","Prettier charts","Lower cloud bill"}',
  0,
  1,
  'Consistent coverage.',
  1,
  '{"red","use","frameworks"}',
  'Frameworks ensure consistent KPIs.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-009',
  'OBSERVABILITY',
  'Tie alerts to business impact via:',
  '{"Error budget burn rates","CPU % thresholds","Total pods restarted"}',
  0,
  2,
  'Budget links to user pain.',
  2,
  '{"slo","burn","alerting"}',
  'Burn rates indicate risk to SLOs.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-010',
  'OBSERVABILITY',
  'Dashboards should primarily be designed for:',
  '{"Decision making & action","Aesthetic symmetry","One giant wall screen"}',
  0,
  2,
  'Purpose first.',
  1,
  '{"dashboards","design"}',
  'Actionability beats aesthetics.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-011',
  'OBSERVABILITY',
  'Sampling strategy during incidents:',
  '{"Lower sampling to capture detail","Raise sampling to save cost","Fixed sampling always"}',
  0,
  2,
  'Capture more when it matters.',
  2,
  '{"sampling","incident"}',
  'Dynamic sampling increases fidelity during disruption.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-012',
  'OBSERVABILITY',
  'Log retention planning should start from:',
  '{"Regulatory + investigative needs","Storage price only","Default vendor setting"}',
  0,
  2,
  'Purpose then cost.',
  2,
  '{"logs","retention"}',
  'Requirements dictate retention horizon.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-013',
  'OBSERVABILITY',
  'Best KPI for synthetic monitoring value:',
  '{"Catch rate of pre-prod regressions","Ping RTT","Screenshot count"}',
  0,
  1,
  'Outcomes > telemetry volume.',
  2,
  '{"synthetics","value"}',
  'Detecting regressions before prod is the win.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-014',
  'OBSERVABILITY',
  'Most likely cause of noisy ''CPU high'' alerts:',
  '{"Thresholds not tied to SLOs","Bad silicon","Too few dashboards"}',
  0,
  2,
  'Alert on symptoms that matter.',
  1,
  '{"cpu","alerts"}',
  'Tie alerts to user impact or saturations that threaten it.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-015',
  'OBSERVABILITY',
  'Cardinality root cause in labels:',
  '{"High-entropy IDs in tags","One label for env","No labels"}',
  0,
  1,
  'Avoid IDs as labels.',
  2,
  '{"labels","cardinality"}',
  'IDs explode series count.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-016',
  'OBSERVABILITY',
  'Golden signal for batch jobs:',
  '{"Throughput & deadline miss rate","p95 HTTP latency","Open file handles"}',
  0,
  2,
  'Jobs ≠ requests.',
  2,
  '{"batch","signals"}',
  'Throughput and deadlines describe batch health.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-017',
  'OBSERVABILITY',
  'Which trace view finds fan-out issues:',
  '{"Service dependency graph","Single span log","Pod events"}',
  0,
  1,
  'See the web of calls.',
  2,
  '{"tracing","fan-out"}',
  'Dependency graphs show explosive call trees.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-018',
  'OBSERVABILITY',
  'Alert routing best practice:',
  '{"Route by severity & ownership","All alerts to one channel","Random on-call"}',
  0,
  2,
  'Right team, right level.',
  1,
  '{"routing","alerts"}',
  'Good routing reduces noise & speeds response.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-019',
  'OBSERVABILITY',
  'Error budgets mainly protect:',
  '{"Feature velocity & reliability balance","Disk space","Grafana themes"}',
  0,
  2,
  'Trade-offs, not aesthetics.',
  2,
  '{"error budget","velocity"}',
  'Budgets guard release pace vs reliability.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-020',
  'OBSERVABILITY',
  'SLO math should use:',
  '{"Rolling windows and burn rates","Static weekly counts","Raw error totals only"}',
  0,
  2,
  'Time & rate aware.',
  2,
  '{"slo","math"}',
  'Rolling windows capture recency; burn shows risk.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-021',
  'OBSERVABILITY',
  'Span sampling that preserves outliers:',
  '{"Tail-based sampling","Head-based only","Random fixed"}',
  0,
  2,
  'Keep interesting traces.',
  2,
  '{"tracing","sampling"}',
  'Tail-based keeps slow/error traces.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-022',
  'OBSERVABILITY',
  'Best time bucket for user-facing SLOs:',
  '{"Business-hour slices by region","24/7 single bucket","Monthly total only"}',
  0,
  2,
  'Match user patterns.',
  2,
  '{"slo","time windows"}',
  'Regional business hours reflect real usage.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-023',
  'OBSERVABILITY',
  'Runbook quality metric:',
  '{"Mean time-to-first-action","Pages count","Font size"}',
  0,
  1,
  'Speed to action.',
  2,
  '{"runbook","mtfa"}',
  'Good runbooks shorten MTFA.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-024',
  'OBSERVABILITY',
  'Visualization that shows saturation risk:',
  '{"Utilization vs capacity trend","Rainbows","Grid of favicons"}',
  0,
  2,
  'Show runway.',
  1,
  '{"capacity","viz"}',
  'Trends vs capacity reveal looming limits.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'OBS-025',
  'OBSERVABILITY',
  'Key check before deleting metrics:',
  '{"Confirm panels/alerts dependency","File size on disk","Username of creator"}',
  0,
  2,
  'Don''t break consumers.',
  1,
  '{"metrics","cleanup"}',
  'Check references before removal.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-001',
  'EDGE_IOT',
  'Safest pattern for OTA firmware rollout:',
  '{"Canary 1% → staged waves","Deploy to all devices Friday night","Manual USB updates"}',
  0,
  1,
  'Sample before sweep.',
  1,
  '{"ota","firmware","risk"}',
  'Staged canaries limit blast radius and enable rollback.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-002',
  'EDGE_IOT',
  'Edge inference KPI that ties to ROI:',
  '{"On-device inference latency","Cloud GPU hours","Device count online"}',
  0,
  2,
  'Local reaction time matters.',
  1,
  '{"edge ai","latency","roi"}',
  'Latency reduction enables real-time decisions at the edge.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-003',
  'EDGE_IOT',
  'Most resilient connectivity approach for mobile assets:',
  '{"Dual-SIM multi-carrier","Single carrier LTE","Public Wi-Fi only"}',
  0,
  2,
  'Avoid single points of failure.',
  1,
  '{"connectivity","redundancy","lte"}',
  'Carrier diversity keeps devices connected.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-004',
  'EDGE_IOT',
  'Best control to protect device identities at scale:',
  '{"Mutual TLS with per-device certs","Shared API keys per fleet","Plain HTTP with MAC allowlist"}',
  0,
  2,
  'Strong identity per device.',
  2,
  '{"mtls","identity","iot security"}',
  'mTLS + unique certs prevent impersonation.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-005',
  'EDGE_IOT',
  'Telemetry sampling that preserves anomalies:',
  '{"Adaptive sampling with anomaly bias","Uniform 1% sampling","No sampling"}',
  0,
  2,
  'Keep the weird stuff.',
  2,
  '{"telemetry","sampling","anomaly"}',
  'Adaptive sampling preserves outliers.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-006',
  'EDGE_IOT',
  'Local processing wins when:',
  '{"Bandwidth is scarce & latency sensitive","Power is unlimited & cheap","All events must be stored raw"}',
  0,
  2,
  'Think constraints.',
  1,
  '{"edge","processing","bandwidth"}',
  'Edge processing reduces backhaul and delay.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-007',
  'EDGE_IOT',
  'Best practice for device credential rotation:',
  '{"Automated periodic rotation per device","Rotate only after incident","Never rotate"}',
  0,
  2,
  'Assume compromise over time.',
  2,
  '{"credentials","rotation","iot"}',
  'Regular rotation limits blast radius.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-008',
  'EDGE_IOT',
  'KPI that indicates rollout progress:',
  '{"% devices on latest firmware","Total firmware images stored","Git commits to firmware repo"}',
  0,
  1,
  'Measure coverage.',
  1,
  '{"firmware","rollout","coverage"}',
  'Coverage % aligns to security & supportability.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-009',
  'EDGE_IOT',
  'When to push configuration from cloud:',
  '{"Frequent policy changes across fleet","Config never changes","Single device in lab"}',
  0,
  2,
  'Centralize high-churn.',
  1,
  '{"config","fleet","management"}',
  'Cloud planes scale frequent updates.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-010',
  'EDGE_IOT',
  'Safest storage for secrets on constrained devices:',
  '{"Secure element/TPM","Plaintext in flash","Obfuscated in code"}',
  0,
  2,
  'Hardware beats obscurity.',
  2,
  '{"secrets","hardware","security"}',
  'Hardware modules protect keys.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-011',
  'EDGE_IOT',
  'Best network fallback ordering:',
  '{"Ethernet→Wi‑Fi→Cellular","Cellular→Wi‑Fi→Ethernet","Wi‑Fi only"}',
  0,
  2,
  'Prefer stable/cheap first.',
  1,
  '{"connectivity","fallback"}',
  'Use wired when possible, then Wi‑Fi, then cellular.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-012',
  'EDGE_IOT',
  'OTA safety lever for power loss:',
  '{"A/B partitions with rollback","Single partition writes","Randomized writes"}',
  0,
  2,
  'Have a known-good bank.',
  2,
  '{"ota","rollback"}',
  'A/B allows safe fallback if update fails.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-013',
  'EDGE_IOT',
  'Which format reduces bandwidth for telemetry:',
  '{"Binary protobuf/CBOR","Verbose JSON","CSV strings"}',
  0,
  2,
  'Compact encodings.',
  1,
  '{"proto","cbor","bandwidth"}',
  'Protobuf/CBOR cut bytes & CPU.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-014',
  'EDGE_IOT',
  'Edge container security baseline:',
  '{"Read-only FS & least-privilege","Run as root always","No resource limits"}',
  0,
  2,
  'Harden the runtime.',
  2,
  '{"containers","edge","security"}',
  'Locked-down containers reduce exploit surface.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-015',
  'EDGE_IOT',
  'Fleet ops KPI to watch:',
  '{"Mean time-to-remote-recovery","Total pings today","Average RSSI"}',
  0,
  2,
  'Outcome-based ops.',
  2,
  '{"ops","recovery"}',
  'MTTR (remote) reflects operability.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-016',
  'EDGE_IOT',
  'Event pattern to buffer locally:',
  '{"High-frequency sensor bursts","Once-a-day config","Static certificates"}',
  0,
  2,
  'Buffer the chatty stuff.',
  1,
  '{"buffer","sensors"}',
  'Batch bursts to save bandwidth.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-017',
  'EDGE_IOT',
  'Clock sync at edge:',
  '{"NTP/PTP per site with monitoring","Manual time setting","Trust device uptime"}',
  0,
  2,
  'Time is truth.',
  2,
  '{"time","ntp","ptp"}',
  'Accurate time underpins logs & certs.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-018',
  'EDGE_IOT',
  'Geo compliance tool:',
  '{"Region pinning + data residency tags","Random region placement","Shared global bucket"}',
  0,
  2,
  'Keep data where required.',
  2,
  '{"residency","geo"}',
  'Pin storage/compute per regulations.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-019',
  'EDGE_IOT',
  'When to use store-and-forward:',
  '{"Intermittent uplink environments","24/7 fiber","Single lab unit"}',
  0,
  1,
  'Tolerate gaps.',
  1,
  '{"store-and-forward","uplink"}',
  'Buffer locally, send when connected.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-020',
  'EDGE_IOT',
  'Firmware supply-chain protection:',
  '{"Signed images + attestation","ZIP via email","Unsigned HTTP"}',
  0,
  2,
  'Prove origin & integrity.',
  2,
  '{"supply chain","firmware"}',
  'Signatures+attestations stop tampering.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-021',
  'EDGE_IOT',
  'Sensor calibration KPI:',
  '{"Drift vs reference over time","Total reads per day","HTTP 200 rate"}',
  0,
  2,
  'Quality over quantity.',
  2,
  '{"sensors","calibration"}',
  'Track drift to schedule recalibration.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-022',
  'EDGE_IOT',
  'Edge ML model rollout safety:',
  '{"Shadow mode before activate","Instant live replace","Manual copy"}',
  0,
  2,
  'Compare before cutover.',
  2,
  '{"ml","shadow"}',
  'Shadow compares outputs without risk.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-023',
  'EDGE_IOT',
  'Which reduces backhaul cost most:',
  '{"On-device aggregation/filters","More LTE data packs","Larger TCP windows"}',
  0,
  1,
  'Send less.',
  2,
  '{"backhaul","aggregation"}',
  'Aggregate & filter at the edge.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-024',
  'EDGE_IOT',
  'Device identity bootstrap:',
  '{"Factory-embedded keys + enrollment","Shared password via email","MAC address as ID"}',
  0,
  2,
  'Root trust early.',
  2,
  '{"identity","bootstrap"}',
  'Factory keys enable secure enrollment.'
);

INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  'EIO-025',
  'EDGE_IOT',
  'Field debug best practice:',
  '{"Remote shell via audited gateway","Open SSH from internet","Hardcoded backdoors"}',
  0,
  2,
  'Secure access methods.',
  2,
  '{"debug","remote"}',
  'Brokered, audited access reduces risk.'
);

COMMIT;

-- Total: 125 trivia items inserted