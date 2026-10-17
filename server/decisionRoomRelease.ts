/**
 * Decision Room — this site's production release of each edition.
 *
 * The one per-repo file in the scenario layer: d3smbmxdr releases the Ironvale
 * mining preview to new Agent 0 rooms in production; data3-cisco-live keeps them
 * on Riverbend (null). A DECISION_ROOM_AGENT0_SCENARIO environment variable,
 * when set, overrides this. Existing rooms are pinned and never affected.
 */
export const AGENT0_PRODUCTION_RELEASE: string | null = null;
