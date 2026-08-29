# Film production research

Updated 27 August 2026. This note records the evidence behind the production manifest. It contains no credentials.

## Verified Pixio contract

Authenticated Pixio model discovery returned:

- Model: `pixio/seedance-2.5-direct`
- Provider: `pixio`
- Company: ByteDance
- Modes: `text`, `frames`, `omni`
- Duration: 4–30 seconds
- Resolution: 480p or 720p
- Aspect ratios: adaptive, 21:9, 16:9, 4:3, 1:1, 3:4, 9:16
- Reference capacity: up to 30 images, 10 videos, and 10 audio clips
- Relevant parameters: `input_mode`, `prompt`, `firstFrame`, `endFrame`, `images_list`, `videos_list`, `audio_list`, `duration`, `resolution`, `ratio`, `generate_audio`, `watermark`, and `seed`

Pixio’s model card shows 390 credits because the default is five seconds. The model options explicitly label 720p as 78 credits per second. An authenticated call to `POST /api/v1/generations/estimate` with `input_mode: omni`, `duration: 8`, `resolution: 720p`, and `ratio: 16:9` returned 624 credits. A second authenticated estimate with `generate_audio: true` and an empty `audio_list` also returned 624 credits, so the native SFX-only plan does not change the first-pass estimate.

The production plan therefore costs:

- 624 credits per eight-second source
- 6,864 credits for 11 first-pass sources
- 13,728 credits for a complete first pass plus one alternate for every shot
- Planning balance: 13,851 credits, leaving 123 after two complete passes

Re-estimate immediately before every generation because platform pricing can change.

## How Omni references map

Pixio’s direct-model placeholder says to use `@image1`, `@video1`, or `@audio1` in Omni prompts. The production convention is:

- `images_list[0]` → `@image1`
- `images_list[1]` → `@image2`
- `videos_list[0]` → `@video1`
- `audio_list[0]` → `@audio1`

The ordering in each shot card is therefore part of the prompt contract. Upload references, collect Pixio’s clean public URLs, then place those URLs into the arrays in exactly that order.

For this production, `audio_list` stays empty. Seedance generates synchronised native foley from the visible action and explicit SFX instructions; it must not inherit the ElevenLabs narration or Suno score. An `@audio` reference is reserved for a future deliberately approved foley reference only.

## Prompt construction rules applied

Official ByteDance and BytePlus guidance treats Seedance as a multimodal director operating over spatial and temporal layers. The production prompts apply that guidance as follows:

1. **Name the task.** These are new multimodal reference generations, not edits or extensions.
2. **Bind each asset.** State exactly whether a reference controls subject identity, module geometry, composition, motion, camera language, material, or sound.
3. **Put the strictest asset first.** Shot composition is always `@image1`.
4. **Define the subject with stable traits.** Keep the navy jacket, slate trousers, black boots, hair, and body proportions fixed.
5. **Use single-view character references.** BytePlus warns that a three-view character sheet can be misread as multiple subjects and increase twin artefacts. The contact sheet remains a human reference; Seedance uses `02a`, `02b`, or `02c` crops.
6. **Write a timestamped storyboard.** Every eight-second prompt has setup, meaningful action completed by six seconds, and a two-second stable edit handle.
7. **One action and one camera move.** This lowers contradictory motion instructions and keeps the six usable seconds legible.
8. **Constrain failure modes explicitly.** No duplicate protagonist, extra blocks, floating modules, generated text, logos, geometry warping, camera shake, style drift, or unsafe lifting.
9. **Separate the audio roles.** Native Seedance audio is a synchronised diegetic SFX stem only. ElevenLabs owns narration and Suno owns music. Prompts explicitly reject speech, vocals, music, unexplained rhythm, and tonal contamination.
10. **Use post-production for truth.** FY percentages, lifecycle words, captions, and approved Data<sup>#</sup>3 branding are deterministic overlays.
11. **Reroll one variable.** Change the seed first; keep prompt and reference order fixed. If the failure is reference weighting, adjust order and document why.

For character work, use AI-generated or properly licensed references only. No employee or customer likeness is used in this plan.

## Suno v5.5 Basic workflow

The score will be generated with model v5.5 in Simple/Basic mode and the Instrumental toggle enabled. Suno's current Simple-mode guidance calls for one description of what the user wants to hear; it allows genre, instrumentation, mood, and structural ideas inside that description. It does not expose the separate Advanced `Exclude Styles` field.

The production prompt is therefore one concise, positively framed musical brief. It describes the restrained electronic palette, 96 BPM pulse, repeating three-note motif, gradual interlocking build, and calm major-add-nine resolution. It deliberately omits frame-accurate timestamps because Basic mode cannot be treated as a deterministic timeline engine. The final one-minute excerpt will be selected from both generated versions after the revised narration is locked, cut on musical phrases, and mixed as a separate stem.

The long exclusion list remains only a human review checklist. It is not pasted into a Basic-mode field that does not exist. Use the Instrumental toggle; reject or reroll takes with vocals, trailer scoring, epic drums, EDM drops, or a busy lead rather than overloading the positive prompt.

## Sources

- ByteDance Seed, “One-take Creation, Flexible Referencing: Introducing Seedance 2.5”: https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5
- ByteDance Seed, Seedance 2.5 model page: https://seed.bytedance.com/en/seedance2_5
- BytePlus, Enhanced/basic video generation: https://docs.byteplus.com/en/docs/byteplus_las/video_gen_enhanced
- BytePlus, Dreamina Seedance prompt guide: https://docs.byteplus.com/api/docs/ModelArk/2222480
- Pixio authenticated integration docs: https://beta.pixio.myapps.ai/home/integrations/api-docs
- Pixio Seedance catalogue: https://beta.pixio.myapps.ai/maker
- Pixio service status: https://beta.pixio.myapps.ai/status
- Suno Help, Make a song in Simple Mode: https://help.suno.com/en/articles/2462273
- Suno Help, What's New in v5.5: https://help.suno.com/en/articles/11362305

## Before a full batch

- Check Pixio service status.
- Confirm the API key through a read-only `/api/v1/credits` call without printing it.
- Estimate the exact shot payload.
- Generate one continuity-critical shot first.
- Review identity, module geometry, physical contact, camera instruction, edit handle, and audio isolation before starting the remaining batch.
- Reject native audio containing music, speech, vocalisation, an unexplained rhythmic loop, or a tonal drone; do not bury contamination beneath narration or score.
