window.ACCOUNT_BRIEF_DATA = {
  practices: {
    'Security': '#FF00FF',
    'Business Advisory': '#DAFF00',
    'Data & AI': '#9B9BFF',
    'Hybrid Cloud': '#00FFFF',
    'Modern Work': '#78DCFF',
    'Networking': '#00AEFF'
  },
  accounts: [
    {
      id: 'qssa',
      name: 'Queensland Shared Services Authority',
      subtitle: 'Synthetic government account',
      industry: 'Government',
      segment: 'Strategic',
      region: 'Queensland',
      defaultTopic: 'Data & AI',
      summary: 'A central agency coordinating shared digital, platform and corporate services across multiple government entities.',
      lastSynced: '12 minutes ago',
      sourceCounts: {
        salesforce: 14,
        sharepoint: 18,
        solcat: 9,
        sid: 6
      },
      metrics: {
        activeEngagements: 2,
        accountActivities: 11,
        knownContacts: 7,
        internalPeople: 5
      },
      activeWork: [
        {
          title: 'Essential Eight uplift program',
          practice: 'Business Advisory',
          status: 'In delivery',
          timing: 'Ends Nov 2026',
          owner: 'Maya Chen · Delivery lead',
          source: 'Salesforce opportunity + SharePoint SOW',
          alert: true,
          detail: 'Business Advisory is coordinating control uplift, governance and agency reporting. Security recommendations must build on this program rather than duplicate it.'
        },
        {
          title: 'Microsoft enterprise agreement renewal',
          practice: 'Modern Work',
          status: 'Renewal planning',
          timing: 'Feb 2027',
          owner: 'Sam Patel · Licensing specialist',
          source: 'Salesforce renewal record',
          alert: false,
          detail: 'The renewal creates a natural point to discuss security telemetry, identity licensing and platform consolidation.'
        },
        {
          title: 'Azure landing zone assessment',
          practice: 'Hybrid Cloud',
          status: 'Completed',
          timing: 'May 2026',
          owner: 'Jordan Lee · Cloud architect',
          source: 'SharePoint assessment pack',
          alert: false,
          detail: 'The assessment documented shared platform dependencies, identity boundaries and recovery concerns that remain relevant to a security conversation.'
        }
      ],
      timeline: [
        { date: 'Aug 2026', title: 'Essential Eight weekly delivery report', source: 'SharePoint', detail: 'Three controls remain amber across participating agencies; governance ownership is still being resolved.' },
        { date: 'Jul 2026', title: 'SOC discovery note added to account', source: 'Salesforce', detail: 'Customer asked how central monitoring could coexist with agency-level security operations.' },
        { date: 'May 2026', title: 'Azure landing zone assessment completed', source: 'SharePoint', detail: 'Shared identity, logging and recovery dependencies were documented.' },
        { date: 'Feb 2026', title: 'Executive account planning session', source: 'Salesforce', detail: 'Shared-service resilience and cross-agency governance were identified as strategic themes.' },
        { date: 'Nov 2025', title: 'Microsoft security workshop', source: 'SharePoint', detail: 'Defender and Sentinel capabilities were reviewed, but operating ownership was not agreed.' }
      ],
      customerPeople: [
        { name: 'Dana Liu', role: 'Chief Information Officer', signal: 'Executive sponsor', relationship: 'Strong' },
        { name: 'Marcus Reid', role: 'Chief Information Security Officer', signal: 'Security decision-maker', relationship: 'Developing' },
        { name: 'Priya Shah', role: 'Director, Shared Platforms', signal: 'Technical influencer', relationship: 'Strong' },
        { name: 'Thomas Bell', role: 'Director, Commercial Services', signal: 'Commercial gatekeeper', relationship: 'Known' }
      ],
      internalPeople: [
        { name: 'Maya Chen', role: 'Business Advisory delivery lead', reason: 'Owns the Essential Eight work already in flight', status: 'Contact before meeting' },
        { name: 'Richard Hale', role: 'Security practice lead', reason: 'Can shape the SOC and cyber-resilience conversation', status: 'Invite or brief' },
        { name: 'Jordan Lee', role: 'Hybrid Cloud architect', reason: 'Knows the shared platform and recovery dependencies', status: 'Consult' },
        { name: 'Casey Morgan', role: 'Account executive', reason: 'Owns account strategy and executive relationships', status: 'Account owner' },
        { name: 'Sam Patel', role: 'Licensing specialist', reason: 'Understands the upcoming Microsoft renewal', status: 'Commercial context' }
      ],
      topics: {
        'Security': {
          headline: 'Extend what is already in flight. Do not restart the security story.',
          watchout: 'A new Essential Eight assessment would duplicate active work. Coordinate with the Business Advisory delivery lead before any customer follow-up.',
          starters: [
            {
              title: 'Clarify who owns shared controls across agencies',
              talkTrack: '“As the shared-services authority, where do you want central accountability to end and agency accountability to begin for Essential Eight controls?”',
              whyNow: 'The current program has unresolved governance ownership across participating agencies.',
              evidence: 'Three controls remain amber and the operating model is still being negotiated.',
              sources: ['SharePoint delivery report', 'Salesforce account plan'],
              confidence: 'High',
              mappings: ['Cyber Maturity & Essential Eight', 'Security Operating Model'],
              beforeMeeting: 'Confirm the latest delivery status with Maya Chen.'
            },
            {
              title: 'Move from point-in-time uplift to continuous assurance',
              talkTrack: '“Once the current uplift is complete, how will you prove that controls remain effective across agencies without another manual assessment cycle?”',
              whyNow: 'The active project is focused on uplift, but the account has not agreed a continuous assurance model.',
              evidence: 'Delivery documents identify reporting effort as a sustainability risk.',
              sources: ['SharePoint SOW', 'Weekly status report'],
              confidence: 'High',
              mappings: ['Continuous Control Monitoring', 'Managed Security Assurance'],
              beforeMeeting: 'Avoid implying the current program is insufficient; position this as the next operating phase.'
            },
            {
              title: 'Explore the SOC operating model before discussing tools',
              talkTrack: '“Should the central SOC own detection and triage for shared platforms, provide a service to agencies, or federate with agency SOC teams?”',
              whyNow: 'A recent discovery note records interest in SOC capability, but ownership and service boundaries are unclear.',
              evidence: 'The customer has discussed Microsoft Sentinel, yet no target operating model exists.',
              sources: ['Salesforce activity', 'Microsoft security workshop notes'],
              confidence: 'High',
              mappings: ['SOC Strategy', 'Microsoft Sentinel', 'Managed Detection & Response'],
              beforeMeeting: 'Bring Richard Hale into the preparation call.'
            },
            {
              title: 'Connect identity and privileged access to shared-platform risk',
              talkTrack: '“Which identities and privileged roles can cross agency or shared-platform boundaries today, and where is that risk hardest to see?”',
              whyNow: 'The Azure assessment documented shared identity dependencies and inconsistent privileged access ownership.',
              evidence: 'Identity boundaries were listed as a cross-platform risk in the completed landing zone assessment.',
              sources: ['Azure assessment pack', 'Security workshop notes'],
              confidence: 'Medium-high',
              mappings: ['Identity Security', 'Privileged Access Management'],
              beforeMeeting: 'Ask Jordan Lee which identity findings remain open.'
            },
            {
              title: 'Test recovery around shared-service dependencies',
              talkTrack: '“If a shared service is compromised, which agency services fail with it, and when did you last test that dependency end to end?”',
              whyNow: 'Shared recovery dependencies were identified, but no cross-agency recovery exercise appears in the last 12 months.',
              evidence: 'The account timeline contains technical assessments but no evidence of a coordinated cyber-recovery test.',
              sources: ['SharePoint assessment pack', 'Salesforce activity history'],
              confidence: 'Medium',
              mappings: ['Cyber Recovery Readiness', 'Business Continuity & Resilience'],
              beforeMeeting: 'Validate whether a recovery exercise is scheduled outside the indexed sources.'
            }
          ],
          offers: [
            { title: 'SOC Strategy & Operating Model', practice: 'Security', fit: 'Best fit', reason: 'Directly answers the unresolved central-versus-agency SOC question.' },
            { title: 'Identity Security & Privileged Access', practice: 'Security', fit: 'Strong fit', reason: 'Maps to shared identity and privileged access dependencies already documented.' },
            { title: 'Cyber Recovery Readiness', practice: 'Security', fit: 'Strong fit', reason: 'Builds on known shared-service resilience concerns.' },
            { title: 'Continuous Control Monitoring', practice: 'Business Advisory', fit: 'Adjacent', reason: 'Provides a natural next phase after the active Essential Eight uplift.' }
          ]
        },
        'Data & AI': {
          headline: 'Use the shared-services mandate to frame data governance before AI use cases.',
          watchout: 'Do not lead with a generic AI workshop. Start with ownership, data-sharing boundaries and the existing platform roadmap.',
          prepPack: {
            theme: 'Govern once. Reuse across agencies.',
            meetingIntent: 'Align on the decisions Queensland Shared Services Authority can make once for data and AI, then help agencies adopt with confidence.',
            problem: 'Cross-agency reporting is still manually assembled, data ownership is inconsistent, and no approved shared AI use-case portfolio appears in the account record.',
            impact: 'Agencies risk repeating governance work, creating incompatible controls, and investing in isolated AI experiments that cannot scale as shared services.',
            whyNow: 'The shared-services remit is expanding while Microsoft renewal planning begins within six months. The operating model should shape the technology decision—not follow it.',
            outcome: 'A common data-sharing compact, a short list of reusable AI opportunities, and shared guardrails that agencies can adopt and extend.',
            approach: 'Start with ownership and evidence. Prioritise two cross-agency use cases, define the trusted data they require, and agree the minimum responsible-AI controls before selecting a platform path.',
            ask: 'Validate Committed Capacity as the right commercial model, then agree the sponsor and backlog owner for a focused working session that maps shared data decisions and tests two reusable AI hypotheses.',
            opener: '“You have an opportunity to make the hard data and AI decisions once, so each agency can move faster without solving governance again.”',
            annuity: {
              recommendation: 'Committed Capacity',
              label: 'The engine',
              rationale: 'Best fit for a governed, recurring backlog that needs multidisciplinary Data & AI, advisory, security, platform, and adoption sprints.',
              condition: 'Validate sustained demand, a named sponsor, a backlog owner, and a practical cadence before proposing the commitment.',
              alternatives: [
                { name: 'Entitled Drawdown', fit: 'On-ramp', reason: 'Use if demand is still episodic and QSSA needs prepaid assessments, assurance, and minor uplift first.' },
                { name: 'Standing Service', fit: 'Later', reason: 'Use when a live shared data and AI estate needs always-on operation and continuous improvement.' }
              ]
            },
            internalPrep: ['Confirm first-wave agencies with Casey Morgan', 'Check Fabric, Power Platform, and Copilot entitlements with Sam Patel', 'Ask Maya Chen which governance artefacts from Essential Eight can be reused'],
            watchouts: ['Do not lead with a generic AI workshop', 'Do not imply a platform decision is already made', 'Treat use cases as hypotheses until owners and evidence are confirmed']
          },
          starters: [
            { title: 'Define the data-sharing compact across agencies', talkTrack: '“Which data should be governed centrally, and which data must remain under agency control?”', whyNow: 'Shared-service responsibilities are expanding without a consistent data ownership model.', evidence: 'Account planning notes identify cross-agency reporting friction.', sources: ['Salesforce account plan'], confidence: 'Medium-high', mappings: ['Data Strategy', 'Information Governance'], beforeMeeting: 'Confirm which agencies are in the first wave.' },
            { title: 'Prioritise AI use cases that benefit every agency', talkTrack: '“Which repeatable service interactions could become a shared AI capability rather than separate agency projects?”', whyNow: 'The authority wants reusable services, but no cross-agency use-case portfolio is recorded.', evidence: 'No approved AI program appears in indexed opportunities or documents.', sources: ['Salesforce opportunities', 'SharePoint search'], confidence: 'Medium', mappings: ['AI Envisioning Workshop', 'Copilot Studio'], beforeMeeting: 'Frame ideas as hypotheses, not commitments.' },
            { title: 'Connect platform telemetry to trusted decision data', talkTrack: '“Where do operational, security and service data need a common model before executives can trust cross-agency reporting?”', whyNow: 'Security and platform work already produces data that is difficult to consolidate.', evidence: 'Delivery reports use manual aggregation across agencies.', sources: ['SharePoint delivery report'], confidence: 'High', mappings: ['Data Platform Modernisation', 'Power BI Governance'], beforeMeeting: 'Ask the delivery team which metrics are manually assembled.' },
            { title: 'Set responsible-AI guardrails once, not agency by agency', talkTrack: '“Could the authority provide a common responsible-AI control set that agencies adopt and extend?”', whyNow: 'A central governance role creates leverage for consistent controls.', evidence: 'No common responsible-AI framework is present in indexed material.', sources: ['SharePoint search', 'SolCat mapping'], confidence: 'Medium', mappings: ['Responsible AI Advisory', 'AI Governance'], beforeMeeting: 'Validate whether a whole-of-government framework already exists.' },
            { title: 'Use the Microsoft renewal as a data and AI decision point', talkTrack: '“Which capabilities are already licensed but underused, and what should be standardised before the renewal?”', whyNow: 'The upcoming renewal may affect Fabric, Power Platform and Copilot options.', evidence: 'Renewal planning starts within six months.', sources: ['Salesforce renewal record'], confidence: 'High', mappings: ['Microsoft Fabric', 'Power Platform Governance'], beforeMeeting: 'Coordinate with Sam Patel for the current entitlement picture.' }
          ],
          offers: [
            { title: 'Data & AI Strategy', practice: 'Data & AI', fit: 'Best fit', reason: 'Creates the cross-agency ownership and prioritisation model.' },
            { title: 'AI Envisioning Workshop', practice: 'Data & AI', fit: 'Strong fit', reason: 'Useful after governance boundaries and shared use cases are understood.' },
            { title: 'Data Platform Modernisation', practice: 'Data & AI', fit: 'Strong fit', reason: 'Addresses fragmented operational and reporting data.' },
            { title: 'Power Platform Governance', practice: 'Modern Work', fit: 'Adjacent', reason: 'Supports common controls across agencies.' }
          ]
        },
        'Hybrid Cloud': {
          headline: 'Turn the completed landing-zone work into a shared-platform operating conversation.',
          watchout: 'The customer has already completed an assessment. Do not sell another discovery exercise; use its findings as evidence.',
          starters: [
            { title: 'Agree what the authority should standardise', talkTrack: '“Which cloud controls, patterns and services should every agency consume by default?”', whyNow: 'The landing-zone assessment identified inconsistent platform patterns.', evidence: 'Shared standards are documented but not yet mandated.', sources: ['Azure assessment pack'], confidence: 'High', mappings: ['Azure Platform Engineering', 'Cloud Governance'], beforeMeeting: 'Ask Jordan Lee which recommendations were accepted.' },
            { title: 'Separate platform ownership from workload ownership', talkTrack: '“Where should the central platform team stop and agency application teams begin?”', whyNow: 'Operating boundaries remain unclear across shared and agency workloads.', evidence: 'The assessment lists duplicated responsibilities.', sources: ['Azure assessment pack', 'Account plan'], confidence: 'High', mappings: ['Cloud Operating Model', 'Managed Azure'], beforeMeeting: 'Bring an example RACI, not a product pitch.' },
            { title: 'Make recovery a shared-platform capability', talkTrack: '“Which recovery services should be engineered centrally so agencies do not solve resilience separately?”', whyNow: 'Recovery dependencies cross multiple shared services.', evidence: 'No coordinated recovery test appears in the indexed timeline.', sources: ['Assessment pack', 'Salesforce activity'], confidence: 'Medium-high', mappings: ['Azure Resilience', 'Cyber Recovery Readiness'], beforeMeeting: 'Validate current DR ownership.' },
            { title: 'Use security telemetry as a platform service', talkTrack: '“Could logging, posture and threat telemetry be delivered as a standard shared capability?”', whyNow: 'SOC interest and cloud standardisation are converging.', evidence: 'Sentinel was discussed but operating ownership is unresolved.', sources: ['Security workshop notes', 'SOC discovery activity'], confidence: 'High', mappings: ['Cloud Security Posture', 'Microsoft Sentinel'], beforeMeeting: 'Coordinate with Richard Hale.' },
            { title: 'Bring FinOps into agency service consumption', talkTrack: '“How should agencies see and influence the cost of the shared cloud services they consume?”', whyNow: 'The authority needs a transparent service model as shared usage grows.', evidence: 'Cost allocation was noted as an open design item.', sources: ['Azure assessment pack'], confidence: 'Medium-high', mappings: ['FinOps Advisory', 'Cloud Economics'], beforeMeeting: 'Prepare a simple showback example.' }
          ],
          offers: [
            { title: 'Azure Platform Engineering', practice: 'Hybrid Cloud', fit: 'Best fit', reason: 'Moves accepted landing-zone recommendations into reusable services.' },
            { title: 'Cloud Operating Model', practice: 'Business Advisory', fit: 'Strong fit', reason: 'Clarifies central and agency accountabilities.' },
            { title: 'Azure Resilience & Recovery', practice: 'Hybrid Cloud', fit: 'Strong fit', reason: 'Addresses shared dependencies identified in the assessment.' },
            { title: 'FinOps Advisory', practice: 'Business Advisory', fit: 'Adjacent', reason: 'Supports transparent shared-service consumption.' }
          ]
        }
      }
    },
    {
      id: 'sch',
      name: 'Southern Cross Health Network',
      subtitle: 'Synthetic healthcare account',
      industry: 'Healthcare',
      segment: 'Enterprise',
      region: 'Australia',
      defaultTopic: 'Data & AI',
      summary: 'A multi-site health network modernising clinical data, identity and digital workplace services.',
      lastSynced: '21 minutes ago',
      sourceCounts: { salesforce: 9, sharepoint: 12, solcat: 7, sid: 5 },
      metrics: { activeEngagements: 2, accountActivities: 8, knownContacts: 6, internalPeople: 4 },
      activeWork: [
        { title: 'Clinical data platform discovery', practice: 'Data & AI', status: 'In discovery', timing: 'Ends Sep 2026', owner: 'Elena Park · Data architect', source: 'Salesforce opportunity + SharePoint workshop', alert: true, detail: 'A clinical data discovery is already active. Any AI conversation should connect to its governance and platform decisions.' },
        { title: 'Identity consolidation', practice: 'Security', status: 'In delivery', timing: 'Ends Dec 2026', owner: 'Noah Clarke · Security architect', source: 'SharePoint project site', alert: false, detail: 'Identity consolidation affects access to clinical and workforce data.' }
      ],
      timeline: [
        { date: 'Aug 2026', title: 'Clinical data workshop', source: 'SharePoint', detail: 'Priority domains and data-quality constraints were documented.' },
        { date: 'Jun 2026', title: 'Identity consolidation commenced', source: 'Salesforce', detail: 'Workforce and privileged identity are being standardised.' },
        { date: 'Mar 2026', title: 'Executive innovation session', source: 'Salesforce', detail: 'AI-assisted patient administration was raised as a priority.' }
      ],
      customerPeople: [
        { name: 'Amelia Ward', role: 'Chief Digital Officer', signal: 'Executive sponsor', relationship: 'Strong' },
        { name: 'Dr Leo Grant', role: 'Chief Medical Information Officer', signal: 'Clinical influencer', relationship: 'Developing' },
        { name: 'Nina Flores', role: 'Director, Data & Analytics', signal: 'Technical decision-maker', relationship: 'Strong' }
      ],
      internalPeople: [
        { name: 'Elena Park', role: 'Data architect', reason: 'Owns the active clinical data discovery', status: 'Contact before meeting' },
        { name: 'Noah Clarke', role: 'Security architect', reason: 'Knows the identity dependencies', status: 'Consult' },
        { name: 'Olivia Ross', role: 'Healthcare industry lead', reason: 'Can shape sector-specific value and risk', status: 'Invite or brief' },
        { name: 'Ben Walker', role: 'Account executive', reason: 'Owns account strategy', status: 'Account owner' }
      ],
      topics: {
        'Data & AI': {
          headline: 'Make AI the outcome of trusted clinical data, not a separate technology pitch.',
          watchout: 'A clinical data discovery is already active. Coordinate with the data architect before introducing new platform or AI work.',
          starters: [
            { title: 'Choose one cross-site clinical data priority', talkTrack: '“Which clinical decision becomes materially better if every site trusts the same data?”', whyNow: 'The discovery has identified multiple domains but not a single executive priority.', evidence: 'Workshop notes list fragmented use cases.', sources: ['SharePoint workshop'], confidence: 'High', mappings: ['Data & AI Strategy', 'Clinical Analytics'], beforeMeeting: 'Confirm current workshop outputs with Elena Park.' },
            { title: 'Define consent and access before scaling AI', talkTrack: '“What consent, privacy and access decisions would block an AI use case even if the model worked?”', whyNow: 'Identity consolidation and clinical data work are converging.', evidence: 'Access ownership is changing during the identity program.', sources: ['Identity project site', 'Clinical data workshop'], confidence: 'High', mappings: ['Information Governance', 'Identity Security'], beforeMeeting: 'Bring Noah Clarke into preparation.' },
            { title: 'Target administrative burden first', talkTrack: '“Where could AI remove repetitive patient-administration work without entering clinical decision-making?”', whyNow: 'The executive innovation session prioritised administrative efficiency.', evidence: 'Patient administration was the most repeated AI theme.', sources: ['Salesforce executive session'], confidence: 'High', mappings: ['AI Envisioning Workshop', 'Microsoft Copilot'], beforeMeeting: 'Prepare two non-clinical examples.' },
            { title: 'Create a data-quality operating model', talkTrack: '“Who owns the quality of shared data once it leaves a source system?”', whyNow: 'Data quality is the main constraint recorded in discovery.', evidence: 'No cross-site owner is assigned to priority domains.', sources: ['SharePoint workshop'], confidence: 'High', mappings: ['Data Governance', 'Data Platform Modernisation'], beforeMeeting: 'Avoid positioning technology as the sole answer.' },
            { title: 'Agree how value will be measured', talkTrack: '“What clinical, workforce or patient metric must move before this becomes a scaled program?”', whyNow: 'Use cases exist but the value framework is still undefined.', evidence: 'No benefits baseline appears in the opportunity or workshop pack.', sources: ['Salesforce opportunity', 'SharePoint workshop'], confidence: 'Medium-high', mappings: ['Benefits Realisation', 'AI Adoption'], beforeMeeting: 'Bring a one-page value hypothesis.' }
          ],
          offers: [
            { title: 'Clinical Data Strategy', practice: 'Data & AI', fit: 'Best fit', reason: 'Connects the active discovery to an executable governance roadmap.' },
            { title: 'AI Envisioning Workshop', practice: 'Data & AI', fit: 'Strong fit', reason: 'Narrows non-clinical use cases after data constraints are understood.' },
            { title: 'Information Governance', practice: 'Business Advisory', fit: 'Strong fit', reason: 'Addresses consent, ownership and data quality.' },
            { title: 'Identity Security', practice: 'Security', fit: 'Adjacent', reason: 'Supports safe access to clinical and workforce data.' }
          ]
        },
        'Security': {
          headline: 'Use the active identity program as the anchor for a broader healthcare security conversation.',
          watchout: 'Do not create a competing identity workstream. Focus on clinical access, privileged roles and operating assurance.',
          starters: [
            { title: 'Protect privileged clinical access', talkTrack: '“Which privileged identities can alter clinical systems or data, and how quickly could you prove who used them?”', whyNow: 'Identity consolidation is in flight.', evidence: 'Privileged access is a stated dependency.', sources: ['Identity project site'], confidence: 'High', mappings: ['Privileged Access Management'], beforeMeeting: 'Coordinate with Noah Clarke.' },
            { title: 'Design for clinical downtime', talkTrack: '“How do care teams continue safely when identity or core platforms are unavailable?”', whyNow: 'Resilience is not yet part of the identity delivery scope.', evidence: 'No recent integrated downtime test appears in indexed sources.', sources: ['SharePoint search'], confidence: 'Medium', mappings: ['Cyber Recovery Readiness'], beforeMeeting: 'Validate the latest downtime exercise.' },
            { title: 'Link data access to consent', talkTrack: '“Can access decisions reflect patient consent and clinical context rather than only job role?”', whyNow: 'Clinical data and identity programs are converging.', evidence: 'Consent requirements are being defined.', sources: ['Clinical data workshop'], confidence: 'Medium-high', mappings: ['Identity Governance', 'Information Protection'], beforeMeeting: 'Bring the data architect into preparation.' },
            { title: 'Prioritise detection around high-impact workflows', talkTrack: '“Which clinical workflows would create the greatest patient risk if compromised?”', whyNow: 'The network is reviewing monitoring priorities.', evidence: 'No risk-ranked detection catalogue is recorded.', sources: ['Salesforce activity'], confidence: 'Medium', mappings: ['SOC Use-Case Engineering'], beforeMeeting: 'Prepare sector-specific examples.' },
            { title: 'Turn identity delivery into continuous assurance', talkTrack: '“How will you prove that access remains appropriate after the migration finishes?”', whyNow: 'The current project focuses on consolidation rather than ongoing assurance.', evidence: 'No post-project control monitoring is in scope.', sources: ['Project scope'], confidence: 'High', mappings: ['Identity Assurance'], beforeMeeting: 'Position as an operating phase, not remediation.' }
          ],
          offers: [
            { title: 'Privileged Access Management', practice: 'Security', fit: 'Best fit', reason: 'Directly extends the active identity program.' },
            { title: 'Cyber Recovery Readiness', practice: 'Security', fit: 'Strong fit', reason: 'Addresses clinical continuity risk.' },
            { title: 'SOC Use-Case Engineering', practice: 'Security', fit: 'Strong fit', reason: 'Focuses detection on high-impact clinical workflows.' },
            { title: 'Information Protection', practice: 'Security', fit: 'Adjacent', reason: 'Connects access to sensitive clinical data.' }
          ]
        }
      }
    },
    {
      id: 'cu',
      name: 'Coastline University',
      subtitle: 'Synthetic education account',
      industry: 'Education',
      segment: 'Enterprise',
      region: 'Australia',
      defaultTopic: 'Modern Work',
      summary: 'A distributed university simplifying collaboration, campus connectivity and digital student services.',
      lastSynced: '34 minutes ago',
      sourceCounts: { salesforce: 8, sharepoint: 10, solcat: 6, sid: 4 },
      metrics: { activeEngagements: 1, accountActivities: 7, knownContacts: 5, internalPeople: 4 },
      activeWork: [
        { title: 'Campus network refresh', practice: 'Networking', status: 'In delivery', timing: 'Ends Jan 2027', owner: 'Ava Nguyen · Network architect', source: 'Salesforce project + SharePoint design', alert: true, detail: 'The network refresh affects identity, device experience and digital learning services.' },
        { title: 'Microsoft 365 adoption review', practice: 'Modern Work', status: 'Completed', timing: 'Apr 2026', owner: 'Liam Scott · Adoption consultant', source: 'SharePoint adoption report', alert: false, detail: 'The review found inconsistent adoption and governance across faculties.' }
      ],
      timeline: [
        { date: 'Aug 2026', title: 'Network design checkpoint', source: 'SharePoint', detail: 'Student experience and secure access were flagged as success measures.' },
        { date: 'Apr 2026', title: 'M365 adoption review completed', source: 'SharePoint', detail: 'Faculty-level governance and training gaps were recorded.' },
        { date: 'Jan 2026', title: 'Digital campus strategy meeting', source: 'Salesforce', detail: 'The university prioritised consistent digital experience across locations.' }
      ],
      customerPeople: [
        { name: 'Sophie King', role: 'Chief Information Officer', signal: 'Executive sponsor', relationship: 'Strong' },
        { name: 'Elliot Green', role: 'Director, Digital Campus', signal: 'Program owner', relationship: 'Strong' },
        { name: 'Mina Patel', role: 'Chief Information Security Officer', signal: 'Risk decision-maker', relationship: 'Developing' }
      ],
      internalPeople: [
        { name: 'Ava Nguyen', role: 'Network architect', reason: 'Owns the active network refresh', status: 'Contact before meeting' },
        { name: 'Liam Scott', role: 'Adoption consultant', reason: 'Knows the M365 adoption findings', status: 'Consult' },
        { name: 'Grace Taylor', role: 'Education industry lead', reason: 'Can shape student and academic outcomes', status: 'Invite or brief' },
        { name: 'Jack Wilson', role: 'Account executive', reason: 'Owns account strategy', status: 'Account owner' }
      ],
      topics: {
        'Modern Work': {
          headline: 'Connect collaboration and adoption to the digital-campus experience already being redesigned.',
          watchout: 'Do not treat M365 adoption as a standalone training program. Link it to the network refresh and faculty governance.',
          starters: [
            { title: 'Define one consistent digital-campus experience', talkTrack: '“What should a student or staff member experience identically on every campus and device?”', whyNow: 'The network refresh creates a platform moment for experience standardisation.', evidence: 'Student experience is a named success measure.', sources: ['Network design checkpoint'], confidence: 'High', mappings: ['Employee Experience', 'Microsoft 365 Adoption'], beforeMeeting: 'Coordinate with Ava Nguyen.' },
            { title: 'Make faculty governance practical', talkTrack: '“Which collaboration decisions should faculties control, and which should the university standardise?”', whyNow: 'The adoption review found inconsistent faculty governance.', evidence: 'Governance fragmentation is the largest adoption barrier.', sources: ['M365 adoption report'], confidence: 'High', mappings: ['Microsoft 365 Governance'], beforeMeeting: 'Bring Liam Scott into preparation.' },
            { title: 'Use Copilot only where information is ready', talkTrack: '“Which teams have the information hygiene and permissions needed for a safe Copilot pilot?”', whyNow: 'Copilot interest exists, but governance findings indicate uneven readiness.', evidence: 'Permissions and content ownership gaps are documented.', sources: ['Adoption report', 'Salesforce activity'], confidence: 'High', mappings: ['Copilot Readiness'], beforeMeeting: 'Avoid a broad licensing discussion first.' },
            { title: 'Link secure access to the student journey', talkTrack: '“Where does authentication or device friction most disrupt learning and support?”', whyNow: 'Network and identity experience are being redesigned together.', evidence: 'Secure access is a network-program success measure.', sources: ['Network design'], confidence: 'Medium-high', mappings: ['Secure Access Service Edge', 'Identity Experience'], beforeMeeting: 'Ask the network team for top pain points.' },
            { title: 'Measure adoption through outcomes', talkTrack: '“Which teaching, service or workforce outcome should improve if collaboration changes?”', whyNow: 'Previous adoption activity tracked usage rather than outcomes.', evidence: 'The adoption report recommends a benefits framework.', sources: ['M365 adoption report'], confidence: 'High', mappings: ['Adoption & Change Management'], beforeMeeting: 'Prepare an outcome-based measurement example.' }
          ],
          offers: [
            { title: 'Microsoft 365 Governance', practice: 'Modern Work', fit: 'Best fit', reason: 'Directly addresses the completed adoption review.' },
            { title: 'Copilot Readiness', practice: 'Modern Work', fit: 'Strong fit', reason: 'Builds on information and permission readiness.' },
            { title: 'Adoption & Change Management', practice: 'Business Advisory', fit: 'Strong fit', reason: 'Moves measurement from usage to outcomes.' },
            { title: 'Secure Access Service Edge', practice: 'Networking', fit: 'Adjacent', reason: 'Links the active network refresh to user experience.' }
          ]
        },
        'Security': {
          headline: 'Use the campus network refresh to make secure access visible and measurable.',
          watchout: 'The network team is already delivering core changes. Focus on security outcomes and user experience, not a competing architecture.',
          starters: [
            { title: 'Prioritise identity and access friction', talkTrack: '“Where do students, academics and contractors experience the most risky access workarounds?”', whyNow: 'Secure access is a named program outcome.', evidence: 'Network design notes show inconsistent authentication patterns.', sources: ['Network design'], confidence: 'High', mappings: ['Identity Security', 'Zero Trust Access'], beforeMeeting: 'Coordinate with Ava Nguyen.' },
            { title: 'Protect research collaboration', talkTrack: '“How do you enable external research partners without losing control of sensitive data?”', whyNow: 'External collaboration is growing.', evidence: 'M365 review records unmanaged guest access.', sources: ['Adoption report'], confidence: 'High', mappings: ['Information Protection', 'External Collaboration Governance'], beforeMeeting: 'Bring the adoption consultant into preparation.' },
            { title: 'Design detection for a distributed campus', talkTrack: '“Which campus, cloud and identity signals need to be seen together to detect a real incident?”', whyNow: 'The refresh is changing network telemetry.', evidence: 'Current monitoring is fragmented by location.', sources: ['Network design', 'Salesforce activity'], confidence: 'Medium-high', mappings: ['SOC Modernisation'], beforeMeeting: 'Confirm available telemetry.' },
            { title: 'Test academic continuity', talkTrack: '“Which digital services must recover first to keep teaching and assessment running?”', whyNow: 'No recent university-wide cyber recovery test is indexed.', evidence: 'Continuity planning is decentralised.', sources: ['SharePoint search'], confidence: 'Medium', mappings: ['Cyber Recovery Readiness'], beforeMeeting: 'Validate with the CIO.' },
            { title: 'Turn policy into faculty-level action', talkTrack: '“Where do central security policies break down when faculties operate differently?”', whyNow: 'Governance inconsistency affects both collaboration and security.', evidence: 'The adoption review documents uneven local practices.', sources: ['M365 adoption report'], confidence: 'High', mappings: ['Security Operating Model'], beforeMeeting: 'Use faculty examples, not abstract policy.' }
          ],
          offers: [
            { title: 'Zero Trust Access', practice: 'Security', fit: 'Best fit', reason: 'Connects secure access to the active network program.' },
            { title: 'Information Protection', practice: 'Security', fit: 'Strong fit', reason: 'Addresses research and external collaboration risk.' },
            { title: 'SOC Modernisation', practice: 'Security', fit: 'Strong fit', reason: 'Unifies new campus and cloud telemetry.' },
            { title: 'Cyber Recovery Readiness', practice: 'Security', fit: 'Adjacent', reason: 'Tests academic continuity.' }
          ]
        }
      }
    }
  ]
};
