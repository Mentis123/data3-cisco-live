# D3 Enterprise Agent Governance Framework

## Complete Technical Documentation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Framework Overview](#framework-overview)
3. [The Five Governance Pillars](#the-five-governance-pillars)
4. [Three-Layer Architecture](#three-layer-architecture)
   - [Platform Layer](#platform-layer-the-shell)
   - [Data Layer](#data-layer-the-physics)
   - [Agent Layer](#agent-layer-the-brain)
5. [AI Services Lifecycle](#ai-services-lifecycle)
6. [Technology Reference](#technology-reference)
   - [Microsoft Entra ID](#microsoft-entra-id)
   - [Microsoft Purview](#microsoft-purview)
   - [Azure Infrastructure](#azure-infrastructure)
   - [Power Platform](#power-platform)
   - [Microsoft Copilot Studio](#microsoft-copilot-studio)
   - [Azure AI Foundry](#azure-ai-foundry)
   - <a href="services_map.html" target="_blank">AI Services</a>
7. [Control Matrix](#control-matrix)
8. [Implementation Guidance](#implementation-guidance)
9. [Security Scenarios](#security-scenarios)

---

## Executive Summary

The **D3 Enterprise Agent Governance Framework** provides a comprehensive, defense-in-depth approach to governing AI agents across the Microsoft ecosystem. As organizations rapidly adopt AI agents and copilots, this framework ensures they operate within defined boundaries while maintaining full transparency, compliance, and security.

### Key Principles

| Principle | Description |
|-----------|-------------|
| **Defense in Depth** | Multiple layers of control, each applying all five governance pillars |
| **Least Privilege** | User context enforcement with Row-Level and Field-Level Security |
| **Audit Everything** | Comprehensive logging and observability across all layers |
| **Shift Left** | Early validation and risk assessment before production deployment |
| **Prevent by Default** | Block first, approve later approach to agent deployment |
| **Transparency** | Full observability through dashboards, logging, and audit trails |

### Framework Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT LAYER                                          "The Brain"   │
│  Copilot Studio, Custom Agents, Foundry Agent Service               │
├─────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                         "The Physics"   │
│  Dynamics 365, Dataverse, Power Platform, Foundry IQ                │
├─────────────────────────────────────────────────────────────────────┤
│  PLATFORM LAYER                                       "The Shell"   │
│  Azure, Entra ID, Purview, Foundry Control Plane                    │
└─────────────────────────────────────────────────────────────────────┘
        │            │            │             │            │
   GUARDRAILS   GROUNDING   CONFIDENCE   OBSERVABILITY  EVALUATION
     (Block)     (Ground)    (Decide)      (Monitor)     (Assess)
```

---

## Framework Overview

The D3 Governance Framework is built on two foundational concepts:

1. **Five Governance Pillars** - Cross-cutting concerns that apply at every layer
2. **Three-Layer Architecture** - Hierarchical control structure from infrastructure to agents

Each layer implements controls that map to one or more pillars, creating a comprehensive governance mesh that ensures no AI agent can operate outside defined boundaries.

---

## The Five Governance Pillars

The five pillars represent the fundamental questions every organization must answer when deploying AI agents:

### 1. Guardrails

| Property | Value |
|----------|-------|
| **Icon** | Lock |
| **Color** | Orange (#f97316) |
| **Purpose** | Define what is allowed vs. disallowed |
| **Subtitle** | Define what agents can & cannot do |

**Description**: Guardrails establish the boundaries within which agents can operate. This includes geographic regions, network boundaries, permitted topics, and blocked actions. They serve as the first line of defense, blocking unauthorized access and enforcing hard limits.

**Key Controls**:
- Topic restrictions & blocked content
- Action scope limitations
- Data classification boundaries
- Human-in-the-loop requirements

**Key Questions Answered**:
- What regions/networks can agents access?
- What topics are off-limits?
- What actions require human approval?
- What data is completely inaccessible?

---

### 2. Grounding

| Property | Value |
|----------|-------|
| **Icon** | Database |
| **Color** | Green (#22c55e) |
| **Purpose** | Ensure answers are based on trusted data |
| **Subtitle** | Anchor responses to authoritative sources |

**Description**: Grounding ensures that AI agents base their responses on verified, authoritative data sources rather than hallucinating or using untrusted information. This pillar governs RAG (Retrieval-Augmented Generation) implementations, citation requirements, and data source validation.

**Key Controls**:
- RAG with vetted knowledge bases
- Citation & source attribution
- Dataverse security inheritance
- Hallucination prevention

**Key Questions Answered**:
- What data sources are trusted?
- How do we ensure citation accuracy?
- How do we prevent hallucination?
- What knowledge bases are authorized?

---

### 3. Confidence

| Property | Value |
|----------|-------|
| **Icon** | Scale |
| **Color** | Purple (#a855f7) |
| **Purpose** | Define thresholds for autonomous action |
| **Subtitle** | Set thresholds for autonomous action |

**Description**: Confidence determines when an agent can take autonomous action versus when human approval is required. This pillar establishes "Draft Only" vs. "Auto-Apply" modes based on risk assessment and certainty levels.

**Key Controls**:
- Confidence scoring per action
- Escalation triggers & workflows
- Approval gates for high-risk ops
- Fallback to human review

**Key Questions Answered**:
- When can agents act autonomously?
- What confidence threshold requires approval?
- Which operations are always manual?
- How do we measure decision certainty?

---

### 4. Observability

| Property | Value |
|----------|-------|
| **Icon** | Eye |
| **Color** | Cyan (#06b6d4) |
| **Purpose** | Comprehensive logging and monitoring |
| **Subtitle** | Full visibility into agent behavior |

**Description**: Observability ensures complete visibility into agent behavior. Every prompt, thought process, action, and outcome must be logged for audit trails, debugging, compliance, and security forensics.

**Key Controls**:
- Conversation & action logging
- Real-time dashboards & alerts
- Audit trails for compliance
- Performance & cost tracking

**Key Questions Answered**:
- What did the agent see and think?
- What actions were taken and why?
- Who accessed what data and when?
- How do we detect anomalous behavior?

---

### 5. Evaluation

| Property | Value |
|----------|-------|
| **Icon** | Activity |
| **Color** | Amber (#f59e0b) |
| **Purpose** | Risk vs. value assessment |
| **Subtitle** | Continuous assessment of agent value |

**Description**: Evaluation provides ongoing assessment of agent deployments, measuring the "blast radius" of potential failures, value delivered, and risks introduced. This pillar enables informed decisions about agent deployment and operation.

**Key Controls**:
- Red team testing & adversarial probes
- Quality scoring & benchmarking
- Business impact measurement
- Continuous improvement loops

**Key Questions Answered**:
- What is the potential blast radius?
- Does value justify the risk?
- How do we measure agent effectiveness?
- When should agents be retired?

---

## Three-Layer Architecture

The framework implements a three-layer governance stack, with each layer building on the foundations provided by the layers below.

---

### Platform Layer ("The Shell")

| Property | Value |
|----------|-------|
| **Layer ID** | `platform` |
| **Color Theme** | Indigo (#6366f1) |
| **Icon** | Server |
| **Subtitle** | Infrastructure & Security |
| **Technologies** | Azure, <a href="https://azureperiodic.data3.com/Entra-ID" target="_blank">Entra ID</a>, <a href="https://azureperiodic.data3.com/Purview" target="_blank">Purview</a>, Foundry Control Plane |

**Definition**: The non-negotiable rules for identity, compliance, and networking. This layer establishes the foundational security posture upon which all other governance is built.

**Key Components**:
- Azure cloud infrastructure
- Entra ID & Conditional Access
- Purview compliance & DLP
- Private Link & network security

#### Controls

##### 1.1 Identity & Access (<a href="https://azureperiodic.data3.com/Entra-ID" target="_blank">Entra ID</a> <a href="https://azureperiodic.data3.com/Conditional-Access" target="_blank">Conditional Access</a>)

| Bullet | Pillar |
|--------|--------|
| Conditional Access policies specific to "Microsoft Copilot" app | Guardrails |
| Require compliant device for agent access | Guardrails |
| MFA enforced for sensitive agent operations | Guardrails |
| Sign-in logs correlated with agent activity | Observability |

##### 1.2 Data Classification (<a href="https://azureperiodic.data3.com/Purview" target="_blank">Purview</a> AI Hub)

| Bullet | Pillar |
|--------|--------|
| Sensitivity Labels follow data everywhere | Guardrails |
| "Confidential" docs blocked from unauthorized summary | Guardrails |
| Clearance-based access control on AI features | Confidence |
| Classification coverage score tracked weekly | Evaluation |

##### 1.3 Network Security (<a href="https://azureperiodic.data3.com/Private-Link" target="_blank">Private Link</a> / <a href="https://azureperiodic.data3.com/Virtual-Network" target="_blank">vNET</a>)

| Bullet | Pillar |
|--------|--------|
| <a href="https://azureperiodic.data3.com/Azure-OpenAI" target="_blank">Azure OpenAI</a> resources behind <a href="https://azureperiodic.data3.com/Private-Link" target="_blank">Private Endpoints</a> | Guardrails |
| No public internet exposure for AI services | Guardrails |
| <a href="https://azureperiodic.data3.com/Virtual-Network" target="_blank">vNET</a> integration ensures data stays in boundary | Guardrails |
| Network flow logs captured for forensics | Observability |

##### 1.4 Endpoint DLP (<a href="https://azureperiodic.data3.com/Purview" target="_blank">Purview</a> DLP)

| Bullet | Pillar |
|--------|--------|
| Block copy/paste of sensitive data to public LLMs | Guardrails |
| ChatGPT web and similar services on deny list | Guardrails |
| User coaching notifications for policy violations | Confidence |
| DLP incident reports fed to compliance dashboard | Observability |

##### 1.5 AI Gateway (Foundry Control Plane)

| Bullet | Pillar |
|--------|--------|
| Centralized AI gateway for all model traffic | Guardrails |
| Agent identity management via Entra integration | Guardrails |
| <a href="https://azureperiodic.data3.com/Policy" target="_blank">Azure Policy</a> enforcement at gateway level | Guardrails |
| AI red teaming integration for threat assessment | Evaluation |

##### 1.6 Resource & Cost Governance (Foundry Resource Management)

| Bullet | Pillar |
|--------|--------|
| Shared quota tools across AI projects | Guardrails |
| Budget alerts and cost threshold enforcement | Confidence |
| <a href="https://azureperiodic.data3.com/Azure-Resource-Manager" target="_blank">ARM</a>/<a href="https://azureperiodic.data3.com/bicep" target="_blank">Bicep</a>/Terraform deployment templates | Grounding |
| <a href="https://azureperiodic.data3.com/Cost-Management" target="_blank">Cost</a> & throughput monitoring dashboards | Observability |

---

### Data Layer ("The Physics")

| Property | Value |
|----------|-------|
| **Layer ID** | `app` |
| **Color Theme** | Emerald (#34d399) |
| **Icon** | Database |
| **Subtitle** | Data & Business Logic |
| **Technologies** | Dynamics 365, Dataverse, Power Platform, Foundry IQ |

**Definition**: Defines business logic, data security models, and environment boundaries. This layer translates platform-level security into application-specific controls.

**Key Components**:
- Dataverse & Power Platform
- Foundry IQ knowledge bases
- Row & Field Level Security
- ALM pipelines & environments

#### Controls

##### 2.1 Data Security (Dataverse Security Roles)

| Bullet | Pillar |
|--------|--------|
| Agents run in "User Context" mode only | Guardrails |
| Row Level Security (RLS) inheritance enforced | Guardrails |
| Field Level Security masks sensitive columns | Guardrails |
| Permission violations logged for review | Observability |

##### 2.2 Environment Strategy (Env Routing & PPAC)

| Bullet | Pillar |
|--------|--------|
| Route makers to Personal Dev Environments | Guardrails |
| Block agent creation in "Default" environment | Guardrails |
| Assess environment sprawl and consolidation | Evaluation |
| Track environment provisioning activity | Observability |

##### 2.3 DLP for GenAI (Power Platform DLP)

| Bullet | Pillar |
|--------|--------|
| "HTTP with Entra" moved to Business group | Guardrails |
| Block standard HTTP connector usage | Guardrails |
| Enable "Block Cross-Tenant" isolation | Guardrails |
| DLP violation alerts sent to SOC team | Observability |

##### 2.4 ALM Pipelines (Power Pipelines)

| Bullet | Pillar |
|--------|--------|
| Dev → Test → Prod promotion workflow | Guardrails |
| Approval gates require IT Admin sign-off | Confidence |
| Pre-deployment risk assessment required | Evaluation |
| Full pipeline audit trail in <a href="https://azureperiodic.data3.com/DevOps" target="_blank">DevOps</a> | Observability |

##### 2.5 Knowledge Grounding (Foundry IQ)

| Bullet | Pillar |
|--------|--------|
| One API for all RAG workflows | Grounding |
| Agentic retrieval respects user permissions | Guardrails |
| Data classification enforced at retrieval time | Guardrails |
| Index coverage and quality metrics tracked | Evaluation |

##### 2.6 Tool Governance (Foundry Tools)

| Bullet | Pillar |
|--------|--------|
| 1,400+ pre-built connections with full auth | Grounding |
| MCP tool protocol compliance required | Guardrails |
| Block unverified custom tool deployment | Guardrails |
| Tool invocation logging sent to SOC | Observability |

---

### Agent Layer ("The Brain")

| Property | Value |
|----------|-------|
| **Layer ID** | `agent` |
| **Color Theme** | Sky (#38bdf8) |
| **Icon** | Bot |
| **Subtitle** | AI Agent Runtime |
| **Technologies** | Copilot Studio, Custom Agents, Foundry Agent Service |

**Definition**: Controls agent behavior, inventory, and what they are allowed to do with the systems below. This is where AI-specific governance is applied.

**Key Components**:
- Copilot Studio agents
- Foundry Agent Service
- Custom agent deployments
- Model governance & versioning

#### Controls

##### 3.1 Inventory & Quarantine (M365 Integrated Apps)

| Bullet | Pillar |
|--------|--------|
| Central registry to view all deployed agents | Observability |
| Block publishing of unverified agents | Guardrails |
| "Switch Off" capability for instant agent termination | Guardrails |
| Risk scoring before production deployment | Evaluation |

##### 3.2 GenAI Moderation (Copilot Studio Settings)

| Bullet | Pillar |
|--------|--------|
| Content Moderation set to "High" threshold | Guardrails |
| "Use only uploaded data" to prevent hallucination | Grounding |
| Draft-only mode for sensitive operations | Confidence |
| Log all moderation decisions for audit | Observability |

##### 3.3 Authentication Mode (Azure AD v2)

| Bullet | Pillar |
|--------|--------|
| Force OAuth2 for all agent connections | Guardrails |
| Disable "No Auth" and "Manual" options | Guardrails |
| Identity propagation ensures user context flows | Guardrails |
| Track authentication events in <a href="https://azureperiodic.data3.com/App-Insights" target="_blank">App Insights</a> | Observability |

##### 3.4 Topic Management (System Topics)

| Bullet | Pillar |
|--------|--------|
| Hard-coded redirection for sensitive keywords | Guardrails |
| "Layoffs" triggers → HR Contact escalation | Confidence |
| Evaluate topic coverage for blind spots | Evaluation |
| Monitor trigger frequency and patterns | Observability |

##### 3.5 Agent Service Controls (Foundry Agent Service)

| Bullet | Pillar |
|--------|--------|
| Declarative agents enforce low-code governance | Guardrails |
| Multi-agent workflow orchestration with controls | Confidence |
| Built-in memory with conversation boundaries | Grounding |
| Channel integration audit trail | Observability |

##### 3.6 Model Governance (Foundry Models)

| Bullet | Pillar |
|--------|--------|
| Access restricted to 11,000+ vetted models only | Guardrails |
| Quality, safety & security evaluations required | Evaluation |
| Intelligent model routing for cost/performance | Confidence |
| Model usage tracing and logging | Observability |

---

## AI Services Lifecycle

Data#3 delivers AI services through a comprehensive 6-phase lifecycle methodology, ensuring secure and governed deployment of enterprise AI agents.

### Phase 1: Discover & Envision

| Property | Value |
|----------|-------|
| **Focus** | Strategy & Opportunity Assessment |
| **Color** | Cyan (#06b6d4) |

**Description**: The foundation phase where AI strategy meets business objectives. This phase identifies high-value use cases and validates organizational readiness for AI adoption.

**Key Activities**:
- AI Strategy & Roadmap Development
- Use Case Identification & Prioritization
- M365 Copilot Readiness Assessment
- ROI & Business Case Development

**Deliverables**: AI Roadmap, Business Case, Readiness Assessment

---

### Phase 2: Prototype & Validate

| Property | Value |
|----------|-------|
| **Focus** | PoC Development & Testing |
| **Color** | Amber (#f59e0b) |

**Description**: Proof of concept development to validate assumptions and demonstrate value before full implementation.

**Key Activities**:
- Proof of Concept Development
- Copilot Studio Prototyping
- Model Experimentation & Tuning
- ROI Validation & Refinement

**Deliverables**: Working PoC, Validated ROI, Go/No-Go Decision

---

### Phase 3: Solution Design

| Property | Value |
|----------|-------|
| **Focus** | Architecture & Planning |
| **Color** | Purple (#a855f7) |

**Description**: Technical architecture and governance framework design. This phase creates the blueprint for secure, compliant AI implementation.

**Key Activities**:
- Technical Architecture Design
- Solution Blueprint & Proposal
- Governance Framework Design
- Security & Compliance Planning

**Deliverables**: Architecture Blueprint, Governance Framework, Security Plan

---

### Phase 4: Build & Deploy

| Property | Value |
|----------|-------|
| **Focus** | Production Implementation |
| **Color** | Green (#22c55e) |

**Description**: Full production development with enterprise-grade security, integration, and deployment pipelines.

**Key Activities**:
- Production Agent Development
- RAG & Knowledge Integration
- Multi-Agent Orchestration
- Security Hardening & Testing

**Deliverables**: Production System, Integrations, CI/CD Pipelines

---

### Phase 5: Adopt & Scale

| Property | Value |
|----------|-------|
| **Focus** | Change Management & Rollout |
| **Color** | Pink (#ec4899) |

**Description**: Organizational change management ensuring successful adoption and preparing for scale across the enterprise.

**Key Activities**:
- Change Management Programs
- User Training & Enablement
- Champion Network Development
- Expansion to New Use Cases

**Deliverables**: OCM Plan, Training Materials, Adoption KPIs

---

### Phase 6: Operate & Optimize

| Property | Value |
|----------|-------|
| **Focus** | Managed Services & MLOps |
| **Color** | Indigo (#6366f1) |

**Description**: Ongoing operations, optimization, and continuous improvement to maximize AI value over time.

**Key Activities**:
- Managed AI Operations (MLOps)
- Performance Tuning & Optimization
- Security & Compliance Audits
- Innovation Pipeline Management

**Deliverables**: MLOps Framework, Analytics Dashboards, Innovation Roadmap

---

## Technology Reference

### <a href="https://azureperiodic.data3.com/Entra-ID" target="_blank">Microsoft Entra ID</a>

**Role in Framework**: Identity foundation for all agent governance

| Control | Implementation |
|---------|----------------|
| <a href="https://azureperiodic.data3.com/Conditional-Access" target="_blank">Conditional Access</a> | Create policies targeting the "Microsoft Copilot" application |
| Device Compliance | Require Intune-enrolled devices for agent access |
| MFA Enforcement | Step-up authentication for sensitive operations |
| Sign-in Correlation | Export logs to <a href="https://azureperiodic.data3.com/Log-Analytics" target="_blank">Log Analytics</a> for agent activity correlation |

**Key Configuration** (*<a href="https://azureperiodic.data3.com/Conditional-Access" target="_blank">Conditional Access</a>*):
```
Conditional Access Policy:
├── Target: Microsoft Copilot App
├── Conditions: All users, All devices
├── Grant: Require compliant device + MFA
└── Session: Sign-in frequency = 1 hour for sensitive agents
```

---

### <a href="https://azureperiodic.data3.com/Purview" target="_blank">Microsoft Purview</a>

**Role in Framework**: Data classification, DLP, and compliance

#### <a href="https://azureperiodic.data3.com/Purview" target="_blank">Purview</a> AI Hub
| Capability | Governance Application |
|------------|----------------------|
| Sensitivity Labels | Auto-apply labels that control AI summarization |
| AI Insights | Monitor how labeled data flows through AI systems |
| Compliance Reports | Weekly classification coverage scoring |

#### <a href="https://azureperiodic.data3.com/Purview" target="_blank">Purview</a> DLP
| Policy Type | Rule |
|-------------|------|
| Endpoint DLP | Block copy/paste to public LLM services |
| Cloud DLP | Prevent upload of "Confidential" documents |
| User Coaching | Display policy tips before violations occur |

**Blocked Services**:
- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)
- Other unauthorized AI services

---

### <a href="https://azureperiodic.data3.com/Virtual-Network" target="_blank">Azure Infrastructure</a>

**Role in Framework**: Network isolation and resource governance

#### Network Security Architecture
```
┌─────────────────────────────────────────┐
│              Virtual Network             │
│  ┌─────────────────────────────────┐    │
│  │    Private Endpoint Subnet      │    │
│  │  ┌───────────┐ ┌───────────┐   │    │
│  │  │Azure AOAI │ │  Storage  │   │    │
│  │  │ Private   │ │  Private  │   │    │
│  │  │ Endpoint  │ │  Endpoint │   │    │
│  │  └───────────┘ └───────────┘   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │       Application Subnet        │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │   AI Gateway (Foundry)    │  │    │
│  │  └───────────────────────────┘  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
         │ NO Public Internet Access
         ▼
    [Private Link Only]
```
*Learn more: <a href="https://azureperiodic.data3.com/Virtual-Network" target="_blank">Virtual Network</a> | <a href="https://azureperiodic.data3.com/Private-Link" target="_blank">Private Link</a>*

#### Resource Governance
| Azure Service | Governance Control |
|---------------|-------------------|
| <a href="https://azureperiodic.data3.com/Policy" target="_blank">Azure Policy</a> | Enforce approved AI resource configurations |
| <a href="https://azureperiodic.data3.com/Cost-Management" target="_blank">Cost Management</a> | Budget alerts at project and tenant level |
| Resource Tags | Track AI resources by project, owner, risk tier |
| <a href="https://azureperiodic.data3.com/Azure-Resource-Manager" target="_blank">ARM Templates</a> | Standardized, compliant deployment patterns |

---

### Power Platform

**Role in Framework**: Business application and environment governance

#### Environment Strategy
```
Environment Hierarchy:
├── Production (Managed)
│   └── Promoted agents only
│   └── IT Admin approval required
│
├── Test/UAT (Managed)
│   └── Pre-production validation
│   └── Risk assessment gate
│
├── Development (Unmanaged)
│   └── Personal dev environments
│   └── Maker sandbox
│
└── Default (BLOCKED)
    └── No agent creation allowed
    └── Auto-route to Personal Dev
```

#### Power Platform DLP Policies
| Connector Group | Policy |
|-----------------|--------|
| Business | HTTP with Entra ID (approved) |
| Non-Business | Standard HTTP (blocked for agents) |
| Blocked | All unauthorized AI connectors |

**Cross-Tenant Isolation**: Enabled to prevent data exfiltration

---

### Microsoft Copilot Studio

**Role in Framework**: Agent development and runtime governance

#### Studio Settings Configuration
| Setting | Value | Rationale |
|---------|-------|-----------|
| Content Moderation | High | Strictest content filtering |
| Knowledge Source | Uploaded only | Prevent external data access |
| Authentication | Azure AD v2 | Force identity propagation |
| Publishing | Require Approval | Block self-publishing |

#### Topic Governance
| Topic Type | Configuration |
|------------|---------------|
| System Topics | Redirect sensitive keywords to human |
| Fallback Topic | Log and escalate unknown queries |
| Starter Prompts | Pre-approved conversation starters only |

**Sensitive Keyword Redirections**:
- "Layoffs" → HR Contact
- "Salary" → HR Portal
- "Termination" → HR Escalation
- "Legal" → Legal Team
- "Confidential" → Security Team

---

### <a href="https://azureperiodic.data3.com/Azure-OpenAI" target="_blank">Azure AI Foundry</a>

**Role in Framework**: Unified AI governance control plane

#### Foundry Control Plane
| Component | Function |
|-----------|----------|
| AI Gateway | Centralized traffic routing for all models |
| Identity | Entra integration for agent identity |
| Policy | <a href="https://azureperiodic.data3.com/Policy" target="_blank">Azure Policy</a> enforcement at AI layer |
| Red Team | Automated security testing integration |

#### Foundry IQ (Knowledge Grounding)
| Capability | Governance Benefit |
|------------|-------------------|
| Unified RAG API | Single point of control for all retrieval |
| Permission Aware | Respects user's data access rights |
| Classification | Enforces sensitivity labels at retrieval |
| Quality Metrics | Tracks grounding accuracy and coverage |

#### Foundry Agent Service
| Feature | Control |
|---------|---------|
| Declarative Agents | Enforce low-code governance patterns |
| Multi-Agent Orchestration | Controlled workflow execution |
| Memory Management | Conversation boundaries enforced |
| Channel Integration | Full audit trail across all channels |

#### Foundry Models
| Governance Control | Implementation |
|-------------------|----------------|
| Model Catalog | 11,000+ vetted models only |
| Safety Evaluations | Required before production use |
| Intelligent Routing | Cost/performance optimization |
| Usage Tracing | Complete model invocation logging |

---

## Control Matrix

Complete mapping of all controls to pillars and layers:

**Legend:** ● = Control applies to pillar | **G** = Guardrails | **Gr** = Grounding | **C** = Confidence | **O** = Observability | **E** = Evaluation

### Platform Layer

| Control | Tool | Guardrails | Grounding | Confidence | Observability | Evaluation |
|---------|------|:----------:|:---------:|:----------:|:-------------:|:----------:|
| Identity & Access | <a href="https://azureperiodic.data3.com/Entra-ID" target="_blank">Entra</a> CA | ● | | | ● | |
| Data Classification | <a href="https://azureperiodic.data3.com/Purview" target="_blank">Purview</a> AI Hub | ● | | ● | | ● |
| Network Security | <a href="https://azureperiodic.data3.com/Private-Link" target="_blank">Private Link</a> | ● | | | ● | |
| Endpoint DLP | <a href="https://azureperiodic.data3.com/Purview" target="_blank">Purview</a> DLP | ● | | ● | ● | |
| AI Gateway | Foundry CP | ● | | | | ● |
| Resource Governance | Foundry RM | ● | ● | ● | ● | |

### Data Layer

| Control | Tool | Guardrails | Grounding | Confidence | Observability | Evaluation |
|---------|------|:----------:|:---------:|:----------:|:-------------:|:----------:|
| Data Security | Dataverse Roles | ● | | | ● | |
| Environment Strategy | PPAC | ● | | | ● | ● |
| DLP for GenAI | PP DLP | ● | | | ● | |
| ALM Pipelines | Power Pipelines | ● | | ● | ● | ● |
| Knowledge Grounding | Foundry IQ | ● | ● | | | ● |
| Tool Governance | Foundry Tools | ● | ● | | ● | |

### Agent Layer

| Control | Tool | Guardrails | Grounding | Confidence | Observability | Evaluation |
|---------|------|:----------:|:---------:|:----------:|:-------------:|:----------:|
| Inventory & Quarantine | M365 Apps | ● | | | ● | ● |
| GenAI Moderation | Studio Settings | ● | ● | ● | ● | |
| Authentication Mode | Azure AD v2 | ● | | | ● | |
| Topic Management | System Topics | ● | | ● | ● | ● |
| Agent Service Controls | Foundry AS | ● | ● | ● | ● | |
| Model Governance | Foundry Models | ● | | ● | ● | ● |

**Legend:** ● = Control applies to pillar | **G** = Guardrails | **Gr** = Grounding | **C** = Confidence | **O** = Observability | **E** = Evaluation

---

## Implementation Guidance

### Phase 1: Foundation (Platform Layer)

1. **Configure <a href="https://azureperiodic.data3.com/Entra-ID" target="_blank">Entra ID</a>**
   - Create <a href="https://azureperiodic.data3.com/Conditional-Access" target="_blank">Conditional Access</a> policies for AI applications
   - Enable MFA for all agent interactions
   - Set up sign-in log export to <a href="https://azureperiodic.data3.com/Log-Analytics" target="_blank">Log Analytics</a>

2. **Deploy Network Security**
   - Create <a href="https://azureperiodic.data3.com/Virtual-Network" target="_blank">virtual networks</a> for AI resources
   - Deploy <a href="https://azureperiodic.data3.com/Private-Link" target="_blank">Private Endpoints</a> for <a href="https://azureperiodic.data3.com/Azure-OpenAI" target="_blank">Azure OpenAI</a>
   - Configure <a href="https://azureperiodic.data3.com/Network-Security-Group" target="_blank">NSG</a> rules to block public access

3. **Enable <a href="https://azureperiodic.data3.com/Purview" target="_blank">Purview</a>**
   - Deploy sensitivity labels across organization
   - Configure DLP policies for public LLM blocking
   - Set up AI Hub monitoring

### Phase 2: Application Controls (Data Layer)

1. **Configure Power Platform**
   - Create DLP policies for AI connectors
   - Set up environment routing rules
   - Block Default environment for agent creation

2. **Establish ALM Pipelines**
   - Create Dev → Test → Prod pipeline
   - Configure approval gates
   - Set up audit logging

3. **Deploy Foundry IQ**
   - Configure RAG with permission awareness
   - Set up classification enforcement
   - Enable quality metrics

### Phase 3: Agent Governance (Agent Layer)

1. **Configure Copilot Studio**
   - Set Content Moderation to High
   - Enable "Use only uploaded data"
   - Configure Azure AD v2 authentication

2. **Set Up Agent Registry**
   - Deploy M365 Integrated Apps inventory
   - Configure publishing approval workflow
   - Enable risk scoring

3. **Deploy Topic Management**
   - Create sensitive keyword redirections
   - Configure fallback escalation
   - Set up monitoring dashboards

---

## Security Scenarios

The framework includes three interactive simulation scenarios that demonstrate defense-in-depth protections:

### Scenario 1: Rogue HR Bot

**Threat**: A well-intentioned HR enthusiast attempts to create a "Salary Helper" agent that could expose confidential compensation data.

**Defense in Depth Response**:

| Step | Layer | Control | Action |
|------|-------|---------|--------|
| 1 | App | Initiation | User 'Bob' attempts to build a 'Salary Helper' agent connected to Dataverse |
| 2 | Platform | Identity & Access | <a href="https://azureperiodic.data3.com/Entra-ID" target="_blank">Entra ID</a> verifies Bob is on a managed laptop. CA Policy allows access to Copilot Studio |
| 3 | App | Environment Strategy | Bob tries to create in 'Default' Env. System auto-routes him to Personal Dev Environment |
| 4 | App | Data Security | Agent attempts to query 'All Salaries'. Dataverse enforces User Context - Bob only sees his own record |
| 5 | Agent | Inventory & Quarantine | Bob clicks 'Publish to Organization'. Integrated Apps policy intercepts - **BLOCKED: Requires IT Admin Approval** |

**Result**: Agent cannot reach production without IT review, and even in development, data access is limited to the maker's own records.

---

### Scenario 2: Data Exfiltration Attempt

**Threat**: A malicious actor attempts to extract confidential customer data through AI agent prompt injection.

**Defense in Depth Response**:

| Step | Layer | Control | Action |
|------|-------|---------|--------|
| 1 | Agent | Initiation | Attacker 'Eve' crafts a prompt injection to extract customer PII via an approved support agent |
| 2 | Agent | GenAI Moderation | Copilot Studio's High moderation setting detects suspicious data extraction patterns - Prompt Flagged for Review |
| 3 | App | Data Classification | <a href="https://azureperiodic.data3.com/Purview" target="_blank">Purview</a> sensitivity labels identify requested data as 'Highly Confidential' - agent blocked from access |
| 4 | Platform | Endpoint DLP | Endpoint DLP detects attempted copy of sensitive data patterns to external destination - **BLOCKED: DLP Policy Violation** |
| 5 | Platform | Observability | SOC team receives automated alert. User session logged for forensic review. Incident created |

**Result**: Multiple layers detect and block the exfiltration attempt, with full audit trail for security investigation.

---

### Scenario 3: Shadow IT Agent

**Threat**: A developer attempts to deploy an unvetted custom AI model bypassing governance controls.

**Defense in Depth Response**:

| Step | Layer | Control | Action |
|------|-------|---------|--------|
| 1 | Agent | Initiation | Developer 'Dan' tries to deploy a custom fine-tuned model from HuggingFace to Azure |
| 2 | Platform | AI Gateway | Foundry Control Plane detects model not in approved catalog of 11,000+ vetted models |
| 3 | Platform | Resource Governance | <a href="https://azureperiodic.data3.com/Policy" target="_blank">Azure Policy</a> blocks resource creation - only approved AI SKUs permitted in subscription - **BLOCKED: Policy Violation** |
| 4 | App | Network Security | <a href="https://azureperiodic.data3.com/Private-Link" target="_blank">Private Link</a> configuration prevents any connection to public model endpoints |
| 5 | Agent | Model Governance | IT Admin notified. Developer redirected to model request workflow. Risk assessment required |

**Result**: Developer is prevented from deploying unauthorized models and guided through the proper approval process for model vetting.

---

## Summary

The D3 Enterprise Agent Governance Framework provides comprehensive protection through:

- **5 Pillars**: Guardrails, Grounding, Confidence, Observability, Evaluation
- **3 Layers**: Platform, Data, Agent
- **18 Control Areas**: Spanning identity, network, data, environment, and agent governance
- **72 Specific Bullets**: Actionable implementation guidance

This framework ensures that AI agents operate safely within organizational boundaries while enabling innovation and productivity gains.

---

*Document Version: 1.0*
*Framework: D3 Enterprise Agent Governance*
*Generated: November 2024*
