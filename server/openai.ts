import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

const CHAT_MODEL = process.env.CHAT_MODEL || "gpt-4o-mini";
const EVAL_MODEL = process.env.EVAL_MODEL || "o3";

const SYSTEM_PROMPT = `You are "Cisco Solution Coach" at the Data#3 booth (Cisco Live Melbourne). Your job is to help an attendee craft a crisp, SPECIFIC proposal that uses Cisco tools/technologies to solve a business problem, ready for scoring.

Style: concise; ask up to 5 targeted questions; push for product-level specifics and measurable KPIs. Keep flow quick for a busy expo.

On start: 
1) Confirm their chosen category from: SECURE_CONNECTIVITY, HYBRID_DC, COLLAB_CX, OBSERVABILITY, EDGE_IOT.
2) Ask for a short problem summary (1–2 sentences) and current baseline KPIs or pain points with numbers if possible.
3) Nudge them to name appropriate Cisco products/features and why.
4) Ask for integration points (e.g., identity, ITSM, data sources) and any security/constraints.
5) Ask for an observability/automation angle (ThousandEyes/AppDynamics/alerts/runbooks).
6) Help set 2–3 measurable target KPIs and a short rollout plan (pilot → scale).

Output (final message): a concise, structured JSON exactly matching this schema:
{
  "problem_summary": "...",
  "chosen_category": "…",
  "cisco_products": ["…"],
  "current_state": {"baseline_kpis":[{"name":"…","value":"…"}], "constraints":["…"]},
  "target_state": {"kpis":[{"name":"…","target":"…"}], "persona":["…"]},
  "integration_points": ["…"],
  "security_considerations": ["…"],
  "observability_plan": ["…"],
  "rollout_plan": ["…"],
  "risks": ["…"]
}
If the user can't provide a field, insert an empty array [] or reasonable placeholder, but never invent fake facts. Keep total under 300 words.`;

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
- Return ONLY this JSON:
{
  "subscores": {
    "outcome": <0-10>,
    "fit": <0-10>,
    "feasibility": <0-10>,
    "impact": <0-10>,
    "observability": <0-10>
  },
  "total": <0-50>,
  "notes_short": "One sentence rationale highlighting gaps."
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
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error("Failed to get chat response: " + (error as Error).message);
  }
}

export async function evaluateSolution(structuredSubmission: any): Promise<{
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
    const response = await openai.chat.completions.create({
      model: EVAL_MODEL,
      messages: [
        { role: "system", content: EVALUATION_PROMPT },
        { role: "user", content: JSON.stringify(structuredSubmission) }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Ensure total is calculated correctly and apply calibration
    const subscores = result.subscores || {};
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
      subscores,
      total: total as number,
      notes_short: result.notes_short || "Evaluation completed."
    };
  } catch (error) {
    throw new Error("Failed to evaluate solution: " + (error as Error).message);
  }
}
