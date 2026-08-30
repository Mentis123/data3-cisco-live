import {
  analyseResponse,
  responseArchetypes,
} from "../client/src/pages/alpha2026/incident-response-analysis";
import { incidents } from "../client/src/pages/alpha2026/incident-v04-data";
import type { IncidentOption } from "../client/src/pages/alpha2026/incident-v03-data";

const allArchetypes = new Set<string>();

for (const incident of incidents) {
  if (incident.stages.length !== 5) throw new Error(`${incident.id} must have five decisions.`);

  const scores = new Set<number>();
  const archetypes = new Set<string>();
  const archetypeCounts = new Map<string, number>();

  const walk = (stageIndex: number, choices: IncidentOption[]) => {
    if (stageIndex === incident.stages.length) {
      const score = choices.reduce((total, option) => total + option.points, 0);
      const analysis = analyseResponse(choices.map((option) => ({ option })));
      scores.add(score);
      archetypes.add(analysis.key);
      allArchetypes.add(analysis.key);
      archetypeCounts.set(analysis.key, (archetypeCounts.get(analysis.key) ?? 0) + 1);
      return;
    }

    const stage = incident.stages[stageIndex];
    if (stage.options.length !== 3) throw new Error(`${incident.id}/${stage.id} must have three options.`);
    if (stage.takeaway.trim().split(/\s+/).length > 12) {
      throw new Error(`${incident.id}/${stage.id} "Why this matters" copy is longer than 12 words.`);
    }
    for (const option of stage.options) {
      if (option.points < 14 || option.points > 20) {
        throw new Error(`${option.id} has ${option.points} points; expected 14–20.`);
      }
      walk(stageIndex + 1, [...choices, option]);
    }
  };

  walk(0, []);
  const orderedScores = [...scores].sort((first, second) => first - second);
  const minimum = orderedScores[0];
  const maximum = orderedScores.at(-1);
  if (minimum !== 70 || maximum !== 100) {
    throw new Error(`${incident.id} score range is ${minimum}–${maximum}; expected 70–100.`);
  }
  if (scores.size < 20) throw new Error(`${incident.id} has only ${scores.size} distinct scores.`);
  if (archetypes.size < 6) throw new Error(`${incident.id} has only ${archetypes.size} reachable archetypes.`);
  const [largestArchetype, largestCount] = [...archetypeCounts].sort((first, second) => second[1] - first[1])[0];
  if (largestCount > 100) {
    throw new Error(`${incident.id} overuses ${largestArchetype} for ${largestCount} of 243 paths.`);
  }

  console.log(`${incident.number} ${incident.title}: ${scores.size} scores, ${archetypes.size} archetypes, 70–100; largest archetype ${largestArchetype} ${largestCount}/243.`);
}

if (allArchetypes.size < 9) {
  throw new Error(`Only ${allArchetypes.size} archetypes are reachable across the series.`);
}

const profileTitles = new Set(Object.values(responseArchetypes).map((profile) => profile.title));
if (profileTitles.size !== 10) throw new Error(`Expected 10 unique archetype titles; found ${profileTitles.size}.`);

console.log(`${allArchetypes.size} distinct player archetypes are reachable across the four incidents.`);
