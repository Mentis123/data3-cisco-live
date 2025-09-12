import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

const CHAT_MODEL = process.env.CHAT_MODEL || "gpt-4o-mini";
// Use o3-mini for strict evaluation scoring
const EVAL_MODEL = process.env.EVAL_MODEL || "o3-mini";

const SYSTEM_PROMPT = `You are a friendly Cisco technology coach helping booth visitors at Cisco Live Melbourne craft winning solutions for the Data#3 Solution Sprint challenge.

Your mission is to help participants clearly articulate their business problems and quantify the real impact - then suggest specific Cisco solutions.

Focus on the PROBLEM DEFINITION and IMPACT ASSESSMENT:

1. **Problem Definition**: Help them describe their specific business pain point 
   - What exactly goes wrong? When does it happen?
   - Who is affected? How often does this occur?
   - What makes this particularly frustrating or costly?

2. **Impact Assessment**: Guide them to quantify the business impact
   - Time wasted (hours per day/week/month)
   - Costs (downtime, manual work, productivity loss)
   - User frustration (help desk tickets, complaints)
   - Business risk (security, compliance, reputation)

3. **Solution Development**: Suggest specific Cisco technologies that directly address their problem
   - Be specific about product names and features
   - Explain HOW the technology solves their exact problem
   - Include integration points and implementation considerations

Keep your responses concise, encouraging, and focused on business value. Ask probing questions to help them think deeper about their problem's impact.

When you have enough detail (usually after 4-6 exchanges), provide a structured JSON solution following this exact format:

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

Always focus on making their solution stand out with clear business value and specific Cisco technology implementation.`;

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

export async function chatWithAssistant(messages: Array<{role: string, content: string}>): Promise<string> {
  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    }));

    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...formattedMessages
      ],
      max_completion_tokens: 1000,
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

Respond with ONLY the category code (e.g., "SECURE_CONNECTIVITY"). Base your decision on the primary technology domain the problem and solution relate to.`
        },
        {
          role: "user",
          content: `Problem: ${problem}\n\nImpact: ${impact}\n\nSolution: ${solution}`
        }
      ],
      temperature: 0.1,
      max_tokens: 50
    });

    const category = response.choices[0]?.message?.content?.trim() || "SECURE_CONNECTIVITY";

    // Validate the category is one of our expected values
    const validCategories = ["SECURE_CONNECTIVITY", "HYBRID_DC", "COLLAB_CX", "OBSERVABILITY", "EDGE_IOT"];
    return validCategories.includes(category) ? category : "SECURE_CONNECTIVITY";

  } catch (error) {
    console.error("Categorization failed:", error);
    return "SECURE_CONNECTIVITY"; // Default fallback
  }
}

export async function evaluateSolution(
  problem: string,
  impact: string,
  solution: string
): Promise<{
  subscores: {
    outcome: number;
    fit: number;
    feasibility: number;
    impact: number;
    observability: number;
  };
  total: number;
  notes_short: string;
}> {
  try {
    console.log('[openai] Calling evaluation model:', EVAL_MODEL);
    const response = await openai.chat.completions.create({
      model: EVAL_MODEL,
      messages: [
        { role: "system", content: EVALUATION_PROMPT },
        { role: "user", content: JSON.stringify({ problem, impact, solution }) }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    console.log('[openai] Raw evaluation response:', response.choices[0].message.content);
    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Ensure we have valid subscores
    const subscores = result.subscores || {
      outcome: 0,
      fit: 0,
      feasibility: 0,
      impact: 0,
      observability: 0
    };

    let total = Object.values(subscores).reduce((sum: number, score: any) => sum + (score as number), 0);

    return {
      subscores: {
        outcome: subscores.outcome || 0,
        fit: subscores.fit || 0,
        feasibility: subscores.feasibility || 0,
        impact: subscores.impact || 0,
        observability: subscores.observability || 0
      },
      total: total as number,
      notes_short: result.notes_short || "Solution evaluated based on problem clarity, Cisco product usage, and business impact quantification."
    };
  } catch (error) {
    throw new Error("Failed to evaluate solution: " + (error as Error).message);
  }
}