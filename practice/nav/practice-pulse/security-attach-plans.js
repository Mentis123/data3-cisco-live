/* Generated from the NSW and WA AI + Security Attach Plan workbooks supplied 28 August 2026. */
(function attachPlanModule(root, factory) {
  const nationalData = typeof module === 'object' && module.exports
    ? require('./national-security-attach-plans.js')
    : root && root.D3NationalAttachData;
  const api = factory(nationalData);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.D3SecurityAttach = api;
})(typeof window !== 'undefined' ? window : null, function createAttachPlanApi(nationalData) {
  'use strict';

  const DATA = Object.freeze({
  "snapshotDate": "28 August 2026",
  "states": {
    "NSW": {
      "namedOpportunities": 15,
      "namedPipelineAmount": 175390.03999999998,
      "weightedPipeline": 53296.748,
      "securityAttachWhitespace": "100%",
      "source": "User-provided reconciled Salesforce Agent detailed dataset and v2 additions, supplied 28 August 2026.",
      "valueDefinition": "Amount is pipeline value / expected revenue, not GP and not ACV until contracted as recurring.",
      "scope": "Workbook lists all named opportunities in the supplied detailed tables that had this state. It does not add unnamed records from summary pivots.",
      "securityAttachBasis": "The supplied dataset states all in-scope opportunities have no identifiable Purview, Defender, Sentinel, MXDR, Copilot Shield or AI Defence line item.",
      "proposedFieldBasis": "Annuity offer, vehicle, security attach and next move are strategy recommendations, not fields sourced from Salesforce.",
      "dataQuality": "Use Opportunity ID to confirm the current record in Salesforce before customer outreach; stages, values and close dates can change.",
      "opportunities": [
        {
          "priority": "1 - Immediate",
          "customer": "eHealth NSW",
          "currentOpportunity": "eHealth CoPilot Studio Phase 1",
          "offerBucket": "Copilot Studio/Agent",
          "stage": "03-Qualify",
          "amount": 30000,
          "probability": 0.2,
          "weightedAmount": 6000,
          "closeDate": "27/11/2026",
          "proposedAnnuityOffer": "Secure Agent Build Capacity → Managed Agent Operations",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Agent identity and least privilege; DLP; runtime protection; red-teaming; agent inventory, lifecycle and monitoring",
          "nextMove": "Attach agent identity, DLP and red-team assurance; position build-and-maintain capacity.",
          "opportunityId": "006RE00000ReJyrYAF"
        },
        {
          "priority": "1 - Immediate",
          "customer": "Essential Energy",
          "currentOpportunity": "Essential Energy RFQ 1543 - Copilot Studio",
          "offerBucket": "Copilot Studio/Agent",
          "stage": "04-Develop",
          "amount": 25000,
          "probability": 0.3,
          "weightedAmount": 7500,
          "closeDate": "31/01/2027",
          "proposedAnnuityOffer": "Secure Agent Build Capacity → Managed Agent Operations",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Agent identity and least privilege; DLP; runtime protection; red-teaming; agent inventory, lifecycle and monitoring",
          "nextMove": "Attach agent identity, DLP and red-team assurance; position build-and-maintain capacity.",
          "opportunityId": "006Mo00000kaShdIAE"
        },
        {
          "priority": "1 - Immediate",
          "customer": "Essential Energy",
          "currentOpportunity": "Essential Energy - Copilot Agents Mgt & Gov",
          "offerBucket": "Copilot Studio/Agent",
          "stage": "06-Negotiation",
          "amount": 11519.42,
          "probability": 0.8,
          "weightedAmount": 9215.536,
          "closeDate": "30/09/2026",
          "proposedAnnuityOffer": "Secure Agent Build Capacity → Managed Agent Operations",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Agent identity and least privilege; DLP; runtime protection; red-teaming; agent inventory, lifecycle and monitoring",
          "nextMove": "Attach agent identity, DLP and red-team assurance; position build-and-maintain capacity.",
          "opportunityId": "006RE000009rh3GYAQ"
        },
        {
          "priority": "2 - Active",
          "customer": "Commonwealth DPP",
          "currentOpportunity": "AC - CDPP - Copilot Pilot",
          "offerBucket": "Copilot Pilot/Adoption/Rollout",
          "stage": "05-Proposal",
          "amount": 17977.5,
          "probability": 0.5,
          "weightedAmount": 8988.75,
          "closeDate": "30/09/2026",
          "proposedAnnuityOffer": "Copilot Adoption & Protection Capacity → Managed Copilot Adoption",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Copilot Shield; Purview/DLP tuning; access and sharing controls; shadow-AI monitoring; adoption and value telemetry",
          "nextMove": "Attach security before rollout; position recurring adoption, data protection and value cadence.",
          "opportunityId": "006RE00000RF786YAD"
        },
        {
          "priority": "2 - Active",
          "customer": "NSW Electoral Commission",
          "currentOpportunity": "NSW EC - Copilot Deployment Services",
          "offerBucket": "Copilot Pilot/Adoption/Rollout",
          "stage": "03-Qualify",
          "amount": 17466,
          "probability": 0.2,
          "weightedAmount": 3493.2,
          "closeDate": "31/10/2026",
          "proposedAnnuityOffer": "Copilot Adoption & Protection Capacity → Managed Copilot Adoption",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Copilot Shield; Purview/DLP tuning; access and sharing controls; shadow-AI monitoring; adoption and value telemetry",
          "nextMove": "Attach security before rollout; position recurring adoption, data protection and value cadence.",
          "opportunityId": "006RE00000WGNshYAH"
        },
        {
          "priority": "2 - Active",
          "customer": "Australian Digital Health Agency",
          "currentOpportunity": "ADHA - Additional Copilot",
          "offerBucket": "Copilot Pilot/Adoption/Rollout",
          "stage": "02-Discovery",
          "amount": 14336.12,
          "probability": 0.1,
          "weightedAmount": 1433.612,
          "closeDate": "30/09/2026",
          "proposedAnnuityOffer": "Copilot Adoption & Protection Capacity → Managed Copilot Adoption",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Copilot Shield; Purview/DLP tuning; access and sharing controls; shadow-AI monitoring; adoption and value telemetry",
          "nextMove": "Attach security before rollout; position recurring adoption, data protection and value cadence.",
          "opportunityId": "006Mo00000lScAXIA0"
        },
        {
          "priority": "2 - Active",
          "customer": "Port of Newcastle",
          "currentOpportunity": "Newcastle Port Auth - Copilot readiness & POC",
          "offerBucket": "Copilot Readiness",
          "stage": "03-Qualify",
          "amount": 13099.5,
          "probability": 0.2,
          "weightedAmount": 2619.9,
          "closeDate": "31/12/2026",
          "proposedAnnuityOffer": "Copilot Readiness & Security Entitlement",
          "vehiclePath": "Entitled Drawdown",
          "securityToAttach": "Oversharing and permissions review; Purview classification/DLP; Copilot Shield remediation pathway; identity and governance baseline",
          "nextMove": "Use findings to scope Copilot Shield or Purview remediation and an annual re-baseline entitlement.",
          "opportunityId": "006RE00000CcMBtYAN"
        },
        {
          "priority": "2 - Active",
          "customer": "Aged Care Quality and Safety Commission",
          "currentOpportunity": "ACQSC - Copilot Readiness and Acceleration",
          "offerBucket": "Copilot Readiness",
          "stage": "02-Discovery",
          "amount": 10500,
          "probability": 0.1,
          "weightedAmount": 1050,
          "closeDate": "16/09/2026",
          "proposedAnnuityOffer": "Copilot Readiness & Security Entitlement",
          "vehiclePath": "Entitled Drawdown",
          "securityToAttach": "Oversharing and permissions review; Purview classification/DLP; Copilot Shield remediation pathway; identity and governance baseline",
          "nextMove": "Use findings to scope Copilot Shield or Purview remediation and an annual re-baseline entitlement.",
          "opportunityId": "006RE00000QCtbFYAT"
        },
        {
          "priority": "2 - Active",
          "customer": "Hollard",
          "currentOpportunity": "Hollard - Copilot Agent (MSFT Funded)",
          "offerBucket": "Copilot Studio/Agent",
          "stage": "04-Develop",
          "amount": 10000,
          "probability": 0.3,
          "weightedAmount": 3000,
          "closeDate": "30/04/2027",
          "proposedAnnuityOffer": "Secure Agent Build Capacity → Managed Agent Operations",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Agent identity and least privilege; DLP; runtime protection; red-teaming; agent inventory, lifecycle and monitoring",
          "nextMove": "Attach agent identity, DLP and red-team assurance; position build-and-maintain capacity.",
          "opportunityId": "006RE00000U8YkoYAF"
        },
        {
          "priority": "2 - Active",
          "customer": "Armidale Regional Council",
          "currentOpportunity": "Armidale Regional Council - Copilot Readiness Assessment",
          "offerBucket": "Copilot Readiness",
          "stage": "05-Proposal",
          "amount": 6780,
          "probability": 0.5,
          "weightedAmount": 3390,
          "closeDate": "30/09/2026",
          "proposedAnnuityOffer": "Copilot Readiness & Security Entitlement",
          "vehiclePath": "Entitled Drawdown",
          "securityToAttach": "Oversharing and permissions review; Purview classification/DLP; Copilot Shield remediation pathway; identity and governance baseline",
          "nextMove": "Use findings to scope Copilot Shield or Purview remediation and an annual re-baseline entitlement.",
          "opportunityId": "006Mo00000l0B8UIAU"
        },
        {
          "priority": "2 - Active",
          "customer": "Housing Australia",
          "currentOpportunity": "Housing Australia - AI / Copilot readiness",
          "offerBucket": "Copilot Readiness",
          "stage": "05-Proposal",
          "amount": 6211.5,
          "probability": 0.5,
          "weightedAmount": 3105.75,
          "closeDate": "28/08/2026",
          "proposedAnnuityOffer": "Copilot Readiness & Security Entitlement",
          "vehiclePath": "Entitled Drawdown",
          "securityToAttach": "Oversharing and permissions review; Purview classification/DLP; Copilot Shield remediation pathway; identity and governance baseline",
          "nextMove": "Use findings to scope Copilot Shield or Purview remediation and an annual re-baseline entitlement.",
          "opportunityId": "006Mo00000jPybmIAC"
        },
        {
          "priority": "2 - Active",
          "customer": "CES",
          "currentOpportunity": "CES - AI Foundry landing zone",
          "offerBucket": "Foundry/Landing Zone",
          "stage": "05-Proposal",
          "amount": 2500,
          "probability": 0.5,
          "weightedAmount": 1250,
          "closeDate": "31/10/2026",
          "proposedAnnuityOffer": "Foundry Care & Security → Managed AI Platform & Security",
          "vehiclePath": "Drawdown → Standing",
          "securityToAttach": "Defender for AI Services; Purview DSPM for AI; Entra Agent ID; Sentinel/MXDR; AI FinOps; guardrail and red-team review",
          "nextMove": "Qualify who operates and secures the platform after handover; add Defender/Purview baseline.",
          "opportunityId": "006Mo00000k6yVFIAY"
        },
        {
          "priority": "3 - Develop",
          "customer": "Yass Valley Council",
          "currentOpportunity": "Yass Valley Council - CoPilot Readiness Assessment",
          "offerBucket": "Copilot Readiness",
          "stage": "03-Qualify",
          "amount": 3750,
          "probability": 0.2,
          "weightedAmount": 750,
          "closeDate": "31/10/2026",
          "proposedAnnuityOffer": "Copilot Readiness & Security Entitlement",
          "vehiclePath": "Entitled Drawdown",
          "securityToAttach": "Oversharing and permissions review; Purview classification/DLP; Copilot Shield remediation pathway; identity and governance baseline",
          "nextMove": "Use findings to scope Copilot Shield or Purview remediation and an annual re-baseline entitlement.",
          "opportunityId": "006Mo00000idFx8IAE"
        },
        {
          "priority": "3 - Develop",
          "customer": "Dexus",
          "currentOpportunity": "Dexus Co-Pilot MSFT Workshop",
          "offerBucket": "AI Envisioning/Use Case",
          "stage": "03-Qualify",
          "amount": 3750,
          "probability": 0.2,
          "weightedAmount": 750,
          "closeDate": "31/10/2026",
          "proposedAnnuityOffer": "AI Opportunity & Assurance Entitlement → AI Value Office",
          "vehiclePath": "Drawdown → Capacity",
          "securityToAttach": "Risk and data classification; privacy/regulatory screening; threat modelling; RAI and red-team pathway",
          "nextMove": "Add security risk scoring to use-case triage; convert the pipeline into quarterly AI Value Office capacity.",
          "opportunityId": "006RE00000R6lcdYAB"
        },
        {
          "priority": "3 - Develop",
          "customer": "North Sydney Council",
          "currentOpportunity": "North Sydney Council - Agent POC Engagement",
          "offerBucket": "Copilot Studio/Agent",
          "stage": "04-Develop",
          "amount": 2500,
          "probability": 0.3,
          "weightedAmount": 750,
          "closeDate": "01/10/2026",
          "proposedAnnuityOffer": "Secure Agent Build Capacity → Managed Agent Operations",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Agent identity and least privilege; DLP; runtime protection; red-teaming; agent inventory, lifecycle and monitoring",
          "nextMove": "Attach agent identity, DLP and red-team assurance; position build-and-maintain capacity.",
          "opportunityId": "006Mo00000lrjQYIAY"
        }
      ]
    },
    "WA": {
      "namedOpportunities": 17,
      "namedPipelineAmount": 181041.3,
      "weightedPipeline": 85742.76,
      "securityAttachWhitespace": "100%",
      "source": "User-provided reconciled Salesforce Agent detailed dataset and v2 additions, supplied 28 August 2026.",
      "valueDefinition": "Amount is pipeline value / expected revenue, not GP and not ACV until contracted as recurring.",
      "scope": "Workbook lists all named opportunities in the supplied detailed tables that had this state. It does not add unnamed records from summary pivots.",
      "securityAttachBasis": "The supplied dataset states all in-scope opportunities have no identifiable Purview, Defender, Sentinel, MXDR, Copilot Shield or AI Defence line item.",
      "proposedFieldBasis": "Annuity offer, vehicle, security attach and next move are strategy recommendations, not fields sourced from Salesforce.",
      "dataQuality": "Use Opportunity ID to confirm the current record in Salesforce before customer outreach; stages, values and close dates can change.",
      "opportunities": [
        {
          "priority": "1 - Immediate",
          "customer": "Department of Health WA",
          "currentOpportunity": "DHW - M365 Copilot Adoption service",
          "offerBucket": "Copilot Pilot/Adoption/Rollout",
          "stage": "05-Proposal",
          "amount": 36493,
          "probability": 0.5,
          "weightedAmount": 18246.5,
          "closeDate": "30/09/2026",
          "proposedAnnuityOffer": "Copilot Adoption & Protection Capacity → Managed Copilot Adoption",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Copilot Shield; Purview/DLP tuning; access and sharing controls; shadow-AI monitoring; adoption and value telemetry",
          "nextMove": "Attach security before rollout; position recurring adoption, data protection and value cadence.",
          "opportunityId": "006Mo00000mKNjDIAW"
        },
        {
          "priority": "1 - Immediate",
          "customer": "Curtin University",
          "currentOpportunity": "Curtin University - Copilot Studio Gov & Agent Prototype",
          "offerBucket": "Copilot Studio/Agent",
          "stage": "05-Proposal",
          "amount": 27000,
          "probability": 0.5,
          "weightedAmount": 13500,
          "closeDate": "28/10/2026",
          "proposedAnnuityOffer": "Secure Agent Build Capacity → Managed Agent Operations",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Agent identity and least privilege; DLP; runtime protection; red-teaming; agent inventory, lifecycle and monitoring",
          "nextMove": "Attach agent identity, DLP and red-team assurance; position build-and-maintain capacity.",
          "opportunityId": "006RE00000Nxr6JYAR"
        },
        {
          "priority": "1 - Immediate",
          "customer": "NRW",
          "currentOpportunity": "NRW - m365 copilot pilot service",
          "offerBucket": "Copilot Pilot/Adoption/Rollout",
          "stage": "05-Proposal",
          "amount": 25130,
          "probability": 0.5,
          "weightedAmount": 12565,
          "closeDate": "01/10/2026",
          "proposedAnnuityOffer": "Copilot Adoption & Protection Capacity → Managed Copilot Adoption",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Copilot Shield; Purview/DLP tuning; access and sharing controls; shadow-AI monitoring; adoption and value telemetry",
          "nextMove": "Attach security before rollout; position recurring adoption, data protection and value cadence.",
          "opportunityId": "006Mo00000h7PddIAE"
        },
        {
          "priority": "1 - Immediate",
          "customer": "29 Metals / Golden Grove Operations",
          "currentOpportunity": "Golden Grove Operations - Copilot Pilot (29 Metals)",
          "offerBucket": "Copilot Pilot/Adoption/Rollout",
          "stage": "06-Negotiation",
          "amount": 19301.5,
          "probability": 0.8,
          "weightedAmount": 15441.2,
          "closeDate": "04/09/2026",
          "proposedAnnuityOffer": "Copilot Adoption & Protection Capacity → Managed Copilot Adoption",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Copilot Shield; Purview/DLP tuning; access and sharing controls; shadow-AI monitoring; adoption and value telemetry",
          "nextMove": "Attach security before rollout; position recurring adoption, data protection and value cadence.",
          "opportunityId": "006RE00000K1toXYAR"
        },
        {
          "priority": "2 - Active",
          "customer": "NRW",
          "currentOpportunity": "NRW - power platform & copilot studio governance",
          "offerBucket": "Copilot Studio/Agent",
          "stage": "05-Proposal",
          "amount": 20414,
          "probability": 0.5,
          "weightedAmount": 10207,
          "closeDate": "01/10/2026",
          "proposedAnnuityOffer": "Secure Agent Build Capacity → Managed Agent Operations",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Agent identity and least privilege; DLP; runtime protection; red-teaming; agent inventory, lifecycle and monitoring",
          "nextMove": "Attach agent identity, DLP and red-team assurance; position build-and-maintain capacity.",
          "opportunityId": "006Mo00000jqaK1IAI"
        },
        {
          "priority": "2 - Active",
          "customer": "Curtin University",
          "currentOpportunity": "Curtin University Copilot Readiness project",
          "offerBucket": "Copilot Readiness",
          "stage": "05-Proposal",
          "amount": 7645,
          "probability": 0.5,
          "weightedAmount": 3822.5,
          "closeDate": "28/10/2026",
          "proposedAnnuityOffer": "Copilot Readiness & Security Entitlement",
          "vehiclePath": "Entitled Drawdown",
          "securityToAttach": "Oversharing and permissions review; Purview classification/DLP; Copilot Shield remediation pathway; identity and governance baseline",
          "nextMove": "Use findings to scope Copilot Shield or Purview remediation and an annual re-baseline entitlement.",
          "opportunityId": "006RE00000Lo8azYAB"
        },
        {
          "priority": "2 - Active",
          "customer": "NRW",
          "currentOpportunity": "NRW - Copilot readiness",
          "offerBucket": "Copilot Readiness",
          "stage": "05-Proposal",
          "amount": 5130,
          "probability": 0.5,
          "weightedAmount": 2565,
          "closeDate": "01/10/2026",
          "proposedAnnuityOffer": "Copilot Readiness & Security Entitlement",
          "vehiclePath": "Entitled Drawdown",
          "securityToAttach": "Oversharing and permissions review; Purview classification/DLP; Copilot Shield remediation pathway; identity and governance baseline",
          "nextMove": "Use findings to scope Copilot Shield or Purview remediation and an annual re-baseline entitlement.",
          "opportunityId": "006RE00000VGVqnYAH"
        },
        {
          "priority": "3 - Develop",
          "customer": "Programmed",
          "currentOpportunity": "Programmed - Copilot Studio Governance",
          "offerBucket": "Copilot Studio/Agent",
          "stage": "03-Qualify",
          "amount": 9000,
          "probability": 0.2,
          "weightedAmount": 1800,
          "closeDate": "01/12/2026",
          "proposedAnnuityOffer": "Secure Agent Build Capacity → Managed Agent Operations",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Agent identity and least privilege; DLP; runtime protection; red-teaming; agent inventory, lifecycle and monitoring",
          "nextMove": "Attach agent identity, DLP and red-team assurance; position build-and-maintain capacity.",
          "opportunityId": "006Mo00000n65LoIAI"
        },
        {
          "priority": "3 - Develop",
          "customer": "IGO",
          "currentOpportunity": "IGO - AI workshops (Microsoft funded)",
          "offerBucket": "AI Envisioning/Use Case",
          "stage": "03-Qualify",
          "amount": 6250,
          "probability": 0.2,
          "weightedAmount": 1250,
          "closeDate": "01/11/2026",
          "proposedAnnuityOffer": "AI Opportunity & Assurance Entitlement → AI Value Office",
          "vehiclePath": "Drawdown → Capacity",
          "securityToAttach": "Risk and data classification; privacy/regulatory screening; threat modelling; RAI and red-team pathway",
          "nextMove": "Add security risk scoring to use-case triage; convert the pipeline into quarterly AI Value Office capacity.",
          "opportunityId": "006RE00000U8aJZYAZ"
        },
        {
          "priority": "3 - Develop",
          "customer": "Perth Airport",
          "currentOpportunity": "Perth Airport - MS Foundry Agent Smith",
          "offerBucket": "Foundry/Landing Zone",
          "stage": "04-Develop",
          "amount": 5600,
          "probability": 0.3,
          "weightedAmount": 1680,
          "closeDate": "30/09/2026",
          "proposedAnnuityOffer": "Foundry Care & Security → Managed AI Platform & Security",
          "vehiclePath": "Drawdown → Standing",
          "securityToAttach": "Defender for AI Services; Purview DSPM for AI; Entra Agent ID; Sentinel/MXDR; AI FinOps; guardrail and red-team review",
          "nextMove": "Qualify who operates and secures the platform after handover; add Defender/Purview baseline.",
          "opportunityId": "006Mo00000lxkjhIAA"
        },
        {
          "priority": "3 - Develop",
          "customer": "Greatland",
          "currentOpportunity": "Greatland - Copilot+Power Envisioning & PoC",
          "offerBucket": "AI Envisioning/Use Case",
          "stage": "03-Qualify",
          "amount": 3750,
          "probability": 0.2,
          "weightedAmount": 750,
          "closeDate": "30/09/2026",
          "proposedAnnuityOffer": "AI Opportunity & Assurance Entitlement → AI Value Office",
          "vehiclePath": "Drawdown → Capacity",
          "securityToAttach": "Risk and data classification; privacy/regulatory screening; threat modelling; RAI and red-team pathway",
          "nextMove": "Add security risk scoring to use-case triage; convert the pipeline into quarterly AI Value Office capacity.",
          "opportunityId": "006RE00000UYXDIYA5"
        },
        {
          "priority": "3 - Develop",
          "customer": "Leichhardt",
          "currentOpportunity": "Leichhardt - copilot readiness",
          "offerBucket": "Copilot Readiness",
          "stage": "04-Develop",
          "amount": 3000,
          "probability": 0.3,
          "weightedAmount": 900,
          "closeDate": "01/10/2026",
          "proposedAnnuityOffer": "Copilot Readiness & Security Entitlement",
          "vehiclePath": "Entitled Drawdown",
          "securityToAttach": "Oversharing and permissions review; Purview classification/DLP; Copilot Shield remediation pathway; identity and governance baseline",
          "nextMove": "Use findings to scope Copilot Shield or Purview remediation and an annual re-baseline entitlement.",
          "opportunityId": "006Mo00000jPO8TIAW"
        },
        {
          "priority": "3 - Develop",
          "customer": "Genesis",
          "currentOpportunity": "Genesis - AI envisioning",
          "offerBucket": "AI Envisioning/Use Case",
          "stage": "04-Develop",
          "amount": 3000,
          "probability": 0.3,
          "weightedAmount": 900,
          "closeDate": "01/10/2026",
          "proposedAnnuityOffer": "AI Opportunity & Assurance Entitlement → AI Value Office",
          "vehiclePath": "Drawdown → Capacity",
          "securityToAttach": "Risk and data classification; privacy/regulatory screening; threat modelling; RAI and red-team pathway",
          "nextMove": "Add security risk scoring to use-case triage; convert the pipeline into quarterly AI Value Office capacity.",
          "opportunityId": "006Mo00000ibCbyIAE"
        },
        {
          "priority": "3 - Develop",
          "customer": "University of Notre Dame Australia",
          "currentOpportunity": "Copilot Studio Value Discovery - UNDA",
          "offerBucket": "Copilot Studio/Agent",
          "stage": "03-Qualify",
          "amount": 2827.8,
          "probability": 0.2,
          "weightedAmount": 565.56,
          "closeDate": "28/09/2026",
          "proposedAnnuityOffer": "Secure Agent Build Capacity → Managed Agent Operations",
          "vehiclePath": "Capacity → Standing",
          "securityToAttach": "Agent identity and least privilege; DLP; runtime protection; red-teaming; agent inventory, lifecycle and monitoring",
          "nextMove": "Attach agent identity, DLP and red-team assurance; position build-and-maintain capacity.",
          "opportunityId": "006RE00000CXYAUYA5"
        },
        {
          "priority": "3 - Develop",
          "customer": "Perth Airport",
          "currentOpportunity": "Perth Airport_ai agent development - Foundry",
          "offerBucket": "Foundry/Landing Zone",
          "stage": "04-Develop",
          "amount": 2500,
          "probability": 0.3,
          "weightedAmount": 750,
          "closeDate": "16/10/2026",
          "proposedAnnuityOffer": "Foundry Care & Security → Managed AI Platform & Security",
          "vehiclePath": "Drawdown → Standing",
          "securityToAttach": "Defender for AI Services; Purview DSPM for AI; Entra Agent ID; Sentinel/MXDR; AI FinOps; guardrail and red-team review",
          "nextMove": "Qualify who operates and secures the platform after handover; add Defender/Purview baseline.",
          "opportunityId": "006Mo00000mNpZFIA0"
        },
        {
          "priority": "3 - Develop",
          "customer": "Chorus",
          "currentOpportunity": "Chorus - Copilot Readiness Assessment",
          "offerBucket": "Copilot Readiness",
          "stage": "03-Qualify",
          "amount": 2500,
          "probability": 0.2,
          "weightedAmount": 500,
          "closeDate": "22/10/2026",
          "proposedAnnuityOffer": "Copilot Readiness & Security Entitlement",
          "vehiclePath": "Entitled Drawdown",
          "securityToAttach": "Oversharing and permissions review; Purview classification/DLP; Copilot Shield remediation pathway; identity and governance baseline",
          "nextMove": "Use findings to scope Copilot Shield or Purview remediation and an annual re-baseline entitlement.",
          "opportunityId": "006RE00000TtPrVYAV"
        },
        {
          "priority": "3 - Develop",
          "customer": "SBS",
          "currentOpportunity": "SBS / AI Planning",
          "offerBucket": "AI Envisioning/Use Case",
          "stage": "03-Qualify",
          "amount": 1500,
          "probability": 0.2,
          "weightedAmount": 300,
          "closeDate": "30/09/2026",
          "proposedAnnuityOffer": "AI Opportunity & Assurance Entitlement → AI Value Office",
          "vehiclePath": "Drawdown → Capacity",
          "securityToAttach": "Risk and data classification; privacy/regulatory screening; threat modelling; RAI and red-team pathway",
          "nextMove": "Add security risk scoring to use-case triage; convert the pipeline into quarterly AI Value Office capacity.",
          "opportunityId": "006RE00000R6lcdYAB"
        }
      ]
    }
  },
  "playbook": {
    "Foundry/Landing Zone": {
      "offerBucket": "Foundry/Landing Zone",
      "proposedAnnuityOffer": "Foundry Care & Security → Managed AI Platform & Security",
      "vehiclePath": "Drawdown → Standing",
      "securityToAttach": "Defender for AI Services; Purview DSPM for AI; Entra Agent ID; Sentinel/MXDR; AI FinOps; guardrail and red-team review",
      "positioning": "Operate, secure and continuously improve the customer’s production AI estate."
    },
    "Copilot Readiness": {
      "offerBucket": "Copilot Readiness",
      "proposedAnnuityOffer": "Copilot Readiness & Security Entitlement",
      "vehiclePath": "Entitled Drawdown",
      "securityToAttach": "Oversharing and permissions review; Purview classification/DLP; Copilot Shield remediation pathway; identity and governance baseline",
      "positioning": "Turn readiness findings into funded remediation and an annual governance rhythm."
    },
    "Copilot Pilot/Adoption/Rollout": {
      "offerBucket": "Copilot Pilot/Adoption/Rollout",
      "proposedAnnuityOffer": "Copilot Adoption & Protection Capacity → Managed Copilot Adoption",
      "vehiclePath": "Capacity → Standing",
      "securityToAttach": "Copilot Shield; Purview/DLP tuning; access and sharing controls; shadow-AI monitoring; adoption and value telemetry",
      "positioning": "Sustain adoption, value, information protection and policy beyond deployment."
    },
    "AI Envisioning/Use Case": {
      "offerBucket": "AI Envisioning/Use Case",
      "proposedAnnuityOffer": "AI Opportunity & Assurance Entitlement → AI Value Office",
      "vehiclePath": "Drawdown → Capacity",
      "securityToAttach": "Risk and data classification; privacy/regulatory screening; threat modelling; RAI and red-team pathway",
      "positioning": "Make use-case prioritisation, risk and investment governance a recurring cycle."
    },
    "Copilot Studio/Agent": {
      "offerBucket": "Copilot Studio/Agent",
      "proposedAnnuityOffer": "Secure Agent Build Capacity → Managed Agent Operations",
      "vehiclePath": "Capacity → Standing",
      "securityToAttach": "Agent identity and least privilege; DLP; runtime protection; red-teaming; agent inventory, lifecycle and monitoring",
      "positioning": "Build, assure and maintain agents as a governed production estate."
    }
  }
});
  const NATIONAL = nationalData || Object.freeze({ snapshotDate: '', validRecords: 0, unresolvedRecords: 0, limitations: [], records: [] });
  const SUPPORTED_STATES = Object.freeze(['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']);
  const VEHICLE_NAMES = Object.freeze({
    Drawdown: 'Entitled Drawdown',
    Capacity: 'Committed Capacity',
    Standing: 'Standing Services',
    'Entitled Drawdown': 'Entitled Drawdown',
    'Committed Capacity': 'Committed Capacity',
    'Standing Service': 'Standing Services',
    'Standing Services': 'Standing Services'
  });

  function normaliseState(value) {
    return String(value || '').replace(/^~\s*/, '').trim().toUpperCase();
  }

  function normaliseVehiclePath(value) {
    return String(value || '')
      .replace(/\s*(?:->|→)\s*/g, ' → ')
      .replace(/Entitled Drawdown/g, 'Drawdown')
      .replace(/Committed Capacity/g, 'Capacity')
      .replace(/Standing Services?/g, 'Standing');
  }

  function priorityLabel(value) {
    const labels = { 1: '1 - Immediate', 2: '2 - Active', 3: '3 - Develop' };
    return labels[Number(value)] || String(value || 'Data check');
  }

  const exactByKey = new Map();
  Object.entries(DATA.states).forEach(([state, statePlan]) => {
    statePlan.opportunities.forEach(plan => exactByKey.set(`${state}|${plan.opportunityId}`, Object.freeze({
      ...plan,
      state,
      sourceType: 'workbook',
      securityAttachStatus: 'Workbook whitespace',
      existingSecurityEvidence: 'No identifiable security line item in the supplied workbook dataset.',
      relatedAccountOpportunity: 'Not supplied',
      recommendationBasis: 'Curated state workbook recommendation.'
    })));
  });

  NATIONAL.records.forEach(record => {
    const state = normaliseState(record.state);
    const key = `${state}|${record.opportunityId}`;
    const curated = exactByKey.get(key);
    exactByKey.set(key, Object.freeze({
      ...(curated || {}),
      priority: priorityLabel(record.priority),
      customer: record.customer,
      currentOpportunity: record.currentOpportunity,
      offerBucket: record.offerBucket,
      stage: record.stage,
      amount: record.amount ?? curated?.amount ?? null,
      probability: record.probability ?? curated?.probability ?? null,
      weightedAmount: record.weightedAmount ?? curated?.weightedAmount ?? null,
      closeDate: record.closeDate || curated?.closeDate || '',
      proposedAnnuityOffer: curated?.proposedAnnuityOffer || record.proposedAnnuityOffer,
      vehiclePath: curated?.vehiclePath || normaliseVehiclePath(record.vehiclePath),
      securityToAttach: curated?.securityToAttach || record.securityToAttach,
      nextMove: curated?.nextMove || record.nextMove,
      opportunityId: record.opportunityId,
      state,
      sourceType: curated ? 'workbook+salesforce' : 'salesforce',
      securityAttachStatus: record.securityAttachStatus,
      existingSecurityEvidence: record.existingSecurityEvidence,
      relatedAccountOpportunity: record.relatedAccountOpportunity,
      recommendationBasis: record.recommendationBasis
    }));
  });

  function stateEvidenceLabel(records, workbook) {
    const counts = records.reduce((result, record) => {
      const status = record.securityAttachStatus || 'Unknown';
      result[status] = (result[status] || 0) + 1;
      return result;
    }, {});
    const parts = [];
    if (counts.Existing) parts.push(`${counts.Existing} existing`);
    if (counts['Potential related coverage']) parts.push(`${counts['Potential related coverage']} potential`);
    if (counts.Whitespace) parts.push(`${counts.Whitespace} whitespace`);
    if (counts.Unknown) parts.push(`${counts.Unknown} unknown`);
    if (parts.length) return parts.join(' · ');
    return workbook ? workbook.securityAttachWhitespace : 'No resolved rows';
  }

  const STATE_PLANS = Object.freeze(Object.fromEntries(SUPPORTED_STATES.map(state => {
    const workbook = DATA.states[state] || null;
    const resolvedRecords = NATIONAL.records.filter(record => normaliseState(record.state) === state);
    const exactRecords = [...exactByKey.values()].filter(record => record.state === state);
    const namedPipelineAmount = exactRecords.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
    const weightedPipeline = exactRecords.reduce((sum, record) => sum + (Number(record.weightedAmount) || 0), 0);
    return [state, Object.freeze({
      namedOpportunities: exactRecords.length,
      namedPipelineAmount,
      weightedPipeline,
      securityAttachWhitespace: stateEvidenceLabel(resolvedRecords, workbook),
      resolvedSalesforceRows: resolvedRecords.length,
      unresolvedNationalRows: NATIONAL.unresolvedRecords,
      source: workbook
        ? `${workbook.source} Joined to the validated national Salesforce extraction where Opportunity IDs matched.`
        : NATIONAL.source,
      valueDefinition: workbook?.valueDefinition || 'Amount is the Salesforce opportunity Amount field; weighted amount is Amount multiplied by Probability.',
      scope: workbook
        ? `${workbook.scope} Additional named Salesforce rows are included where Account BillingState resolved to this state.`
        : resolvedRecords.length
          ? `Includes every supplied named open AI-signal opportunity whose Account BillingState resolved to ${state}.`
          : `No supplied named open AI-signal opportunity resolved to ${state} through Account BillingState.`,
      proposedFieldBasis: 'Annuity offer, vehicle, security attach and next move are recommendations, not Salesforce fields.',
      dataQuality: `Owner, NextStep, line items and linked-opportunity relationships were unavailable. Security status remains Unknown unless the current opportunity supplied evidence. ${NATIONAL.unresolvedRecords} national AI-signal opportunities remain state-unresolved.`,
      coverageKind: workbook ? 'curated+salesforce' : resolvedRecords.length ? 'salesforce' : 'playbook-only'
    })];
  })));

  function offerBucketFor(record) {
    const text = [record && record.offering, record && record.opportunity, record && record.sourceCapability]
      .filter(Boolean).join(' ').toLowerCase();
    if (/foundry|landing zone/.test(text)) return 'Foundry/Landing Zone';
    if (/copilot studio|agentic|\bagent\b/.test(text)) return 'Copilot Studio/Agent';
    if (/readiness|assessment/.test(text)) return 'Copilot Readiness';
    if (/pilot|adoption|rollout|deployment|enablement|licensing/.test(text)) return 'Copilot Pilot/Adoption/Rollout';
    if (/envision|use[- ]case|workshop|\bpoc\b|planning/.test(text)) return 'AI Envisioning/Use Case';
    return '';
  }

  function annuityJourney(vehiclePath) {
    return String(vehiclePath || '').split(/\s*→\s*/).filter(Boolean).map(step => ({
      shorthand: step,
      vehicle: VEHICLE_NAMES[step] || step
    }));
  }

  function planFor(record) {
    const state = normaliseState(record && (record.region || record.State));
    if (!SUPPORTED_STATES.includes(state)) {
      return Object.freeze({ coverage: 'unavailable', state, supportedStates: SUPPORTED_STATES, proposal: null, facts: null });
    }
    const statePlan = STATE_PLANS[state];
    const exact = record && record.id ? exactByKey.get(`${state}|${record.id}`) : null;
    if (exact) {
      return Object.freeze({
        coverage: 'opportunity',
        state,
        statePlan,
        offerBucket: exact.offerBucket,
        facts: exact,
        proposal: Object.freeze({
          proposedAnnuityOffer: exact.proposedAnnuityOffer,
          vehiclePath: exact.vehiclePath,
          journey: annuityJourney(exact.vehiclePath),
          securityToAttach: exact.securityToAttach,
          positioning: DATA.playbook[exact.offerBucket]?.positioning || '',
          nextMove: exact.nextMove
        })
      });
    }
    const offerBucket = offerBucketFor(record);
    const play = DATA.playbook[offerBucket];
    if (play) {
      return Object.freeze({
        coverage: 'playbook',
        state,
        statePlan,
        offerBucket,
        facts: null,
        proposal: Object.freeze({ ...play, journey: annuityJourney(play.vehiclePath), nextMove: play.positioning })
      });
    }
    return Object.freeze({ coverage: 'state-only', state, statePlan, offerBucket: '', proposal: null, facts: null });
  }

  function coverageLabel(plan) {
    if (!plan || plan.coverage === 'unavailable') return 'No state plan';
    if (plan.coverage === 'opportunity') return `${plan.state} opportunity plan`;
    if (plan.coverage === 'playbook') return `${plan.state} playbook`;
    return `${plan.state} plan — no match`;
  }

  return Object.freeze({
    DATA,
    NATIONAL,
    STATE_PLANS,
    SUPPORTED_STATES,
    VEHICLE_NAMES,
    annuityJourney,
    coverageLabel,
    normaliseState,
    offerBucketFor,
    planFor
  });
});
