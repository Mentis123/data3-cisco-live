# D3 Agent Governance Framework

> **Also read**: `CLAUDE.md` for additional context (if you're Codex, read what we tell Claude too)

## Project Overview

This is the **D3 Enterprise Agent Governance Framework** - a comprehensive defense-in-depth approach to governing AI agents across the Microsoft ecosystem. The interactive demo lives in `index.html` with a backend in `server.js`.

## Architecture

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
```

## Key Files

| File | Purpose |
|------|---------|
| `kb.md` | **Knowledge Base** - The complete D3 framework documentation. This is the source of truth. |
| `claude.g.md` | Mirror of kb.md (keep in sync) |
| `index.html` | Interactive web demo with chat interface, threat simulations, and pillar visualizations |
| `server.js` | Express backend connecting to Azure AI Foundry |
| `stripe.html` | Stripe integration UI |

## Azure Periodic Table

When mentioning Azure services in the KB, link to their Azure Periodic Table pages at `azureperiodic.data3.com`. Use HTML links with `target="_blank"`:

```html
<a href="https://azureperiodic.data3.com/Entra-ID" target="_blank">Entra ID</a>
```

**Available services with links:**
- [Entra ID](https://azureperiodic.data3.com/Entra-ID)
- [Conditional Access](https://azureperiodic.data3.com/Conditional-Access)
- [Purview](https://azureperiodic.data3.com/Purview)
- [Private Link](https://azureperiodic.data3.com/Private-Link)
- [Virtual Network](https://azureperiodic.data3.com/Virtual-Network)
- [Azure OpenAI](https://azureperiodic.data3.com/Azure-OpenAI)
- [Azure Policy](https://azureperiodic.data3.com/Policy)
- [Cost Management](https://azureperiodic.data3.com/Cost-Management)
- [Log Analytics](https://azureperiodic.data3.com/Log-Analytics)
- [App Insights](https://azureperiodic.data3.com/App-Insights)
- [ARM Templates](https://azureperiodic.data3.com/Azure-Resource-Manager)
- [Bicep](https://azureperiodic.data3.com/bicep)
- [DevOps](https://azureperiodic.data3.com/DevOps)
- [NSG](https://azureperiodic.data3.com/Network-Security-Group)
- [Defender for Cloud](https://azureperiodic.data3.com/Defender-for-Cloud)

## The Five Pillars

Always remember these when discussing governance:

1. **Guardrails** (Orange `#f97316`) - What's allowed vs disallowed
2. **Grounding** (Green `#22c55e`) - Answers based on trusted data
3. **Confidence** (Purple `#a855f7`) - Thresholds for autonomous action
4. **Observability** (Cyan `#06b6d4`) - Logging and monitoring
5. **Evaluation** (Amber `#f59e0b`) - Risk vs value assessment

## House Rules

1. **Keep kb.md and claude.g.md in sync** - If you edit one, copy to the other
2. **Link Azure services** - Use Azure Periodic Table links when adding new service mentions
3. **Respect the pillars** - When adding controls, map them to the appropriate pillar(s)
4. **Test the demo** - The index.html should remain functional after changes
5. **No secrets in code** - API keys go in environment variables

## Code Style

- **JavaScript**: ES6+, async/await preferred
- **HTML**: Semantic markup, Tailwind CSS classes
- **Markdown**: GitHub-flavored, tables for structured data

## Common Tasks

### Adding a new Azure service mention
1. Check if it exists on azureperiodic.data3.com
2. Add the HTML link with `target="_blank"`
3. Update both kb.md and claude.g.md

### Updating the threat simulations
- Simulations are in kb.md under "Security Scenarios"
- Each has a 5-step defense-in-depth response table
- Follow the Layer → Control → Action pattern

### Working with the chat interface
- Backend is in server.js (Express)
- Connects to Azure AI Foundry
- KB content is used for grounding responses

## Quick Reference

```bash
# Start the server
node server.js

# The demo runs at
http://localhost:3000

# Dependencies
npm install
```

## Environment Variables

```
AZURE_OPENAI_ENDPOINT=<your-endpoint>
AZURE_OPENAI_KEY=<your-key>
```

---

*We're building governance for AI agents. Be a good one.*
