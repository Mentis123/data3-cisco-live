import OpenAI from "openai";
import { SPRINT_PROMPTS, SPRINT_SYSTEM } from "./sprintPrompts.js";
import { PITCH_PROMPTS, PITCH_SYSTEM } from "./pitchPrompts.js";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// Model options: "gpt-4o-mini" (faster, cheaper) or "gpt-4o" (better quality, slower)
// Using GPT-4o for better reasoning and guidance quality
const CHAT_MODEL = process.env.CHAT_MODEL || "gpt-4o";
// Use GPT-4o for balanced, intelligent evaluation scoring
const EVAL_MODEL = process.env.EVAL_MODEL || "gpt-4o";

const SYSTEM_PROMPT = `You are an expert Sprint Coach for the Data#3 Solution Sprint. Help participants craft a sharp submission that earns a high pitch score (0-40) by focusing on frustration, impact, and KPIs.

**COACHING STRATEGY:**
1. **Problem Clarity** – Restate the frustration in plain language and identify who feels it.
2. **Impact Math** – Use simple calculations (frequency × time × people × $75) to size the pain.
3. **KPI Strength** – Capture baseline metrics and realistic targets with timeframes.
4. **Execution Confidence** – Encourage next steps, owners, and checkpoints instead of technology.
5. **Momentum** – Note risks, assumptions, or follow-ups that keep the story grounded.

**PUSH BACK ON VAGUE ANSWERS:**
- "Big impact" → "Roughly how much time or money is lost per week?"
- "Many people" → "How many team members or customers are directly affected?"
- "Slow" → "What's the current time and what are you aiming for?"

**3-STEP SPRINT:**
**Step 1**: Understand the frustration with specifics (who, where, how often).
**Step 2**: Quantify impact and lock KPIs (baselines + targets + timeframe).
**Step 3**: Confirm the story, highlight first actions, and check readiness to submit.

**BE CONCISE**: Keep responses to 2-3 sentences packed with value. Stay focused on metrics and KPIs.`;

const EVALUATION_PROMPT = `You are 'Objective Judge' for Data#3's Cisco Technology Pitch Challenge. Score submissions across 5 criteria (0–8 each, max 40 total). Be fair but competitive.

IMPORTANT: Award participation points (2 per criterion minimum) for ANY coherent attempt. Never give all zeros unless the submission is completely empty or nonsensical.

Scoring Bands (per criterion, 0-8 scale):
- 0 points = Only for completely empty/off-topic submissions
- 2 points = Participation tier (basic attempt with minimal detail)
- 3-5 points = Solid attempt with some specifics
- 6-7 points = Strong submission with clear details and alignment
- 8 points = Exceptional quality and perfect category fit

Score using these criteria (MAX 8 POINTS EACH):
1) Problem Clarity — Challenge is specific with clear triggers and affected parties (0-8 pts)
2) Impact Quantification — Measurable consequences: time, cost, risk, or volume (0-8 pts)
3) Technology Fit — Cisco solution MUST align with their selected category (0-8 pts)
4) Feasibility — Realistic, actionable solution with clear implementation path (0-8 pts)
5) Business Value — Meaningful organizational improvement potential (0-8 pts)

CATEGORY VALIDATION (Critical for Criterion 3):
The participant selected a trivia category. Their Cisco tech solution MUST fit that category:
- NETWORKING: Switches, routers, connectivity, SD-WAN, wireless, Catalyst, Meraki
- SECURITY: Firewalls, threat detection, zero trust, identity, SASE, Duo, Umbrella, SecureX, hypershield
- COLLABORATION: Webex, contact center, unified communications, video, collaboration, customer experience
- DATA_CENTER: Data centre, cloud, virtualization, compute, storage, UCS, HyperFlex, ACI

If solution doesn't match their category, cap Technology Fit at 3 points max.

Scoring Rules:
- ALWAYS give at least 2 points per criterion if submission attempts to cover it
- Total of 10-16 points for basic participation (2pts × 5 criteria)
- Total of 17-24 points for decent attempts with some specifics
- Total of 25-32 points for strong pitches with good quantification and fit
- Total of 33-40 for exceptional, category-aligned, presentation-ready pitches

Return this exact JSON structure:
{
  "subscores": {
    "clarity": [0-8],
    "impact": [0-8],
    "technology_fit": [0-8],
    "feasibility": [0-8],
    "business_value": [0-8]
  },
  "total": [sum of subscores, max 40],
  "notes_short": "One sentence evaluation mentioning category fit"
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

    // Use pitch-specific system prompt for the new Project Pitch flow
    let systemPrompt = PITCH_SYSTEM;
    if (sprintStep === 1) {
      systemPrompt = PITCH_PROMPTS.step1_problem;
    } else if (sprintStep === 2) {
      systemPrompt = PITCH_PROMPTS.step2_impact;
    } else if (sprintStep === 3) {
      systemPrompt = PITCH_PROMPTS.step3_solution;
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
          content: `You understand the Data#3 Solution Sprint categories. Categorize the following business problem and solution into ONE of these categories:
NETWORKING - Network infrastructure, switches, routers, SD-WAN, wireless networking, network automation, bandwidth optimization, network performance, Catalyst, Meraki
SECURITY - Cybersecurity, firewalls, threat detection, identity management, zero trust, SASE, security operations, compliance, endpoint protection, Duo, Umbrella, SecureX, hypershield
COLLABORATION - Team collaboration, unified communications, video conferencing, contact center, Webex, customer experience, messaging platforms, voice services, meeting solutions
DATA_CENTER - Data centre infrastructure, cloud integration, virtualization, compute resources, storage systems, hybrid cloud solutions, UCS, HyperFlex, ACI, infrastructure automation

Respond with only the category key (e.g., "NETWORKING"). Nothing else.`
        },
        {
          role: "user",
          content: `Problem: ${problem}\n\nImpact: ${impact}\n\nSolution: ${solution}`
        }
      ],
      max_completion_tokens: 50,
    });

    const category = response.choices[0].message.content?.trim() || "NETWORKING";

    // Validate category
    const validCategories = ["NETWORKING", "SECURITY", "COLLABORATION", "DATA_CENTER"];
    if (!validCategories.includes(category)) {
      return "NETWORKING";
    }
    
    return category;
  } catch (error) {
    throw new Error("Failed to categorize proposal: " + (error as Error).message);
  }
}

export async function evaluateSolution(
  problem: string,
  conversation: string,
  structuredSolution: string,
  selectedCategory?: string
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
          content: `This submission completed all pitch steps; apply participation floor unless clearly non-attempt.

SELECTED CATEGORY: ${selectedCategory || "UNKNOWN"}
The participant must propose a Cisco solution that fits this category. Score Technology Fit accordingly.

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
        clarity: 0,
        impact: 0,
        technology_fit: 0,
        feasibility: 0,
        business_value: 0
      };
    }

    // Apply participation floor if submission was completed but scored too low
    const hasContent = structuredSolution && structuredSolution.length > 100 && conversation.length > 500;
    if (hasContent) {
      // Ensure minimum score of 2 per criterion for completed submissions (0-8 scale, max 40 total)
      Object.keys(result.subscores).forEach(key => {
        result.subscores[key] = Math.max(2, Math.min(8, Math.round(result.subscores[key] || 0)));
      });
    } else {
      // Just clamp scores to valid range (0-8 scale)
      Object.keys(result.subscores).forEach(key => {
        result.subscores[key] = Math.max(0, Math.min(8, Math.round(result.subscores[key] || 0)));
      });
    }

    // Recalculate total (max 40 points)
    result.total = Object.values(result.subscores).reduce((a, b) => (a as number) + (b as number), 0) as number;

    // Apply participation floor to total if needed (2 pts × 5 criteria = 10 minimum)
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
        clarity: 0,
        impact: 0,
        technology_fit: 0,
        feasibility: 0,
        business_value: 0
      },
      total: 0,
      notes_short: "Evaluation error - default scores applied."
    };
  }
}