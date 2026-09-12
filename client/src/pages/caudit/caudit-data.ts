export type PromptGroup = "NotebookLM" | "Nano Banana Pro" | "Seedance 2.5" | "Grok Imagine" | "Suno" | "ElevenLabs";

export type PromptItem = {
  id: string;
  group: PromptGroup;
  title: string;
  purpose: string;
  duration?: string;
  input?: string;
  prompt: string;
  secondaryLabel?: string;
  secondaryText?: string;
  image?: string;
  video?: string;
  alt?: string;
  review?: string;
};

export const groups: PromptGroup[] = ["NotebookLM", "Nano Banana Pro", "Seedance 2.5", "Grok Imagine", "Suno", "ElevenLabs"];

const styleLock = `STYLE LOCK — Premium cyberpunk-corporate cinema for senior Australian and New Zealand university leaders.

Deep Data#3 blue-black (#000025) base, electric cyan (#00AEFF) and teal accents, with violet used sparingly for depth. High contrast, controlled volumetric haze, subtle reflective surfaces, realistic materials, restrained anamorphic flares, natural depth of field and fine film grain.

Optimistic, clean and credible — never dystopian. Keep the visual world relevant to higher education, enterprise technology, infrastructure and human progress.

16:9 landscape. Photorealistic. Corporate-grade. No generated text, logos, presentation interface, readable signage, recognisable real people, copyrighted characters, decay, aggression, heavy rain or generic glowing AI brains.`;

const productionMedia: Record<string, { image: string; video?: string; alt: string; review: string }> = {
  "sd-p02-campus": { image: "/caudit/O3_FUTURE_CAMPUS.png", video: "/caudit/P02_SEEDANCE.mp4", alt: "Connected university campus at blue hour", review: "Final uses 00:00–00:13. A small generated cloud/network motif remains in this accepted section; the later enlarged motif is excluded." },
  "sd-p03-lifecycle": { image: "/caudit/O4_COMPLEXITY_PEOPLE_FREE.png", video: "/caudit/P03_SEEDANCE.mp4", alt: "Abstract licensing and operational layers around a decision node", review: "Approved rerender · clean 21-second orbit, distinct system layers and a single closing cyan route with no generated lettering." },
  "sd-p04-flex": { image: "/caudit/O5_SIGNAL_PEOPLE_FREE.png", video: "/caudit/P04_SEEDANCE.mp4", alt: "Three luminous service paths leading to a university", review: "Raw source contains generated lettering around 00:04–00:15. Final uses only 00:00.10–00:03.85 and 00:15.30–00:19.75, bridged by an editorial support comparison on a clean still. No reverse playback." },
  "sd-p05-support": { image: "/caudit/O6_HANDOFF.png", video: "/caudit/P05_SEEDANCE.mp4", alt: "Centred luminous support corridor", review: "Approved first pass · clean support corridor and usable white transition." },
  "sd-p06-capability": { image: "/caudit/C1_CONNECTED_CAPABILITY_PEOPLE_FREE.png", video: "/caudit/P06_SEEDANCE.mp4", alt: "Six connected capability streams around a university campus", review: "Approved first pass · six streams remain distinct and settle on the university hub without lettering." },
  "sd-p07-value": { image: "/caudit/C2_CONTINUING_VALUE_PEOPLE_FREE.png", video: "/caudit/P07_SEEDANCE.mp4", alt: "Three continuing-value patterns surrounding a university", review: "Approved first pass · three support patterns remain separate and resolve into a warm campus composition." },
  "sd-p08-close": { image: "/caudit/C4_ENDFRAME.png", video: "/caudit/P08_SEEDANCE.mp4", alt: "Clean blue-black cinematic end field with cyan edge light", review: "Approved first pass · typography-free closing field with a clean final hold." },
};

export const promptItems: PromptItem[] = [
  {
    id: "nlm-visual",
    group: "NotebookLM",
    title: "Source recovery brief",
    purpose: "Uses NotebookLM only as a grounded source assistant, not as the finished video generator.",
    input: "NotebookLM chat with the approved deck as its only source",
    duration: "Reference only",
    prompt: `Using only the approved CAUDIT 2026 LSP presentation, produce a factual coverage checklist for an approximately three-minute narrated film.

Group repeated slide content into one connected story. Preserve every material point about licensing, higher-education experience, account support, the agreement lifecycle, flexible support, MyD3, Premier Support, Azure, broader Microsoft capability, service engagement, continuing value and onboarding.

Clearly identify which services are optional or separately scoped. Omit claims marked REQUIRES OWNER VALIDATION. Do not draft visuals, manufacture statistics, add product claims or write a slide-by-slide narration.

Return a concise checklist that can be compared against the locked master voiceover.`,
  },
  {
    id: "nlm-focus",
    group: "NotebookLM",
    title: "Locked final-film coverage brief",
    purpose: "Defines the information payload for the final cinematic edit; the narration remains the approved continuous master.",
    duration: "3:05 film · 3:02 narration",
    input: "Editorial reference; do not ask NotebookLM to render the final video",
    prompt: `Build one connected executive narrative for senior university IT, commercial and procurement leaders in Australia and New Zealand around:
1. Microsoft licensing as the starting point of the Data#3 relationship.
2. Dedicated higher-education experience and accountable account support.
3. The licensing lifecycle: agreement management, licensing guidance, commercial optimisation, customer advocacy and Microsoft escalation.
4. Flexible support aligned to each institution’s internal capability.
5. Proportionate visibility and control through MyD3.
6. Broader, separately scoped capability across Azure, Modern Work, Security, Data and AI, Copilot, applications, automation and technical support.
7. Continuing value through sustained capability, flexible access to specialist expertise and standing operational support.
8. A clear agreement-cycle pathway from scope confirmation to ongoing support.

Clearly distinguish core licensing services from optional or separately purchased services. Never imply that Premier Support, Azure, managed services, consulting, projects or wider Microsoft capabilities are included in the licensing agreement.

Do not include pricing, contract terms, minimum commitments, team ratios or commercial guardrails. Do not guarantee savings, optimisation, incident resolution, risk reduction or business outcomes.

Use confident, concise and consultative Australian business English. Synthesise the source instead of reading slides aloud. Omit any claim explicitly marked REQUIRES OWNER VALIDATION. The locked ElevenLabs master script is the production authority.`,
  },
  {
    id: "nlm-correction",
    group: "NotebookLM",
    title: "Coverage QA pass",
    purpose: "Checks the locked script without inviting a rewrite.",
    input: "NotebookLM chat after pasting the locked master script",
    prompt: `Compare the locked master voiceover with the approved CAUDIT presentation.

Report only: missing material points, unsupported claims, accidental inclusion claims, repeated ideas and wording that could be shortened. Do not rewrite the script unless a factual correction is required. Treat all slide notes as source context and validation caveats, not production instructions.`,
  },
  {
    id: "sd-p01-cover",
    group: "Seedance 2.5",
    title: "P01 — The PowerPoint comes alive",
    purpose: "The opening fake-out: begin on the exact real cover slide, then enter its abstract ribbon world.",
    duration: "12-second source · master 00:00–00:12 · 720p · 16:9",
    input: "@Image1 = P01_COVER_SLIDE.png · Generate Audio OFF",
    image: "/caudit/P01_COVER_SLIDE.png",
    video: "/caudit/P01_COVER_TRANSITION.mp4",
    alt: "CAUDIT presentation cover titled Delivering the Digital Future in Education",
    review: "Approved first pass · supplied cover remains intact and the camera exits into the ribbon corridor.",
    prompt: `Generate one continuous 12-second 16:9 720p image-to-video shot from @Image1.

SOURCE-ARTWORK CONTRACT: @Image1 is the exact approved first frame. Preserve the supplied Data#3 logo, title, subtitle, colours, spacing, spelling and typography as a single flat source plate. Do not redraw, retype, replace, restyle or invent any lettering. Do not generate any new text.

0.0–2.5s: Hold the complete cover slide perfectly still and pin-sharp so it reads as an ordinary PowerPoint opening. No camera movement.

2.5–7.0s: Restrict motion to the glossy abstract ribbons on the right half. They slowly breathe, catch cyan and magenta light and reveal subtle physical depth. Keep the left-side logo, title and subtitle completely unchanged and motionless.

7.0–10.5s: Execute one smooth, deliberate camera push into the right-side ribbon opening. The entire left text area leaves frame as one intact flat plate because of the camera move. Never morph or dissolve individual letters.

10.5–12.0s: The typography is fully out of frame. Settle inside a deep blue-black ribbon corridor with cyan and magenta edge light, leaving a clean forward path for the next shot.

No cuts, montage, page turn, cursor, presentation controls, new objects, people, additional logos, additional text, glyph distortion, melting letters, camera shake, rotation, speed ramp or watermark. Generate no audio.`,
  },
  ...[
    ["nbp-o2", "O2 — The slide cannot contain the story", "First frame for the bass-drop transformation.", "/caudit/O2_SLIDE_BREAK.png", "Dark presentation surface separating to reveal a cyan-lit corridor", `The abstract physical surface of a premium dark corporate presentation begins to separate into precise glass-like layers, as if the flat slide can no longer contain the luminous world behind it. Hairline cyan and teal light pours through sharp cracks. The centre opens onto a deep illuminated corridor. A few controlled fragments move towards camera, frozen at the decisive first instant of the break.

Symmetrical 16:9 composition with a strong central vanishing point and clean edges for compositing the real title slide. Photorealistic enterprise cinema, optical glass, satin-black layers, volumetric haze and one restrained anamorphic flare.

No explosion, bent or molten fragments, readable text, logos, interface, people or watermark.`],
    ["nbp-o3", "O3 — Future university environment", "Establishes the credible near-future campus world.", "/caudit/O3_FUTURE_CAMPUS.png", "Connected university campus at blue hour with cyan and teal light paths", `A sweeping blue-hour establishing view of a credible Australian or New Zealand university campus reimagined as a connected enterprise technology environment. Contemporary glass research buildings and familiar sandstone elements surround a central pedestrian spine. Subtle data-light threads connect learning, research, security and cloud infrastructure. Small, natural groups of students and staff establish human scale.

Elevated 24 mm cinematic lens, forward-leading walkway and deep layered perspective. Warm interior light balances cyan and teal guidance light with gentle atmospheric depth.

Architecture must remain physically plausible. No readable signage, logos, hologram clichés, dystopian rain, identifiable people or watermark.`],
    ["nbp-o4", "O4 — The noise", "Visualises licensing and operational complexity without panic or danger.", "/caudit/O4_COMPLEXITY_PEOPLE_FREE.png", "Abstract decision node surrounded by complex luminous system layers", `An elegant circular glass-and-brushed-metal decision node stands at the centre of a modern operations environment while licensing obligations, cloud systems, cyber security signals, data flows, AI opportunities and operational demands form an overwhelming but orderly spatial storm around it.

Use distinct abstract forms: nested translucent agreement planes, network arcs, shield-like light fields, clustered compute nodes and branching service paths. Medium-wide low angle with the subject centred and strong foreground-to-background depth. Communicate cognitive complexity, never danger.

No readable text, written documents, logos, recognisable person, duplicated anatomy, dystopian mood or watermark.`],
    ["nbp-o5", "O5 — The signal", "Resolves the noise into three clear narrative paths.", "/caudit/O5_SIGNAL_PEOPLE_FREE.png", "Three ordered light paths towards a university", `The same university technology world is now calm and intelligible. Exactly three luminous routes resolve from residual complexity and lead from a dark circular platform towards a bright, credible campus. The foreground is completely people-free.

Route one uses precise layered arcs to suggest commercial clarity. Route two forms a stable protected corridor to suggest operational confidence. Route three rises towards research spaces to suggest purposeful evolution. The routes share an origin and destination but remain clearly distinct.

Wide over-the-shoulder 16:9 frame, optimistic light and realistic materials. Exactly three primary pathways. No labels, text, logos, extra people, glowing brain or watermark.`],
    ["nbp-o6", "O6 — Handoff tunnel", "Creates a clean transition into the NotebookLM explainer.", "/caudit/O6_HANDOFF.png", "Cyan and teal light corridor converging on a bright horizon", `A clean forward-facing corridor built from connected cyan and teal light rails converges on a white-cyan horizon. Restrained architectural fins and abstract data filaments stream along the far edges while the central route remains simple, calm and perfectly clear.

Symmetrical 16:9 transition plate with a centred vanishing point and unobstructed middle third. Highly dimensional, premium enterprise visual effects with controlled motion energy.

No text, logos, people, interface elements, rotation, centre clutter or watermark.`],
    ["nbp-c1", "C1 — Connected capability", "Shows multiple separately scoped capabilities connecting through one relationship.", "/caudit/C1_CONNECTED_CAPABILITY_PEOPLE_FREE.png", "Six distinct technology streams connecting around a university campus", `A modern university campus forms the central hub of a connected technology ecosystem. Six distinct but harmonious streams approach from visually different domains: cloud compute, collaboration spaces, cyber security operations, data platforms, responsible AI capability and technical support.

Each stream keeps its own form and remains separate until it joins a stable orbit around the institution. The image must communicate access to connected capabilities, not a bundled product. Elevated wide frame with clean spatial separation and credible architecture.

No text, logos, familiar vendor icons, interface, fantasy city or watermark.`],
    ["nbp-c2", "C2 — Three ways capability supports the journey", "Represents sustained, flexible and standing access patterns.", "/caudit/C2_CONTINUING_VALUE_PEOPLE_FREE.png", "Three distinct support patterns surrounding a university environment", `A sophisticated cinematic metaphor for exactly three complementary access patterns supporting one university environment.

Pattern one is a continuous illuminated team pathway, steady and always connected. Pattern two is an adaptable specialist stream that branches cleanly towards two changing technical challenges and can rejoin. Pattern three is a stable protective operational halo surrounding the campus. All three work together while remaining unmistakably distinct.

Wide three-quarter aerial view with realistic materials and spatial logic. Exactly three primary patterns. No text, pricing, commercial diagrams, contract imagery, logos, people or watermark.`],
    ["nbp-c3", "C3 — Human payoff", "Returns the story to people, confidence and institutional progress.", "/caudit/C3_HUMAN_PAYOFF.png", "Students, researchers and staff moving naturally through a modern university", `A warm, candid scene in a contemporary Australian or New Zealand university. A diverse mix of students, researchers, teaching staff and operations staff move naturally through a shared campus atrium and outdoor threshold. Connected technology appears only as subtle credible infrastructure: secure access points, research displays with unreadable abstract content and soft cyan wayfinding light.

Eye-level 35 mm editorial photography, authentic motion and small natural groups. Warm late-afternoon human light balances cool cyan and teal ambient accents.

No one looks at camera. No recognisable real people, readable signage, logos, staged team-around-a-laptop cliché, guaranteed-outcome symbolism or watermark.`],
    ["nbp-c4", "C4 — Endframe base", "Provides clean space for the approved wordmark and closing message.", "/caudit/C4_ENDFRAME.png", "Minimal deep navy endframe with restrained cyan and teal light", `A near-minimal cinematic background in deep Data#3 blue-black with subtle cyan and teal gradient light, sparse controlled atmospheric particles and one restrained horizontal anamorphic flare.

Perfectly balanced 16:9 landscape. Keep the centre and lower-centre pristine for the real approved wordmark and closing statement. Confine visual interest to the outer edges. Calm, elegant, resolved and hopeful.

No text, logos, objects, people, logo-like shapes, bright detail behind the central safe area or watermark.`],
  ].map(([id, title, purpose, image, alt, prompt]) => ({ id, title, purpose, image, alt, group: "Nano Banana Pro" as const, prompt: `${styleLock}\n\nSHOT — ${prompt}` })),
  ...[
    ["sd-p02-campus", "P02 — Education relationship", "18-second source · master 00:12–00:36", "@Image1 = O3_FUTURE_CAMPUS.png · Generate Audio OFF", "Higher-education experience, local accountability and national specialist support.", `Generate one continuous 18-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve every building, path, light source and existing distant person. Keep the Australian or New Zealand university architecture physically credible.

0.0–4.0s: Hold the wide campus composition with only natural distant pedestrian movement and barely perceptible atmospheric depth.

4.0–14.0s: Subtle cyan and teal data-light threads begin travelling between the sandstone, glass research spaces and central campus path, expressing a connected support relationship. The camera makes one slow forward aerial glide, descending slightly towards the illuminated walkway. Keep the motion calm enough to carry detailed narration.

14.0–18.0s: The connecting threads settle into a coherent network. End with the central walkway leading cleanly towards camera-right for an editorial cut.

No new buildings, crowds, signs, text, logos, interface, scene replacement, fast flight, camera roll, face morphing or watermark. Generate no audio.`],
    ["sd-p03-lifecycle", "P03 — The licensing lifecycle", "21-second source · master 00:36–01:01", "@Image1 = O4_COMPLEXITY_PEOPLE_FREE.png · Generate Audio OFF", "Agreement administration, licensing guidance, optimisation, advocacy and escalation.", `Generate one continuous 21-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve the central glass-and-metal decision node, the room geometry and the distinct abstract licensing, cloud, security, data and operational layers. No layer may contain readable symbols.

0.0–6.0s: Hold the decision node stable while the separate system layers move with restrained complexity around it. The camera begins one slow 20-degree orbit at constant height.

6.0–16.0s: Without changing scene, the layers progressively align into an ordered circular workflow: agreement planes, licensing signals, consumption arcs, scenario branches and one clean escalation route. Each family remains visually distinct; nothing becomes a literal diagram.

16.0–21.0s: The ordered workflow stabilises around the decision node. A single cyan route opens ahead as the camera completes its orbit and settles.

No people, faces, bodies, text, letters, numbers, written documents, logos, dashboards, interface panels, symbols, morphing, alarms, danger, rapid cuts, camera shake or watermark. Generate no audio.`],
    ["sd-p04-flex", "P04 — Support shaped to the institution", "20-second source · master 01:01–01:20", "@Image1 = O5_SIGNAL_PEOPLE_FREE.png · Generate Audio OFF", "Flexible support levels and proportionate MyD3 visibility without a literal dashboard.", `Generate one continuous 20-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve the people-free foreground platform, campus horizon and exactly three primary luminous routes. The routes are abstract service paths, never labelled.

0.0–5.0s: Residual visual noise drains calmly into the three existing routes while the camera holds its central composition.

5.0–15.0s: Each route illuminates once in sequence at a different intensity, expressing core administration, deeper specialist support and standing visibility. A set of clean translucent planes rises briefly beside the paths like controlled windows into the same system, but contains no interface or symbols. Begin one gentle forward push.

15.0–20.0s: The translucent planes settle and the three routes remain separate, proportionate and connected to the same bright campus destination. End on a stable, intelligible composition.

Exactly three main routes. No people, faces, bodies, labels, text, numbers, dashboards, logos, contracts, hard-sell imagery, path duplication, camera roll or watermark. Generate no audio.`],
    ["sd-p05-support", "P05 — Operational support pathway", "20-second source · master 01:20–01:59", "@Image1 = O6_HANDOFF.png · Generate Audio OFF", "Separately scoped Premier Support and Azure operations as accountable pathways, not inclusions.", `Generate one continuous 20-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve the centred luminous corridor, strong vanishing point and clean blue-black, cyan and teal palette.

0.0–6.0s: Hold a steady forward path while restrained edge filaments flow backwards. Keep the centre clear and calm under narration.

6.0–15.0s: Two secondary support lanes appear alongside the central path without merging into it. One maintains a steady protective pulse; the other reveals measured cloud-like infrastructure depth. Their visual separation must make them feel optional and deliberately connected, not automatically included.

15.0–20.0s: The camera makes one smooth acceleration towards the bright horizon while all three lanes remain visibly distinct. End in a controlled cyan-white occlusion for a clean cut.

No text, icons, labels, logos, people, dashboards, literal clouds, incident alarms, scene replacement, spin, camera shake, excessive centre blur or watermark. Generate no audio.`],
    ["sd-p06-capability", "P06 — Connected Microsoft capability", "19-second source · master 01:59–02:18", "@Image1 = C1_CONNECTED_CAPABILITY_PEOPLE_FREE.png · Generate Audio OFF", "Broader separately scoped capability across Modern Work, security, data and AI, applications and automation.", `Generate one continuous 19-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve the central university hub and all six distinct capability streams. Do not merge, multiply or label the streams.

0.0–5.0s: Hold the complete connected-capability composition with slow ambient movement inside each existing stream.

5.0–14.0s: The six streams travel smoothly towards the university, complete one restrained partial orbit and connect through separate points around the hub. The camera makes one slow confident push with controlled parallax.

14.0–19.0s: One subtle pulse passes from the hub back through every stream, showing a two-way relationship. Settle with all six streams still distinct and the institution visually central.

No text, labels, icons, logos, new buildings, new people, fantasy magic, stream duplication, merging, camera shake, hard cuts or watermark. Generate no audio.`],
    ["sd-p07-value", "P07 — Continuing value as priorities change", "16-second source · master 02:18–02:35", "@Image1 = C2_CONTINUING_VALUE_PEOPLE_FREE.png · optional 3-second cutaway to C3_HUMAN_PAYOFF.png in the edit · Generate Audio OFF", "Consulting, services, projects and operations supporting changing institutional priorities.", `Generate one continuous 16-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve exactly three distinct support patterns around the credible university environment.

0.0–5.0s: The continuous pathway maintains a steady flow and the operational halo remains calm and stable. The camera begins one gentle lateral move with a slight forward drift.

5.0–12.0s: The adaptable specialist stream branches briefly towards two emerging needs, illuminates them without labels, then rejoins the wider relationship. The other patterns remain active and visually separate.

12.0–16.0s: All three patterns balance around the campus as warm human light grows subtly in the learning spaces. End on a stable frame suitable for a brief cutaway to the approved C3 human-payoff still.

No text, pricing, diagrams, contracts, logos, new people, duplicated paths, guarantees, excessive motion, camera roll or watermark. Generate no audio.`],
    ["sd-p08-close", "P08 — Agreement cycle and clean close", "14-second source · final closes at 03:05", "@Image1 = C4_ENDFRAME.png · Generate Audio OFF", "A clean source field for the agreement-cycle labels and approved closing logo, composited in post.", `Generate one continuous 14-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve the empty centre and lower-centre area, the navy field and restrained cyan-teal edge light. Do not add any lettering or branding.

0.0–8.0s: Six faint edge-light pulses travel in sequence around the perimeter, suggesting an orderly agreement cycle without becoming icons or a diagram. The centre remains completely clean. The camera performs a barely perceptible two per cent push.

8.0–11.0s: The pulses resolve into one calm, continuous perimeter glow and the single restrained flare shimmers once.

11.0–14.0s: All motion settles into a clean three-second hold beneath the final voiceover and the sustained chord from Horizon Open.

No text, numbers, logos, icons, people, objects, bright detail in the centre, presentation interface, sudden flare, fade to white, camera shake or watermark. Generate no audio.`],
  ].map(([id, title, duration, input, purpose, prompt]) => ({ id, group: "Seedance 2.5" as const, title, duration, input, purpose, prompt, ...productionMedia[id] })),
  {
    id: "suno-opening",
    group: "Suno",
    title: "Locked music source A — Forward Momentum",
    purpose: "Use the already-generated opening render as the tonal source for the cover fake-out and first forward push.",
    duration: "Supplied 00:46.8 instrumental master · edit to picture",
    input: "Forward Momentum.mp3 · supplied Pixio Songcraft render · do not regenerate",
    prompt: `Cinematic cyberpunk corporate trailer music, instrumental only.

Begin with approximately three seconds of near-silence: a faint corporate room tone, subtle projector hum and minimal low-frequency tension. At 0:03, deliver a single powerful but sophisticated bass impact as the visual presentation breaks open.

After the drop, build with premium synthwave pulses, deep controlled sub bass, glitch percussion, cinematic drums, restrained arpeggios and rising harmonic energy. The mood moves from routine and constrained to surprising, advanced, optimistic and confident.

Avoid aggressive industrial noise, horror, dystopian tension, vocals, comedy, retro parody and excessive EDM festival energy.

Target duration: 28 to 32 seconds. Approximately 125 to 130 BPM. Dark minor opening that resolves toward a hopeful, forward-moving tonal centre. Strong edit points around 0:03, 0:10, 0:17 and 0:24. Finish with forward momentum rather than a complete musical ending so it can transition into the body of the film.`,
    secondaryLabel: "Edit lock",
    secondaryText: "Keep the source render · establish near-silence under the cover · align its main impact to the P01 visual break · carry its tonal tail into the quieter middle bed",
  },
  {
    id: "suno-closing",
    group: "Suno",
    title: "Locked music source B — Horizon Open",
    purpose: "Use the already-generated closing render as the tonal source for connected capability, human resolution and the end frame.",
    duration: "Supplied 02:34.1 instrumental master · edit to picture",
    input: "Horizon Open.mp3 · supplied Pixio Songcraft render · do not regenerate",
    prompt: `Cinematic corporate synthwave outro, instrumental only.

Begin with confident forward motion that feels connected to a premium technology film. Use warm synth pads, restrained arpeggios, subtle cinematic percussion and a controlled deep bass foundation. Allow darker cyberpunk colours at the opening, then gradually resolve into a spacious, optimistic and human final section.

The music should support the ideas of connected capability, continuity and progress without becoming sentimental or triumphalist.

Avoid vocals, retro parody, aggressive EDM drops, horror tension and anthemic corporate rock.

Target duration: 24 to 30 seconds. Approximately 110 to 118 BPM. Include clear edit points near 0:04, 0:12, 0:18 and 0:23. End with one clean sustained hopeful chord that can hold under the final brand frame.`,
    secondaryLabel: "Mix lock",
    secondaryText: "Forward Momentum + Horizon Open remain the locked sources. Horizon enters at 00:30.88 with a long fade; Forward fades out from 00:38 to 00:46.70. Music is reduced and speech-ducked, with smooth dips around incident ownership, the dark transition and closing words. Horizon resolves at the 03:05 finish.",
  },
  {
    id: "vo-master",
    group: "ElevenLabs",
    title: "Locked master voiceover — single copy block",
    purpose: "The complete source-grounded narration in one uninterrupted block for a single long ElevenLabs generation.",
    duration: "Supplied 03:02 male master read including deliberate pauses",
    input: "ElevenLabs Text to Speech · Ninja Sensei male voice · speed 0.94 · stability 0.55 · similarity 0.75 · supplied master v3",
    prompt: `Every Microsoft agreement starts with a set of choices. For a university, the value comes from making those choices clearly and having the right support around them.

Data three brings more than thirty years of education experience, long-standing engagement with CAUDIT members, and national coverage across Australia, Fiji and the Pacific. Each institution has a local account contact, backed by Microsoft licensing and contract specialists, national solution experts, and direct escalation pathways into Microsoft.

That team supports the full agreement lifecycle. It coordinates quotes, orders, enrolments, amendments and renewals. It interprets licensing requirements, provides education-specific guidance, reviews consumption and licensing positions, models renewal scenarios, and advocates for customers when licensing, entitlement or operational issues need escalation.

The level of support remains flexible. Institutions with strong internal capability can focus on core licensing administration and enquiries. Those wanting deeper support can add reviews, planning, roadmap briefings, governance and specialist engagement as priorities change.

My D three provides a secure central view of agreements, software and cloud reporting, quotes, orders, assets, support cases and lifecycle information.

Optional Premier Support adds accountable incident ownership across Microsoft cloud and on-premises technology, using a pre-purchased pool of hours and escalation to Microsoft when product intervention is required.

Around Azure, separately scoped services can provide platform support, priority incident handling, cost visibility, right-sizing, governance, monitoring and managed operations.

The same relationship can connect institutions with expertise across modern work, security, data and artificial intelligence, applications and automation. Engagement can take the form of consulting, packaged services, projects or ongoing managed services. Each is scoped and purchased separately from the Microsoft agreement.

University priorities change over time. Licensing optimisation may lead to cloud adoption, security uplift, responsible artificial intelligence adoption or broader transformation. Data three helps bring the right expertise into the relationship at the right time.

The next agreement cycle begins by confirming scope and requirements, validating licensing and enrolment information, completing documentation, preparing onboarding and handover, then verifying licences and beginning ongoing support.

Your Microsoft investment. Your way. Backed by Data three.`,
    secondaryLabel: "Pronunciation and edit lock",
    secondaryText: "Say Data three and My D three exactly as written · generate as one file · preserve natural paragraph pauses · split only in the edit · no alternate reads unless the master fails QA",
  },
  {
    id: "grok-b01-adviser",
    group: "Grok Imagine",
    title: "B01 — Local adviser review",
    purpose: "A human-scale cutaway for the local account contact and national capability passage.",
    duration: "6–8 seconds · final 3–5 seconds",
    input: "Text-to-image first, then image-to-video · 16:9 landscape · extra-wide 24 mm composition",
    prompt: `Recommended path: Text-to-image first, then image-to-video. Generate a clean 16:9 landscape still in Quality mode, validate the composition, then animate only the motion prompt in Quality mode. Keep the final shot extra wide with a medium-distance subject, generous negative space on the right for Arial editorial labels, and no tight close-up.

[Subject + environment] A university IT leader and a trusted technology adviser review one shared laptop in a bright contemporary campus workspace. Natural, credible Australian or New Zealand higher-education setting. The people are generic illustrative characters, realistic proportions, relaxed professional posture, no recognisable real person.
[Camera + composition] Extra-wide 24 mm establishing medium shot, camera at eye level, people occupying the left 45 percent of frame, clean negative space across the right 40 percent, generous breathing room above and around both figures, no edge cropping.
[Style + lighting] Premium cinematic corporate film, Data#3 blue-black and cyan accents used subtly, warm daylight through glass, restrained depth of field, realistic skin and materials, fine film grain.
[Details] Laptop screen softly out of focus with no readable interface, books and campus details abstracted, calm human collaboration, no text, logos, signage, charts or watermark added by the prompt.

Image-to-video motion prompt: One small natural gesture as the adviser indicates one point on the laptop; the IT leader nods. Slow lateral camera drift to the right while preserving the wide composition and the empty label space. No dialogue, no generated text, no extra people, no zoom into faces, no camera shake.`,
  },
  {
    id: "grok-b02-commercial",
    group: "Grok Imagine",
    title: "B02 — Licensing options review",
    purpose: "Makes commercial guidance and scenario planning tangible during the lifecycle narration.",
    duration: "6–8 seconds · final 3–4 seconds",
    input: "Text-to-image first, then image-to-video · 16:9 landscape · wide 28 mm desk scene",
    prompt: `Recommended path: Text-to-image first, then image-to-video. 16:9 landscape, Quality still, then a single restrained camera move. Keep a large uncluttered dark area on the left for typography and place the action on the right at medium distance.

[Subject + environment] Two university technology specialists sit at a long table reviewing a small set of abstract printed option cards and a laptop. The cards contain no readable words, numbers or logos. Contemporary boardroom with glass, dark timber and a soft campus view beyond.
[Camera + composition] Extra-wide 28 mm three-quarter view from the left, action placed in the right half, 40 percent quiet negative space on the left, full upper bodies and table edge visible, no tight hands-only crop.
[Style + lighting] Photorealistic cinematic film look, cool blue ambient light balanced with a warm practical lamp, restrained reflections, realistic enterprise documentary tone.
[Details] The laptop interface is fully defocused; papers are deliberately non-legible; no identifiable real people, brands or invented metrics.

Image-to-video motion prompt: One specialist slides a single option card toward the other and both lean in slightly. Camera makes one slow 10-degree push from left to right. Preserve the empty left area, no text generation, no rapid cuts, no added objects or audio.`,
  },
  {
    id: "grok-b03-roadmap",
    group: "Grok Imagine",
    title: "B03 — Roadmap and specialist planning",
    purpose: "A clean bridge for proactive lifecycle support and deeper specialist engagement.",
    duration: "6–8 seconds · final 4–5 seconds",
    input: "Text-to-image first, then image-to-video · 16:9 landscape · extra-wide 24 mm office view",
    prompt: `Recommended path: Text-to-image first, then image-to-video. 16:9 landscape, Quality still, then animate with one calm movement. Keep the frame extra wide and leave the upper-left third quiet for one short label.

[Subject + environment] Three diverse university and technology specialists stand around a large table in a modern campus project room, considering a wall of softly blurred planning panels. They are collaborating, not presenting to camera; realistic proportions and natural posture.
[Camera + composition] Extra-wide 24 mm wide shot, people grouped in the right two-thirds, broad negative space in the upper-left and foreground, full room context, no tight close-up, no face cropped by the frame.
[Style + lighting] Cinematic enterprise documentary, blue-hour light through windows, warm practical pools, subtle cyan reflections, credible and optimistic.
[Details] Planning panels have colour blocks and lines only, no legible text, no logos, no fake product dashboard or invented statistics.

Image-to-video motion prompt: One person traces a route across the blurred planning surface while the group shifts attention together. Camera performs a slow, slightly elevated arc around the table. Preserve the negative space and wide context; no dialogue, text, extra people or camera shake.`,
  },
  {
    id: "grok-b04-incident",
    group: "Grok Imagine",
    title: "B04 — Accountable incident ownership",
    purpose: "Adds a concrete human action beneath the Optional Premier Support narration.",
    duration: "6–8 seconds · final 3–5 seconds",
    input: "Text-to-image first, then image-to-video · 16:9 landscape · wide 28 mm workstation shot",
    prompt: `Recommended path: Text-to-image first, then image-to-video. 16:9 landscape, Quality still, then a gentle push-in only. Compose wide with the engineer on the right and open dark space on the left for the qualifier Optional Premier Support.

[Subject + environment] A calm support engineer in a modern operations room wears a headset and reviews a live incident with focused attention. Generic illustrative person, realistic proportions, no recognisable real individual. A second workstation glows softly in the far background.
[Camera + composition] Extra-wide 28 mm side three-quarter view, engineer in the right 45 percent, negative space on the left, desk and room context visible, no close-up of face or screen.
[Style + lighting] Photorealistic cinematic enterprise film, controlled cyan monitor light with warm edge light on the engineer, realistic skin and fabric, subtle grain.
[Details] All screens are abstract colour and shape, fully unreadable, no incident number, customer name, product logo or alarm graphics.

Image-to-video motion prompt: The engineer listens, makes one concise note, then reaches for a second control. Slow push-in of less than five percent while the left negative space stays stable. No generated lettering, no frantic alarms, no dialogue, no camera shake.`,
  },
  {
    id: "grok-b05-azure",
    group: "Grok Imagine",
    title: "B05 — Azure platform operations",
    purpose: "Gives Azure support, monitoring and managed operations a credible physical environment.",
    duration: "6–8 seconds · final 3–5 seconds",
    input: "Text-to-image first, then image-to-video · 16:9 landscape · extra-wide architectural shot",
    prompt: `Recommended path: Text-to-image first, then image-to-video. 16:9 landscape, Quality still, then one slow tracking movement. Keep the server corridor extra wide with clear floor and ceiling breathing room and a quiet upper-right region for a label.

[Subject + environment] A physically plausible modern data-centre corridor with orderly server racks, glass doors, cable management and cool air movement. No dramatic emergency, no fantasy holograms, no visible brand marks.
[Camera + composition] Extra-wide 24 mm symmetrical architectural shot, long vanishing point, racks framing both sides without crowding, generous empty upper-right and lower foreground space, no tight rack detail.
[Style + lighting] Premium cinematic infrastructure film, cool cyan practical lighting with restrained violet depth, realistic reflections, subtle haze, no cyberpunk excess.
[Details] No readable rack labels, dashboards, numbers, logos or invented technical claims. The scene must look operational and calm.

Image-to-video motion prompt: Slow forward tracking move down the corridor with one gentle light pulse travelling along the floor edge. Keep geometry straight and the wide composition stable. No people, text, audio, whip pan or camera shake.`,
  },
  {
    id: "grok-b06-managed",
    group: "Grok Imagine",
    title: "B06 — Managed operations team",
    purpose: "Makes ongoing managed services feel like accountable human operations, not abstract glowing infrastructure.",
    duration: "6–8 seconds · final 3–5 seconds",
    input: "Text-to-image first, then image-to-video · 16:9 landscape · extra-wide 24 mm operations room",
    prompt: `Recommended path: Text-to-image first, then image-to-video. 16:9 landscape, Quality still, then one lateral tracking motion. Place the team on the left and leave generous negative space on the right for the words Managed services.

[Subject + environment] Two diverse operations specialists sit in a calm monitoring room, reviewing a wall of softly abstracted displays and exchanging one considered glance. Generic illustrative people, realistic proportions, no recognisable real persons.
[Camera + composition] Extra-wide 24 mm wide shot, team in the left third, open darkened right third, full desks and room architecture visible, no close-up and no cropped faces.
[Style + lighting] Cinematic documentary realism, deep navy environment, soft cyan screen light and warm rim light, premium but believable, fine film grain.
[Details] Displays contain only blurred blocks and gentle lines, no readable dashboards, metrics, incident numbers, logos or warning symbols.

Image-to-video motion prompt: One specialist points once to a calm display while the other makes a small confirming gesture. Camera tracks slowly right, preserving the open right-hand space. No alarm, text, dialogue, extra people or camera shake.`,
  },
  {
    id: "grok-b07-university",
    group: "Grok Imagine",
    title: "B07 — Technology in university life",
    purpose: "Connects the services to people and learning without pretending to show a specific customer or campus.",
    duration: "6–8 seconds · final 3–5 seconds",
    input: "Text-to-image first, then image-to-video · 16:9 landscape · extra-wide 24 mm campus interior",
    prompt: `Recommended path: Text-to-image first, then image-to-video. 16:9 landscape, Quality still, then a slow observational move. Keep the scene extra wide, with a clear architectural edge and open upper-left space for one short phrase.

[Subject + environment] A credible contemporary university learning commons at late afternoon, with a small group of students and staff collaborating around a table in the middle distance. The emphasis is on the space and natural activity, not individual faces.
[Camera + composition] Extra-wide 24 mm establishing view, people in the centre-right middle distance, broad architectural negative space upper-left, generous foreground and ceiling room, no tight portrait crop.
[Style + lighting] Warm human interior light balanced with blue-hour daylight, cinematic film look, realistic materials, subtle Data#3 cyan accents only in practical reflections.
[Details] No readable screens, signage, logos, uniforms or identifiable real people. Keep the environment physically plausible and quiet.

Image-to-video motion prompt: Gentle natural collaboration and one slow camera drift toward the windows. Maintain wide context and open upper-left space. No speaking to camera, no generated text, no sudden crowd movement or camera shake.`,
  },
  {
    id: "grok-b08-handover",
    group: "Grok Imagine",
    title: "B08 — Onboarding and handover",
    purpose: "A human closing beat for the five-step agreement cycle and transition into ongoing support.",
    duration: "6–8 seconds · final 3–5 seconds",
    input: "Text-to-image first, then image-to-video · 16:9 landscape · extra-wide 28 mm side angle",
    prompt: `Recommended path: Text-to-image first, then image-to-video. 16:9 landscape, Quality still, then animate one restrained movement. Keep the shot extra wide, with open space on the left for the step label and the people on the right at medium distance.

[Subject + environment] A university technology lead and an adviser complete a calm onboarding handover beside a bright campus foyer. They review one shared folder on a laptop and exchange a natural, brief acknowledgement; avoid a staged handshake close-up.
[Camera + composition] Extra-wide 28 mm side angle, both people fully visible in the right half, broad foyer and campus depth behind them, generous left negative space, no face or hand cropped.
[Style + lighting] Optimistic cinematic enterprise documentary, warm morning light with restrained cyan reflections, realistic materials, natural posture and believable scale.
[Details] Laptop and documents are deliberately unreadable, no signatures, logos, terms, numbers or invented customer identity.

Image-to-video motion prompt: The adviser closes the folder and the two people turn together toward the campus walkway. Camera makes one slow pull-back, preserving the open left space and full-body context. No text, no close-up, no extra people, no dialogue or camera shake.

Provider note: keep any required generation provenance visible in the source export; do not crop, erase or cover it.`,
  },
];

export const grokBrollItems = promptItems.filter((item) => item.group === "Grok Imagine");

export const productionSteps = [
  "Hold the real cover slide perfectly still, then use P01 to enter its abstract ribbon world.",
  "Generate each Seedance scene in narrative order and add every approved frame or cut to this Bible as it lands.",
  "Keep the middle source-grounded: licensing lifecycle, education experience, flexible support, MyD3, Premier Support, Azure and wider Microsoft capability.",
  "Intercut six supplied human and operational B-roll clips with the existing cinematic footage; use three brief, designed information beats where the detail benefits from a diagram.",
  "Run NotebookLM only as a coverage checker against the approved deck and locked master script.",
  "Generate the entire ElevenLabs narration as one file; split it only during the final edit.",
  "Use Forward Momentum and Horizon Open as the two locked music sources; join them into the 3:05 film with a quieter bed, speech-driven ducking and smooth editorial dips.",
  "Mix external narration and music over clean picture; Seedance native audio remains off unless a shot-specific effects stem is deliberately requested.",
  "Use concise, precisely placed Arial labels in post where they clarify the footage; keep generated imagery free of lettering, preserve supplied cover typography, and deliver subtitles as a separate SRT file.",
  "Run narrative, commercial, visual, audio, accessibility and technical QA, then export the review and final masters.",
];

export const qualityGates = [
  { title: "Narrative", items: ["Final film runs 3:05; supplied narration remains intact", "Approved information is covered without slide-by-slide narration", "Licensing begins the relationship and connected capability expands it"] },
  { title: "Commercial", items: ["Core and separately scoped capability are distinct", "No pricing, terms, guardrails or guarantees", "Sustained, flexible and standing are access patterns, not inclusions"] },
  { title: "Visual", items: ["The source cover stays pixel-sharp", "Arial labels are concise, positioned precisely and legible on phone-sized playback", "Generated footage contains no invented lettering or logos", "People, architecture and key props stay stable", "Each shot has one action and one controlled camera move"] },
  { title: "Audio", items: ["One long ElevenLabs male master read", "Forward Momentum and Horizon Open are the locked music sources", "Narration remains clearly dominant over the music bed", "Data three and My D three are pronounced correctly", "The final mix is stereo, limited and free of clipping"] },
  { title: "Accessibility and technical", items: ["16:9 720p final at 24 fps", "No more than three flashes per second", "Optional SRT/WebVTT captions use Data#3 and MyD3; editorial labels use Arial", "No unintended gaps or reverse loops; the brief navy beat is intentional", "Retain source provenance marks; check complete decoding and audio peaks"] },
];

export const shotIds = ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "MUSIC-A", "MUSIC-B", "VOICE", "MIX", "SRT", "MASTER"];

export const researchLinks = [
  { label: "Gemini Notebook Video Overviews", url: "https://support.google.com/gemininotebook/answer/16454555?hl=en" },
  { label: "Gemini image generation and Nano Banana", url: "https://ai.google.dev/gemini-api/docs/image-generation" },
  { label: "Seedance official launch", url: "https://seed.bytedance.com/en/blog/seedance-2-0-official-launch" },
  { label: "ElevenLabs text-to-speech guide", url: "https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech" },
  { label: "Suno Exclude guidance", url: "https://help.suno.com/en/articles/3161921" },
];
