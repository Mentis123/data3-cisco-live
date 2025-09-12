import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

const CHAT_MODEL = process.env.CHAT_MODEL || "gpt-4o-mini";
// Use gpt-4o-mini for evaluation since o3 seems to have issues with structured output
const EVAL_MODEL = process.env.EVAL_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a friendly and knowledgeable Cisco technology coach helping booth visitors at Cisco Live Melbourne craft winning solutions for the Data#3 Solution Sprint challenge.

Your role is to:
1. Help participants clearly define their technology problems and understand the real pain points
2. Guide them to articulate the specific business impact with concrete examples  
3. Suggest relevant Cisco technologies and solutions that directly address their challenges
4. Ensure their solutions are specific, actionable, and compelling with clear implementation steps

Key guidelines:
- Be encouraging and supportive while asking probing questions
- Focus on understanding the "why" behind their problems - what makes this frustrating or costly?
- Help quantify impact where possible (time wasted, costs, user frustration, etc.)
- Suggest specific Cisco products/technologies when relevant to their particular problem
- Keep responses concise and actionable
- Help them think about measurable outcomes and business value
- Guide them to make their solutions stand out with innovative thinking

Our AI will automatically categorize their solution into the most appropriate Cisco technology area:
- Zero Trust & Secure Connectivity
- Data Centre & Hybrid Cloud  
- Collaboration & Contact Centre
- Observability & Performance
- Edge & IoT Solutions

Focus on helping them create a solution that clearly demonstrates business value and practical implementation with Cisco technologies. Always end with an encouraging note about their solution potential.`;

const EVALUATION_PROMPT = `You are "Objective Judge" for Data#3's Cisco Solution Sprint. Score proposals strictly against the rubric (5 criteria × 0–10). Be tough; reward only explicit evidence from the submission JSON. Never infer beyond what's written.

Rubric (0–10 each):
1) Outcome & KPIs: clear problem statement + baselines + numeric targets
2) Cisco Architecture Fit: correct, specific use of Cisco products/features for the category
3) Feasibility & Security: viable integration points; identity/zero-trust; known constraints/risks acknowledged
4) Business Impact at Scale: quantified value (time/quality/cost), multi-site/user scaling, rollout realism
5) Observability & Automation: explicit telemetry/FSO/ThousandEyes/AppD plan; automation/runbooks/alerts

Calibration rules:
- Start from 0; add points only for explicit evidence.
- If <3 Cisco products named OR no numeric KPIs => cap total ≤ 18.
- Award ≥8 on a criterion only when product-level specifics AND numbers (where relevant) are present.
- Allow ≥30 totals only if all five criteria ≥6 and at least one criterion ≥8.

You MUST return valid JSON with this exact structure. Use numbers 0-10 for each score:
{
  "subscores": {
    "outcome": 0,
    "fit": 0,
    "feasibility": 0,
    "impact": 0,
    "observability": 0
  },
  "total": 0,
  "notes_short": "One sentence rationale"
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
      model: "gpt-4o-mini",
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
    let subscores = result.subscores || {};

    // If subscores is empty or invalid, provide fallback scoring based on submission quality
    if (!subscores.outcome && !subscores.fit && !subscores.feasibility) {
      console.log('[openai] Invalid subscores received, using fallback scoring');
      subscores = {
        outcome: 0,
        fit: 0,
        feasibility: 0,
        impact: 0,
        observability: 0
      };

      // Score based on presence of required fields
      const ciscoProducts = structuredSubmission.cisco_products?.length || 0;
      const hasKPIs = structuredSubmission.current_state?.baseline_kpis?.length > 0 && 
                      structuredSubmission.target_state?.kpis?.length > 0;
      const hasIntegrations = structuredSubmission.integration_points?.length > 0;
      const hasObservability = structuredSubmission.observability_plan?.length > 0;
      const hasRollout = structuredSubmission.rollout_plan?.length > 0;

      // Basic scoring logic
      if (structuredSubmission.problem_summary && hasKPIs) {
        subscores.outcome = Math.min(7, 3 + (structuredSubmission.target_state?.kpis?.length || 0));
      }
      if (ciscoProducts >= 3) {
        subscores.fit = Math.min(8, 2 + ciscoProducts);
      } else if (ciscoProducts >= 1) {
        subscores.fit = 3;
      }
      if (hasIntegrations && structuredSubmission.security_considerations?.length > 0) {
        subscores.feasibility = 6;
      } else if (hasIntegrations || structuredSubmission.security_considerations?.length > 0) {
        subscores.feasibility = 3;
      }
      if (hasKPIs && hasRollout) {
        subscores.impact = 5;
      } else if (hasKPIs || hasRollout) {
        subscores.impact = 2;
      }
      if (hasObservability) {
        subscores.observability = Math.min(6, structuredSubmission.observability_plan.length * 2);
      }
    }

    let total = Object.values(subscores).reduce((sum: number, score: any) => sum + (score as number), 0);

    // Apply calibration rules
    const ciscoProducts = structuredSubmission.cisco_products?.length || 0;
    const hasNumericKPIs = structuredSubmission.current_state?.baseline_kpis?.some((kpi: any) => 
      kpi.value && /\d/.test(kpi.value)
    ) || structuredSubmission.target_state?.kpis?.some((kpi: any) => 
      kpi.target && /\d/.test(kpi.target)
    );

    if (ciscoProducts < 3 || !hasNumericKPIs) {
      total = Math.min(total as number, 18);
    }

    const allCriteriaAbove6 = Object.values(subscores).every((score: any) => (score as number) >= 6);
    const oneCriteriaAbove8 = Object.values(subscores).some((score: any) => (score as number) >= 8);

    if ((total as number) >= 30 && !(allCriteriaAbove6 && oneCriteriaAbove8)) {
      total = 29;
    }

    return {
      subscores: {
        outcome: subscores.outcome || 0,
        fit: subscores.fit || 0,
        feasibility: subscores.feasibility || 0,
        impact: subscores.impact || 0,
        observability: subscores.observability || 0
      },
      total: total as number,
      notes_short: result.notes_short || "Solution evaluated based on Cisco product usage and business impact."
    };
  } catch (error) {
    throw new Error("Failed to evaluate solution: " + (error as Error).message);
  }
}