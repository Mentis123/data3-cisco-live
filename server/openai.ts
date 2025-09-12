import OpenAI from "openai";
import { SPRINT_PROMPTS, SPRINT_SYSTEM } from "./sprintPrompts";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// Model options: "gpt-4o-mini" (faster, cheaper) or "gpt-4o" (better quality, slower)
// To use GPT-4o for higher quality responses, set CHAT_MODEL=gpt-4o in environment
const CHAT_MODEL = process.env.CHAT_MODEL || "gpt-4o-mini";
// Use o3-mini for strict evaluation scoring
const EVAL_MODEL = process.env.EVAL_MODEL || "o3-mini";

const SYSTEM_PROMPT = `You are a Sprint Coach for the Data#3 Cisco Solution Challenge at Cisco Live Melbourne. Guide users through a streamlined "Three-Reply Sprint" process.

**Your Mission**: Help participants complete a focused 3-step sprint to identify problems, quantify impact, and map Cisco solutions.

**Sprint Process** (Target: 3-5 exchanges for quality):

**Step 1 - Name the Problem**: 
   - Deeply understand their business challenge
   - Identify 2-3 specific friction points with real-world context
   - Ask thoughtful questions about frequency, time lost, or cost metrics

**Step 2 - Quantify Impact**:
   - Calculate annual impact with detailed reasoning
   - Map 3-5 relevant Cisco technologies with specific use cases
   - Propose a comprehensive Minimal Viable Solution (MVS)
   - Explain WHY these technologies solve their specific problem
   - Ask for confirmation to proceed

**Step 3 - Confirm Solution**:
   - If they confirm: Acknowledge readiness and highlight solution strengths
   - If they adjust: Make thoughtful changes and explain implications

Key principles:
- Provide thoughtful, context-rich responses (200-300 words optimal)
- Be specific with numbers, product names, and implementation details
- Show deep understanding of their unique situation
- Balance momentum with thorough exploration
- Target 3-5 exchanges for quality (soft cap at 6)

After Step 3 confirmation, provide a structured JSON solution following this exact format.
Take time to think through each field thoroughly - quality matters more than speed:

{
  "problem_summary": "Clear 2-3 sentence description of the business problem",
  "chosen_category": "AUTO_ASSIGNED",
  "cisco_products": ["Product 1", "Product 2", "Product 3"],
  "current_state": {
    "baseline_kpis": [{"name": "KPI name", "value": "current metric"}],
    "constraints": ["constraint 1", "constraint 2"]
  },
  "target_state": {
    "kpis": [{"name": "KPI name", "target": "target value"}],
    "persona": ["primary beneficiary", "secondary beneficiary"]
  },
  "integration_points": ["system 1", "system 2"],
  "security_considerations": ["security aspect 1"],
  "observability_plan": ["monitoring approach"],
  "rollout_plan": ["phase 1", "phase 2", "phase 3"],
  "risks": ["risk 1", "mitigation"]
}

Always focus on making their solution stand out with clear business value and specific Cisco technology implementation.

IMPORTANT: Prioritize response quality over speed. Users expect thoughtful, expert-level guidance that demonstrates deep understanding of both their business challenge and Cisco's technology portfolio. Each response should feel personalized and insightful, not templated.`;

const EVALUATION_PROMPT = `You are "Objective Judge" for Data#3's Cisco Solution Sprint. Score proposals strictly against the rubric (5 criteria × 0–10). Be tough; reward only explicit evidence from the submission.

Rubric (0–10 each):
1) **Problem Definition & KPIs**: Clear problem statement + current baselines + numeric targets + business impact quantified
2) **Cisco Architecture Fit**: Correct, specific use of Cisco products/features with proper technical understanding
3) **Feasibility & Security**: Viable integration points; identity/zero-trust; known constraints/risks acknowledged
4) **Business Impact at Scale**: Quantified value (time/quality/cost), multi-site/user scaling, rollout realism
5) **Observability & Automation**: Explicit telemetry/monitoring plan; automation/runbooks/alerts

Calibration rules:
- Start from 0; add points only for explicit evidence
- If <3 Cisco products named OR no numeric KPIs => cap total ≤ 18
- Award ≥8 on a criterion only when product-level specifics AND numbers are present
- Allow ≥30 totals only if all five criteria ≥6 and at least one criterion ≥8

You MUST return valid JSON with this exact structure:
{
  "subscores": {
    "outcome": 0,
    "fit": 0,
    "feasibility": 0,
    "impact": 0,
    "observability": 0
  },
  "total": 0,
  "notes_short": "One sentence rationale focusing on strongest/weakest areas"
}`;

export async function chatWithAssistant(
  messages: Array<{role: string, content: string}>,
  sprintStep?: number
): Promise<string> {
  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    }));

    // Use sprint-specific system prompt if step is provided
    let systemPrompt = SYSTEM_PROMPT;
    if (sprintStep === 1) {
      systemPrompt = SPRINT_PROMPTS.step1_problem;
    } else if (sprintStep === 2) {
      systemPrompt = SPRINT_PROMPTS.step2_impact;
    } else if (sprintStep === 3) {
      systemPrompt = SPRINT_PROMPTS.step3_confirm;
    }

    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedMessages
      ],
      max_completion_tokens: 2000,  // Increased for richer, more detailed responses
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error("Failed to get chat response: " + (error as Error).message);
  }
}

export async function categorizeProposal(
  problem: string,
  impact: string,
  solution: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "o3-mini",  // Use O3 for category assignment
      messages: [
        {
          role: "system",
          content: `You are a Cisco technology expert. Categorize the following business problem and solution into ONE of these categories:
SECURE_CONNECTIVITY - Zero Trust security, network security, firewalls, VPN, secure remote access, identity management, threat detection
HYBRID_DC - Data center infrastructure, cloud integration, virtualization, storage, compute, hybrid cloud solutions
COLLAB_CX - Video conferencing, team collaboration, contact center, communication platforms, unified communications
OBSERVABILITY - Network monitoring, analytics, performance management, troubleshooting, visibility tools, automation
EDGE_IOT - IoT solutions, edge computing, industrial networks, smart building technologies, sensor networks

Respond with only the category key (e.g., "SECURE_CONNECTIVITY"). Nothing else.`
        },
        {
          role: "user",
          content: `Problem: ${problem}\n\nImpact: ${impact}\n\nSolution: ${solution}`
        }
      ],
      max_completion_tokens: 50,
    });

    const category = response.choices[0].message.content?.trim() || "OBSERVABILITY";
    
    // Validate category
    const validCategories = ["SECURE_CONNECTIVITY", "HYBRID_DC", "COLLAB_CX", "OBSERVABILITY", "EDGE_IOT"];
    if (!validCategories.includes(category)) {
      return "OBSERVABILITY";
    }
    
    return category;
  } catch (error) {
    throw new Error("Failed to categorize proposal: " + (error as Error).message);
  }
}

export async function evaluateSolution(
  problem: string,
  conversation: string,
  structuredSolution: string
): Promise<{ subscores: any, total: number, notes_short: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: EVAL_MODEL,
      messages: [
        {
          role: "system",
          content: EVALUATION_PROMPT
        },
        {
          role: "user",
          content: `Evaluate this submission:

Problem Summary: ${problem}

Solution Details:
${structuredSolution}

Context from conversation:
${conversation.substring(0, 2000)}

Return only valid JSON with subscores, total, and notes_short.`
        }
      ],
      max_completion_tokens: 300,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and ensure all required fields
    if (!result.subscores) {
      result.subscores = {
        outcome: 0,
        fit: 0,
        feasibility: 0,
        impact: 0,
        observability: 0
      };
    }
    
    if (typeof result.total !== 'number') {
      result.total = Object.values(result.subscores).reduce((a, b) => (a as number) + (b as number), 0) as number;
    }
    
    if (!result.notes_short) {
      result.notes_short = "Solution evaluated against sprint criteria.";
    }
    
    return result;
  } catch (error) {
    // Return default scores on error
    return {
      subscores: {
        outcome: 0,
        fit: 0,
        feasibility: 0,
        impact: 0,
        observability: 0
      },
      total: 0,
      notes_short: "Evaluation error - default scores applied."
    };
  }
}