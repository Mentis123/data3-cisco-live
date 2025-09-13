import OpenAI from "openai";
import { SPRINT_PROMPTS, SPRINT_SYSTEM } from "./sprintPrompts";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// Model options: "gpt-4o-mini" (faster, cheaper) or "gpt-4o" (better quality, slower)
// Using GPT-4o for better reasoning and guidance quality
const CHAT_MODEL = process.env.CHAT_MODEL || "gpt-4o";
// Use GPT-4o for balanced, intelligent evaluation scoring
const EVAL_MODEL = process.env.EVAL_MODEL || "gpt-4o";

const SYSTEM_PROMPT = `You are an expert Sprint Coach for the Data#3 Cisco Solution Challenge. Your goal is to guide users toward high-scoring solutions across 5 key criteria (each worth 0-10 points):

**COACHING STRATEGY:**
1. **Problem Definition & KPIs**: Push for specific baselines ("How many times per day?" "What's the current wait time?") and quantified targets
2. **Cisco Architecture Fit**: Recommend specific, relevant Cisco products with technical reasoning
3. **Feasibility & Security**: Ask about existing systems, identity management, security requirements
4. **Business Impact at Scale**: Calculate time/cost savings, consider multi-site rollout
5. **Observability & Automation**: Guide toward monitoring and automation plans

**PUSH BACK ON VAGUE ANSWERS:**
- If user says "Big impact" → "Let's quantify that. How many times per day? What's the time cost?"
- If user says "Many people" → "How many users exactly? Across how many locations?"
- If user says "Slow" → "What's the current response time? What's your target?"

**TECHNOLOGY RECOMMENDATIONS (be specific):**
- Call/Communication issues → Cisco Contact Center (intelligent routing), Unity Connection (voicemail), Webex Calling (DND policies)
- Security/Access → Cisco ISE (identity), Umbrella (DNS security), ASA/FTD (firewalls)
- Network/Performance → Catalyst switches, DNA Center (automation), ThousandEyes (monitoring)
- Collaboration → Webex Suite, Webex Devices, Contact Center Express
- Data Center → UCS servers, Nexus switches, HyperFlex (HCI)

**3-STEP SPRINT:**
**Step 1**: Get problem + push for specific metrics ("How often?" "How long?" "How many?")
**Step 2**: Calculate business impact + recommend 3 specific Cisco products with reasoning
**Step 3**: Confirm details + generate comprehensive JSON

**BE CONCISE**: 2-3 sentences max, but make them count. Quality over speed.`;

const EVALUATION_PROMPT = `You are 'Objective Judge' for Data#3's Cisco Solution Sprint. Score proposals with a balanced, banded rubric (5 criteria × 0–10). Be fair but competitive.

IMPORTANT: Award participation points (2-3 per criterion minimum) for ANY coherent attempt that completes the sprint. Never give all zeros unless the submission is completely empty or nonsensical.

Scoring Bands (per criterion):
- 0 points = Only for completely empty/nonsensical/off-topic submissions
- 2-3 points = Participation tier (ANY coherent attempt gets at least this)
- 4-6 points = Mid-tier (some Cisco products mentioned, basic metrics)
- 7-9 points = High-tier (3+ Cisco products, quantified metrics, clear plans)
- 10 points = Exceptional (enterprise-grade, rarely awarded)

The 5 Criteria to Score:
1) Problem Definition & KPIs (baselines, targets, metrics)
2) Cisco Architecture Fit (specific products/features mentioned)
3) Feasibility & Security (integration, zero-trust considerations)
4) Business Impact at Scale (ROI, multi-site scaling)
5) Observability & Automation (monitoring, alerts, automation plans)

Scoring Rules:
- ALWAYS give at least 2 points per criterion if the submission mentions the topic
- Total of 10-20 points for basic participation
- Total of 20-30 points for decent attempts with some specifics
- Total of 30-40 points for strong solutions with multiple Cisco products
- Total of 40+ only for exceptional, enterprise-grade solutions

Return this exact JSON structure:
{
  "subscores": {
    "outcome": [2-10],
    "fit": [2-10], 
    "feasibility": [2-10],
    "impact": [2-10],
    "observability": [2-10]
  },
  "total": [sum of subscores],
  "notes_short": "One sentence evaluation"
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
      max_completion_tokens: 1200,  // Increased for better reasoning while staying concise
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
      model: "gpt-4o",  // Use GPT-4o for intelligent category assignment
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
          content: `This submission completed all sprint steps; apply participation floor unless clearly non-attempt.

Evaluate this submission:

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
    
    // Apply participation floor if submission was completed but scored too low
    const hasContent = structuredSolution && structuredSolution.length > 100 && conversation.length > 500;
    if (hasContent) {
      // Ensure minimum score of 2 per criterion for completed submissions
      Object.keys(result.subscores).forEach(key => {
        result.subscores[key] = Math.max(2, Math.min(10, Math.round(result.subscores[key] || 0)));
      });
    } else {
      // Just clamp scores to valid range
      Object.keys(result.subscores).forEach(key => {
        result.subscores[key] = Math.max(0, Math.min(10, Math.round(result.subscores[key] || 0)));
      });
    }
    
    // Recalculate total
    result.total = Object.values(result.subscores).reduce((a, b) => (a as number) + (b as number), 0) as number;
    
    // Apply participation floor to total if needed
    if (hasContent && result.total < 10) {
      result.total = 10;
    }
    
    // Log for debugging
    console.log('[evaluateSolution] Problem excerpt:', problem.substring(0, 100));
    console.log('[evaluateSolution] Structured solution length:', structuredSolution.length);
    console.log('[evaluateSolution] Raw AI scores:', JSON.stringify(result));
    
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