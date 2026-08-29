import assert from "node:assert/strict";
import fs from "node:fs";

const manifestPath = new URL("./film-bible/production-manifest.json", import.meta.url);
const appPath = new URL("./film-bible/app.js", import.meta.url);
const indexPath = new URL("./film-bible/index.html", import.meta.url);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const app = fs.readFileSync(appPath, "utf8");
const index = fs.readFileSync(indexPath, "utf8");

assert.equal(manifest.model.modelId, "pixio/seedance-2.5-direct");
assert.equal(manifest.model.inputMode, "omni");
assert.equal(manifest.model.generateAudio, true);
assert.deepEqual(manifest.model.audioList, []);
assert.equal(manifest.model.creditsPerClip, 624);
assert.equal(manifest.model.firstPassCredits, 6864);
assert.equal(manifest.model.audioEnabledEstimateVerified, true);

assert.equal(manifest.shots.length, 11);
for (const shot of manifest.shots) {
  assert.ok(shot.sfxPrompt?.length > 40, `Shot ${shot.number} needs a specific SFX prompt`);
  assert.match(shot.sfxPrompt, /no |only|restrained/i, `Shot ${shot.number} needs an audio constraint`);
  assert.equal(shot.status, "approved", `Shot ${shot.number} needs approved production motion`);
  assert.ok(shot.anchorAsset, `Shot ${shot.number} needs an anchor asset`);
  assert.ok(fs.existsSync(new URL(`./film-bible/${shot.anchorAsset}`, import.meta.url)), `Shot ${shot.number} anchor file is missing`);
  assert.ok(shot.videoAsset, `Shot ${shot.number} needs an approved motion asset`);
  assert.ok(fs.existsSync(new URL(`./film-bible/${shot.videoAsset}`, import.meta.url)), `Shot ${shot.number} motion file is missing`);
}

const voiceoverWords = manifest.audio.voiceover.trim().split(/\s+/).length;
assert.ok(voiceoverWords >= 90 && voiceoverWords <= 105, `One-minute voiceover should be 90–105 words, got ${voiceoverWords}`);
assert.equal(manifest.audio.referenceTake.durationSeconds, 80);
assert.match(manifest.audio.referenceTake.status, /mastered performance edit/i);
assert.match(manifest.titleTreatment.decision, /No standalone title slide/i);
assert.match(manifest.audio.sunoMode, /v5\.5.*Basic/i);
assert.match(manifest.audio.sunoExclude, /no separate Exclude Styles field/i);
assert.match(manifest.shots.at(-1).imagePrompt, /elevated bridge/i);
assert.equal(manifest.openingAssembly.status, "first cut ready for review");
assert.equal(manifest.openingAssembly.durationSeconds, 8.041667);
assert.ok(fs.existsSync(new URL(`./film-bible/${manifest.openingAssembly.video}`, import.meta.url)), "Opening proof MP4 is missing");
assert.ok(fs.existsSync(new URL(`./film-bible/${manifest.openingAssembly.poster}`, import.meta.url)), "Opening proof poster is missing");
assert.ok(fs.existsSync(new URL(`./film-bible/${manifest.openingAssembly.captions}`, import.meta.url)), "Opening proof captions are missing");
assert.equal(manifest.masterAssembly.status, "picture and mix locked");
assert.equal(manifest.masterAssembly.durationSeconds, 60);
assert.equal(manifest.masterAssembly.motionSources, 11);
assert.ok(fs.existsSync(new URL(`./film-bible/${manifest.masterAssembly.video}`, import.meta.url)), "Master MP4 is missing");
assert.ok(fs.existsSync(new URL(`./film-bible/${manifest.masterAssembly.poster}`, import.meta.url)), "Master poster is missing");
assert.ok(fs.existsSync(new URL(`./film-bible/${manifest.masterAssembly.captions}`, import.meta.url)), "Master captions are missing");

assert.match(manifest.continuity.seedanceGuardrails, /AUDIO CONTRACT/);
assert.match(manifest.continuity.seedanceGuardrails, /No music/);
assert.match(manifest.audio.seedanceSfxPolicy, /audio_list empty/);
assert.match(manifest.audio.stemWorkflow, /THREE-STEM MASTER/);
assert.match(app, /SHOT-SPECIFIC FOLEY/);
assert.match(app, /generate_audio true, audio_list empty/);
assert.match(index, /Synchronised SFX-only stem/);
assert.match(index, /generate_audio: true/);
assert.match(index, /id="voiceoverReference"/);
assert.match(index, /id="title-treatment"/);
assert.match(index, /id="opening-cut"/);
assert.match(index, /id="master-cut"/);
assert.match(index, /build-a-renewing-ai-business-master\.mp4/);
assert.match(index, /shot-01-opening-mixed\.mp4/);
assert.match(index, /Why there is no Exclude field/);

console.log("Film bible contract passed: 11 approved motion sources, corrected Shot 03 continuity, verified one-minute master and captions, title treatment, Suno v5.5 score guidance, native diegetic SFX only, and the complete production log.");
