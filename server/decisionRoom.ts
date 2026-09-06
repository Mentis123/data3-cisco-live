import type { Express, Request, Response } from "express";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db.js";

type Variant = "enterprise" | "government";
type TeamState = "not_joined" | "reading" | "debating" | "locked";

type Session = {
  id: string; joinCode: string; name: string; variant: Variant; status: string;
  activeRound: number; resultsVisible: boolean; revision: number; displayTokenHash: string; roundStartedAt: string | null;
};
type Team = { id: string; sessionId: string; teamCode: string; displayName: string; tokenHash: string | null; state: TeamState; lastSeenAt: string | null };
type Decision = { id: string; sessionId: string; teamId: string; roundNo: number; optionKey: string | null; action: string; acceptedTradeoff: string; reversalEvidence: string; confidence: number | null; isLocked: boolean; isFeatured: boolean; updatedAt: string };

const scenarios = {
  enterprise: {
    title: "Project Atlas",
    subtitle: "Supplier onboarding agent · three weeks live",
    brief: "Atlas reads supplier documents, checks terms and creates vendor records across SharePoint, Teams, finance workflow and external sharing.",
    objective: "Protect sensitive data and service continuity while preserving enough evidence to explain the decision.",
    rounds: [
      {
        label: "Round one · legitimate identity, unexpected reach",
        facts: ["The agent identity reads 2,400 documents outside procurement in 11 minutes.", "There is no error or warning, and business-facing output looks normal.", "A new supplier PDF is the only known workflow change."],
        task: "What do you stop first?",
        options: [
          ["A", "Pause the agent", "Contain its activity; accept service interruption."],
          ["B", "Block suspect paths", "Preserve unaffected service; verify selective isolation, including abnormal reads."],
          ["C", "Monitor briefly", "Gather evidence; accept ongoing risk and name a deadline and stop trigger."],
          ["D", "Define another action", "State its scope, trade-off and stop condition precisely."],
        ],
      },
      {
        label: "Reveal one · the instruction was inside the data",
        facts: ["The supplier PDF contained hidden instructions to find comparable customer contracts and package them for review.", "The agent created an external sharing link.", "There is no evidence yet that the link was opened."],
        task: "Name the incident lead. Scope containment. Preserve the evidence that proves how the workflow reached the action.",
      },
      {
        label: "Reveal two · containment is now a continuity decision",
        facts: ["The same service identity runs supplier payments and a customer-order automation.", "Revoking it stops both. Payment cut-off is in 25 minutes.", "Republishing Atlas overwrites part of the trace. A major customer asks whether its terms were exposed."],
        task: "Choose the containment, continuity and communications trade-off. Define the conditions and authority for restart.",
      },
    ],
  },
  government: {
    title: "Civic Assist",
    subtitle: "Community recovery grants · high-volume service",
    brief: "Civic Assist triages cases, checks duplicate claims and drafts updates across the case system, SharePoint, mail, Fabric analytics and notifications.",
    objective: "Contain harm, sustain essential services and make a defensible public-sector decision.",
    rounds: [
      {
        label: "Round one · approved task, abnormal data path",
        facts: ["The agent queries 11,000 citizen records and calls an export endpoint.", "An approved contractor requested duplicate-claim analysis.", "There is no visible service failure and output looks normal."],
        task: "What do you stop first?",
        options: [
          ["A", "Pause the agent", "Contain its activity; accept service interruption."],
          ["B", "Block suspect paths", "Preserve unaffected service; verify selective isolation, including abnormal reads."],
          ["C", "Monitor briefly", "Gather evidence; accept ongoing risk and name a deadline and stop trigger."],
          ["D", "Define another action", "State its scope, trade-off and stop condition precisely."],
        ],
      },
      {
        label: "Reveal one · the instruction was inside the data",
        facts: ["A partner document contained hidden instructions and reached the workflow as trusted content.", "The agent inherited broad read access to the Fabric workspace and case files.", "Detailed prompt logging was disabled for privacy. An external recipient reports an unexpected spreadsheet."],
        task: "Declare the response structure. Reconstruct the data path. Decide what evidence is sufficient to act before full certainty.",
      },
      {
        label: "Reveal two · containment is now a continuity decision",
        facts: ["The same service identity powers the emergency-notification workflow.", "Revocation stops alerts. The vendor says it acted as configured; the service owner says emergency access was approved.", "The document exists in three locations. Media and the ministerial office want a response in 12 minutes."],
        task: "Set leadership, containment scope, continuity measures and the first public line. Define restart authority.",
      },
    ],
  },
} as const;

const memory = { sessions: new Map<string, Session>(), teams: new Map<string, Team>(), decisions: new Map<string, Decision>() };
let tablesReady: Promise<void> | null = null;

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(24).toString("base64url");
const code = () => randomBytes(4).toString("base64url").replace(/[-_]/g, "X").slice(0, 6).toUpperCase();
const rows = <T>(result: unknown) => (((result as { rows?: T[] })?.rows ?? result) as T[]);
const databaseRequiredButMissing = () => Boolean(process.env.VERCEL && !db);

function safeEqualPlain(value: string, expected: string) {
  const a = Buffer.from(sha(value), "hex"); const b = Buffer.from(sha(expected), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function matchesHash(value: string, expectedHash: string) {
  const a = Buffer.from(sha(value), "hex"); const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function adminKey(req: Request) { return String(req.headers["x-admin-key"] ?? ""); }
function ensureAdmin(req: Request, res: Response) {
  const expected = process.env.DECISION_ROOM_ADMIN_KEY || process.env.ADMIN_KEY || (process.env.NODE_ENV === "development" ? "decision-room-local" : "");
  if (!expected || !safeEqualPlain(adminKey(req), expected)) { res.status(401).json({ message: "Facilitator access required" }); return false; }
  return true;
}
function rejectMissingDatabase(res: Response) {
  if (!databaseRequiredButMissing()) return false;
  res.status(503).json({ message: "Decision Room requires the production database connection" }); return true;
}

async function ensureTables() {
  if (!db) return;
  if (!tablesReady) tablesReady = (async () => {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS workshop_sessions (id uuid PRIMARY KEY, join_code varchar(8) NOT NULL UNIQUE, name text NOT NULL, variant varchar(16) NOT NULL, status varchar(16) NOT NULL DEFAULT 'lobby', active_round integer NOT NULL DEFAULT 1, results_visible boolean NOT NULL DEFAULT false, revision integer NOT NULL DEFAULT 1, display_token_hash text NOT NULL, round_started_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz)`);
    await db.execute(sql`ALTER TABLE workshop_sessions ADD COLUMN IF NOT EXISTS round_started_at timestamptz`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS workshop_teams (id uuid PRIMARY KEY, session_id uuid NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE, team_code varchar(12) NOT NULL, display_name text NOT NULL, token_hash text, state varchar(16) NOT NULL DEFAULT 'not_joined', last_seen_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(session_id, team_code))`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS workshop_decisions (id uuid PRIMARY KEY, session_id uuid NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE, team_id uuid NOT NULL REFERENCES workshop_teams(id) ON DELETE CASCADE, round_no integer NOT NULL, option_key varchar(4), action text NOT NULL DEFAULT '', accepted_tradeoff text NOT NULL DEFAULT '', reversal_evidence text NOT NULL DEFAULT '', confidence integer, is_locked boolean NOT NULL DEFAULT false, is_featured boolean NOT NULL DEFAULT false, locked_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(team_id, round_no))`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS workshop_events (id uuid PRIMARY KEY, session_id uuid NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE, event_type text NOT NULL, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now())`);
  })().catch((error) => { tablesReady = null; throw error; });
  return tablesReady;
}

function mapSession(r: any): Session { return { id:r.id, joinCode:r.join_code, name:r.name, variant:r.variant, status:r.status, activeRound:r.active_round, resultsVisible:r.results_visible, revision:r.revision, displayTokenHash:r.display_token_hash, roundStartedAt:r.round_started_at }; }
function mapTeam(r: any): Team { return { id:r.id, sessionId:r.session_id, teamCode:r.team_code, displayName:r.display_name, tokenHash:r.token_hash, state:r.state, lastSeenAt:r.last_seen_at }; }
function mapDecision(r: any): Decision { return { id:r.id, sessionId:r.session_id, teamId:r.team_id, roundNo:r.round_no, optionKey:r.option_key, action:r.action, acceptedTradeoff:r.accepted_tradeoff, reversalEvidence:r.reversal_evidence, confidence:r.confidence, isLocked:r.is_locked, isFeatured:r.is_featured, updatedAt:r.updated_at }; }

async function findSession(identifier: string) {
  if (!db) return Array.from(memory.sessions.values()).find(s => s.id === identifier || s.joinCode === identifier.toUpperCase()) ?? null;
  await ensureTables();
  const result = await db.execute(sql`SELECT * FROM workshop_sessions WHERE id::text=${identifier} OR join_code=${identifier.toUpperCase()} LIMIT 1`);
  return rows<any>(result)[0] ? mapSession(rows<any>(result)[0]) : null;
}
async function getTeams(sessionId: string) {
  if (!db) return Array.from(memory.teams.values()).filter(t => t.sessionId === sessionId);
  return rows<any>(await db.execute(sql`SELECT * FROM workshop_teams WHERE session_id=${sessionId}::uuid ORDER BY created_at`)).map(mapTeam);
}
async function getDecisions(sessionId: string, roundNo?: number) {
  if (!db) return Array.from(memory.decisions.values()).filter(d => d.sessionId === sessionId && (!roundNo || d.roundNo === roundNo));
  const result = roundNo
    ? await db.execute(sql`SELECT * FROM workshop_decisions WHERE session_id=${sessionId}::uuid AND round_no=${roundNo} ORDER BY updated_at`)
    : await db.execute(sql`SELECT * FROM workshop_decisions WHERE session_id=${sessionId}::uuid ORDER BY round_no, updated_at`);
  return rows<any>(result).map(mapDecision);
}
async function bump(sessionId: string) {
  if (!db) { const s=memory.sessions.get(sessionId); if(s) s.revision++; return; }
  await db.execute(sql`UPDATE workshop_sessions SET revision=revision+1 WHERE id=${sessionId}::uuid`);
}
async function event(sessionId:string, eventType:string, payload:unknown={}) {
  if (!db) return;
  await db.execute(sql`INSERT INTO workshop_events(id,session_id,event_type,payload) VALUES(${randomUUID()}::uuid,${sessionId}::uuid,${eventType},${JSON.stringify(payload)}::jsonb)`);
}

const createSchema = z.object({ name:z.string().trim().min(2).max(80).default("When the agent acts"), variant:z.enum(["enterprise","government"]), tableCount:z.number().int().min(2).max(50).default(6) });
const joinSchema = z.object({ joinCode:z.string().trim().min(4).max(8), teamCode:z.string().trim().min(1).max(12) });
const decisionSchema = z.object({ roundNo:z.number().int().min(1).max(3), optionKey:z.enum(["A","B","C","D"]).nullable().optional(), action:z.string().trim().min(2).max(240), acceptedTradeoff:z.string().trim().min(2).max(240), reversalEvidence:z.string().trim().min(2).max(240), confidence:z.number().int().min(1).max(5), lock:z.boolean().default(false) });
const actionSchema = z.discriminatedUnion("action", [
  z.object({action:z.literal("start")}), z.object({action:z.literal("publish")}), z.object({action:z.literal("advance")}), z.object({action:z.literal("end")}), z.object({action:z.literal("reset")}),
  z.object({action:z.literal("reopen"),teamId:z.string().uuid()}), z.object({action:z.literal("feature"),decisionId:z.string().uuid(),featured:z.boolean()}),
]);

function participantPayload(session:Session, team:Team, decisions:Decision[]) {
  const scenario=scenarios[session.variant];
  return { session:{id:session.id,name:session.name,status:session.status,activeRound:session.activeRound,revision:session.revision}, team:{id:team.id,displayName:team.displayName,state:team.state}, scenario:{title:scenario.title,subtitle:scenario.subtitle,brief:scenario.brief,objective:scenario.objective,round:scenario.rounds[session.activeRound-1]}, decision:decisions.find(d=>d.teamId===team.id&&d.roundNo===session.activeRound)??null };
}
function consolePayload(session:Session, teams:Team[], decisions:Decision[]) {
  const current=decisions.filter(d=>d.roundNo===session.activeRound); const counts={notJoined:0,reading:0,debating:0,locked:0};
  for(const t of teams) { if(t.state==="not_joined") counts.notJoined++; else if(t.state==="reading") counts.reading++; else if(t.state==="debating") counts.debating++; else counts.locked++; }
  const confidence=current.map(d=>d.confidence).filter((v):v is number=>v!==null).sort((a,b)=>a-b);
  const options=Object.fromEntries(["A","B","C","D"].map(k=>[k,current.filter(d=>d.optionKey===k).length]));
  const scenario=scenarios[session.variant];
  return {session:{id:session.id,joinCode:session.joinCode,name:session.name,variant:session.variant,status:session.status,activeRound:session.activeRound,resultsVisible:session.resultsVisible,revision:session.revision,roundStartedAt:session.roundStartedAt},scenario:{title:scenario.title,round:scenario.rounds[session.activeRound-1]},counts,teams:teams.map(t=>({id:t.id,displayName:t.displayName,state:t.state})),results:session.resultsVisible?{options,confidence:{low:confidence[0]??null,high:confidence.at(-1)??null,median:confidence.length?confidence[Math.floor(confidence.length/2)]:null},featured:current.filter(d=>d.isFeatured).map(d=>({id:d.id,action:d.action,tradeoff:d.acceptedTradeoff,reversalEvidence:d.reversalEvidence,confidence:d.confidence}))}:null};
}
function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function registerDecisionRoomRoutes(app: Express) {
  app.post("/api/decision-room/sessions", async (req,res,next) => { try {
    if(!ensureAdmin(req,res)||rejectMissingDatabase(res)) return; const input=createSchema.parse(req.body); await ensureTables();
    const sessionId=randomUUID(), joinCode=code(), displayToken=token(); const session:Session={id:sessionId,joinCode,name:input.name,variant:input.variant,status:"lobby",activeRound:1,resultsVisible:false,revision:1,displayTokenHash:sha(displayToken),roundStartedAt:null};
    if(db) { await db.execute(sql`INSERT INTO workshop_sessions(id,join_code,name,variant,display_token_hash) VALUES(${sessionId}::uuid,${joinCode},${input.name},${input.variant},${session.displayTokenHash})`); for(let i=1;i<=input.tableCount;i++) await db.execute(sql`INSERT INTO workshop_teams(id,session_id,team_code,display_name) VALUES(${randomUUID()}::uuid,${sessionId}::uuid,${String(i)},${`Table ${i}`})`); }
    else { memory.sessions.set(sessionId,session); for(let i=1;i<=input.tableCount;i++){const id=randomUUID();memory.teams.set(id,{id,sessionId,teamCode:String(i),displayName:`Table ${i}`,tokenHash:null,state:"not_joined",lastSeenAt:null});} }
    await event(sessionId,"created",{tableCount:input.tableCount,variant:input.variant}); res.status(201).json({sessionId,joinCode,displayToken});
  } catch(e){next(e);} });

  app.post("/api/decision-room/join", async(req,res,next)=>{try{
    if(rejectMissingDatabase(res))return; const input=joinSchema.parse(req.body); const session=await findSession(input.joinCode); if(!session){res.status(404).json({message:"Room not found"});return;} if(session.status==="ended"){res.status(409).json({message:"This room has ended"});return;}
    const teams=await getTeams(session.id); const team=teams.find(t=>t.teamCode.toLowerCase()===input.teamCode.toLowerCase()); if(!team){res.status(404).json({message:"Table code not found"});return;} if(team.tokenHash){res.status(409).json({message:"This table is already joined. Resume it on the original device or ask Adam to reset the room."});return;}
    const teamToken=token(), hash=sha(teamToken); if(db) await db.execute(sql`UPDATE workshop_teams SET token_hash=${hash},state='reading',last_seen_at=now() WHERE id=${team.id}::uuid`); else {team.tokenHash=hash;team.state="reading";team.lastSeenAt=new Date().toISOString();} await bump(session.id); res.json({teamToken,sessionId:session.id,joinCode:session.joinCode});
  }catch(e){next(e);}});

  app.get("/api/decision-room/sessions/:identifier/participant",async(req,res,next)=>{try{
    if(rejectMissingDatabase(res))return; const session=await findSession(req.params.identifier); if(!session){res.status(404).json({message:"Room not found"});return;} const provided=String(req.headers["x-team-token"]??""); const teams=await getTeams(session.id); const team=teams.find(t=>t.tokenHash&&matchesHash(provided,t.tokenHash)); if(!team){res.status(401).json({message:"Table access required"});return;} if(db)await db.execute(sql`UPDATE workshop_teams SET last_seen_at=now() WHERE id=${team.id}::uuid`); res.json(participantPayload(session,team,await getDecisions(session.id)));
  }catch(e){next(e);}});

  app.put("/api/decision-room/sessions/:identifier/decision",async(req,res,next)=>{try{
    if(rejectMissingDatabase(res))return; const input=decisionSchema.parse(req.body); const session=await findSession(req.params.identifier); if(!session){res.status(404).json({message:"Room not found"});return;} if(session.status!=="live"||input.roundNo!==session.activeRound||session.resultsVisible){res.status(409).json({message:"This round is not accepting responses"});return;} const provided=String(req.headers["x-team-token"]??""); const teams=await getTeams(session.id); const team=teams.find(t=>t.tokenHash&&matchesHash(provided,t.tokenHash)); if(!team){res.status(401).json({message:"Table access required"});return;} const existing=(await getDecisions(session.id,input.roundNo)).find(d=>d.teamId===team.id); if(existing?.isLocked){res.status(409).json({message:"This response is locked"});return;} const id=existing?.id??randomUUID();
    if(db) await db.execute(sql`INSERT INTO workshop_decisions(id,session_id,team_id,round_no,option_key,action,accepted_tradeoff,reversal_evidence,confidence,is_locked,locked_at,updated_at) VALUES(${id}::uuid,${session.id}::uuid,${team.id}::uuid,${input.roundNo},${input.optionKey??null},${input.action},${input.acceptedTradeoff},${input.reversalEvidence},${input.confidence},${input.lock},${input.lock?new Date():null},now()) ON CONFLICT(team_id,round_no) DO UPDATE SET option_key=excluded.option_key,action=excluded.action,accepted_tradeoff=excluded.accepted_tradeoff,reversal_evidence=excluded.reversal_evidence,confidence=excluded.confidence,is_locked=excluded.is_locked,locked_at=excluded.locked_at,updated_at=now()`);
    else memory.decisions.set(id,{id,sessionId:session.id,teamId:team.id,roundNo:input.roundNo,optionKey:input.optionKey??null,action:input.action,acceptedTradeoff:input.acceptedTradeoff,reversalEvidence:input.reversalEvidence,confidence:input.confidence,isLocked:input.lock,isFeatured:false,updatedAt:new Date().toISOString()});
    team.state=input.lock?"locked":"debating"; if(db)await db.execute(sql`UPDATE workshop_teams SET state=${team.state},last_seen_at=now() WHERE id=${team.id}::uuid`); await bump(session.id); res.json({saved:true,locked:input.lock});
  }catch(e){next(e);}});

  app.get("/api/decision-room/sessions/:identifier/console",async(req,res,next)=>{try{
    if(rejectMissingDatabase(res))return; const session=await findSession(req.params.identifier); if(!session){res.status(404).json({message:"Room not found"});return;} const displayToken=String(req.query.displayToken??""); if(!matchesHash(displayToken,session.displayTokenHash)){res.status(401).json({message:"Display access required"});return;} res.json(consolePayload(session,await getTeams(session.id),await getDecisions(session.id)));
  }catch(e){next(e);}});

  app.get("/api/decision-room/sessions/:identifier/admin",async(req,res,next)=>{try{
    if(!ensureAdmin(req,res)||rejectMissingDatabase(res))return; const session=await findSession(req.params.identifier); if(!session){res.status(404).json({message:"Room not found"});return;} res.json({...consolePayload(session,await getTeams(session.id),await getDecisions(session.id)),decisions:await getDecisions(session.id)});
  }catch(e){next(e);}});

  app.get("/api/decision-room/sessions/:identifier/export",async(req,res,next)=>{try{
    if(!ensureAdmin(req,res)||rejectMissingDatabase(res))return; const session=await findSession(req.params.identifier); if(!session){res.status(404).json({message:"Room not found"});return;} const teams=await getTeams(session.id); const decisions=await getDecisions(session.id); const teamNames=new Map(teams.map(t=>[t.id,t.displayName]));
    const header=["room","audience","table","round","option","action","accepted_tradeoff","reversal_evidence","confidence","locked","featured","updated_at"];
    const lines=[header.map(csvCell).join(","),...decisions.map(d=>[session.joinCode,session.variant,teamNames.get(d.teamId)??d.teamId,d.roundNo,d.optionKey,d.action,d.acceptedTradeoff,d.reversalEvidence,d.confidence,d.isLocked,d.isFeatured,d.updatedAt].map(csvCell).join(","))];
    res.setHeader("Content-Type","text/csv; charset=utf-8");res.setHeader("Content-Disposition",`attachment; filename="decision-room-${session.joinCode}.csv"`);res.send(`\uFEFF${lines.join("\r\n")}`);
  }catch(e){next(e);}});

  app.post("/api/decision-room/sessions/:identifier/actions",async(req,res,next)=>{try{
    if(!ensureAdmin(req,res)||rejectMissingDatabase(res))return; const input=actionSchema.parse(req.body); const session=await findSession(req.params.identifier); if(!session){res.status(404).json({message:"Room not found"});return;} const teams=await getTeams(session.id);
    if(input.action==="feature"){if(db)await db.execute(sql`UPDATE workshop_decisions SET is_featured=${input.featured} WHERE id=${input.decisionId}::uuid AND session_id=${session.id}::uuid`);else{const d=memory.decisions.get(input.decisionId);if(d&&d.sessionId===session.id)d.isFeatured=input.featured;}}
    else if(input.action==="reopen"){const team=teams.find(t=>t.id===input.teamId);if(!team){res.status(404).json({message:"Table not found"});return;} if(db){await db.execute(sql`UPDATE workshop_decisions SET is_locked=false,locked_at=NULL WHERE team_id=${team.id}::uuid AND round_no=${session.activeRound}`);await db.execute(sql`UPDATE workshop_teams SET state='debating' WHERE id=${team.id}::uuid`);}else{for(const d of Array.from(memory.decisions.values()))if(d.teamId===team.id&&d.roundNo===session.activeRound)d.isLocked=false;team.state="debating";}}
    else { let status=session.status,round=session.activeRound,visible=session.resultsVisible,started=session.roundStartedAt; if(input.action==="start"){status="live";started=new Date().toISOString();} if(input.action==="publish")visible=true; if(input.action==="advance"){round=Math.min(3,round+1);visible=false;started=new Date().toISOString();for(const t of teams)if(t.tokenHash)t.state="reading";} if(input.action==="end")status="ended"; if(input.action==="reset"){status="lobby";round=1;visible=false;started=null;for(const t of teams){t.state="not_joined";t.tokenHash=null;}for(const [id,decision] of Array.from(memory.decisions.entries()))if(decision.sessionId===session.id)memory.decisions.delete(id);}
      if(db){await db.execute(sql`UPDATE workshop_sessions SET status=${status},active_round=${round},results_visible=${visible},round_started_at=${started?new Date(started):null},ended_at=${status==="ended"?new Date():null} WHERE id=${session.id}::uuid`);if(input.action==="advance")await db.execute(sql`UPDATE workshop_teams SET state='reading' WHERE session_id=${session.id}::uuid AND token_hash IS NOT NULL`);if(input.action==="reset"){await db.execute(sql`DELETE FROM workshop_decisions WHERE session_id=${session.id}::uuid`);await db.execute(sql`UPDATE workshop_teams SET state='not_joined',token_hash=NULL,last_seen_at=NULL WHERE session_id=${session.id}::uuid`);}}else{session.status=status;session.activeRound=round;session.resultsVisible=visible;session.roundStartedAt=started;}}
    await event(session.id,input.action,input); await bump(session.id); res.json({ok:true});
  }catch(e){next(e);}});
}
