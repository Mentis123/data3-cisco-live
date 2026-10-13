import type { ResponseArchetypeKey } from "./incident-response-analysis";
import portrait0 from "../../assets/response-profiles/controlled.jpg";
import portrait1 from "../../assets/response-profiles/evidence.jpg";
import portrait2 from "../../assets/response-profiles/rapid.jpg";
import portrait3 from "../../assets/response-profiles/adaptive.jpg";
import portrait4 from "../../assets/response-profiles/adaptive-controlled.jpg";
import portrait5 from "../../assets/response-profiles/adaptive-evidence.jpg";
import portrait6 from "../../assets/response-profiles/adaptive-rapid.jpg";
import portrait7 from "../../assets/response-profiles/controlled-evidence.jpg";
import portrait8 from "../../assets/response-profiles/controlled-rapid.jpg";
import portrait9 from "../../assets/response-profiles/evidence-rapid.jpg";

// Portraits are fictional characters illustrating response styles, not player identities.
const profilePortraits: Record<ResponseArchetypeKey, string> = {
  "controlled": portrait0,
  "evidence": portrait1,
  "rapid": portrait2,
  "adaptive": portrait3,
  "adaptive-controlled": portrait4,
  "adaptive-evidence": portrait5,
  "adaptive-rapid": portrait6,
  "controlled-evidence": portrait7,
  "controlled-rapid": portrait8,
  "evidence-rapid": portrait9,
};
export const profilePortraitFor = (key: ResponseArchetypeKey) => profilePortraits[key];


export { default as skynetPortrait } from "../../assets/response-profiles/skynet.jpg";
