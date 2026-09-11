export type PromptGroup = "NotebookLM" | "Nano Banana Pro" | "Seedance 2.5" | "Suno" | "ElevenLabs";

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
};

export const groups: PromptGroup[] = ["NotebookLM", "Nano Banana Pro", "Seedance 2.5", "Suno", "ElevenLabs"];

const styleLock = `STYLE LOCK — Premium cyberpunk-corporate cinema for senior Australian and New Zealand university leaders.

Deep Data#3 blue-black (#000025) base, electric cyan (#00AEFF) and teal accents, with violet used sparingly for depth. High contrast, controlled volumetric haze, subtle reflective surfaces, realistic materials, restrained anamorphic flares, natural depth of field and fine film grain.

Optimistic, clean and credible — never dystopian. Keep the visual world relevant to higher education, enterprise technology, infrastructure and human progress.

16:9 landscape. Photorealistic. Corporate-grade. No generated text, logos, presentation interface, readable signage, recognisable real people, copyrighted characters, decay, aggression, heavy rain or generic glowing AI brains.`;

const productionMedia: Record<string, { image: string; video?: string; alt: string }> = {
  "sd-p02-campus": { image: "/caudit/O3_FUTURE_CAMPUS.png", alt: "Connected university campus at blue hour" },
  "sd-p03-lifecycle": { image: "/caudit/O4_COMPLEXITY.png", alt: "Abstract licensing and operational layers around a technology leader" },
  "sd-p04-flex": { image: "/caudit/O5_SIGNAL_PEOPLE_FREE.png", alt: "Three luminous service paths leading to a university" },
  "sd-p05-support": { image: "/caudit/O6_HANDOFF.png", video: "/caudit/P05_SEEDANCE.mp4", alt: "Centred luminous support corridor" },
  "sd-p06-capability": { image: "/caudit/C1_CONNECTED_CAPABILITY_PEOPLE_FREE.png", alt: "Six connected capability streams around a university campus" },
  "sd-p07-value": { image: "/caudit/C2_CONTINUING_VALUE_PEOPLE_FREE.png", alt: "Three continuing-value patterns surrounding a university" },
  "sd-p08-close": { image: "/caudit/C4_ENDFRAME.png", video: "/caudit/P08_SEEDANCE.mp4", alt: "Clean blue-black cinematic end field with cyan edge light" },
};

export const promptItems: PromptItem[] = [
  {
    id: "nlm-visual",
    group: "NotebookLM",
    title: "Source recovery brief",
    purpose: "Uses NotebookLM only as a grounded source assistant, not as the finished video generator.",
    input: "NotebookLM chat with the approved deck as its only source",
    duration: "Reference only",
    prompt: `Using only the approved CAUDIT 2026 LSP presentation, produce a factual coverage checklist for a two-minute-twenty-second narrated film.

Group repeated slide content into one connected story. Preserve every material point about licensing, higher-education experience, account support, the agreement lifecycle, flexible support, MyD3, Premier Support, Azure, broader Microsoft capability, service engagement, continuing value and onboarding.

Clearly identify which services are optional or separately scoped. Omit claims marked REQUIRES OWNER VALIDATION. Do not draft visuals, manufacture statistics, add product claims or write a slide-by-slide narration.

Return a concise checklist that can be compared against the locked master voiceover.`,
  },
  {
    id: "nlm-focus",
    group: "NotebookLM",
    title: "Locked 2:20 coverage brief",
    purpose: "Defines the complete information payload for the shorter film.",
    duration: "2:20 target · 2:30 hard ceiling",
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
    duration: "12 seconds · 720p · 16:9",
    input: "@Image1 = P01_COVER_SLIDE.png · Generate Audio OFF",
    image: "/caudit/P01_COVER_SLIDE.png",
    video: "/caudit/P01_COVER_TRANSITION.mp4",
    alt: "CAUDIT presentation cover titled Delivering the Digital Future in Education",
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
    ["nbp-o4", "O4 — The noise", "Visualises licensing and operational complexity without panic or danger.", "/caudit/O4_COMPLEXITY.png", "University technology leader surrounded by complex luminous system layers", `A university technology executive, seen from behind, stands calmly in a modern operations environment while licensing obligations, cloud systems, cyber security signals, data flows, AI opportunities and operational demands form an overwhelming but orderly spatial storm around them.

Use distinct abstract forms: nested translucent agreement planes, network arcs, shield-like light fields, clustered compute nodes and branching service paths. Medium-wide low angle with the subject centred and strong foreground-to-background depth. Communicate cognitive complexity, never danger.

No readable text, written documents, logos, recognisable person, duplicated anatomy, dystopian mood or watermark.`],
    ["nbp-o5", "O5 — The signal", "Resolves the noise into three clear narrative paths.", "/caudit/O5_SIGNAL_PEOPLE_FREE.png", "Three ordered light paths towards a university", `The same university technology world is now calm and intelligible. One anonymous executive, seen from behind, faces exactly three luminous routes that resolve from residual complexity and lead towards a bright, credible campus.

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
    ["sd-p02-campus", "P02 — Education relationship", "18 seconds · 00:12–00:30", "@Image1 = O3_FUTURE_CAMPUS.png · Generate Audio OFF", "Higher-education experience, local accountability and national specialist support.", `Generate one continuous 18-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve every building, path, light source and existing distant person. Keep the Australian or New Zealand university architecture physically credible.

0.0–4.0s: Hold the wide campus composition with only natural distant pedestrian movement and barely perceptible atmospheric depth.

4.0–14.0s: Subtle cyan and teal data-light threads begin travelling between the sandstone, glass research spaces and central campus path, expressing a connected support relationship. The camera makes one slow forward aerial glide, descending slightly towards the illuminated walkway. Keep the motion calm enough to carry detailed narration.

14.0–18.0s: The connecting threads settle into a coherent network. End with the central walkway leading cleanly towards camera-right for an editorial cut.

No new buildings, crowds, signs, text, logos, interface, scene replacement, fast flight, camera roll, face morphing or watermark. Generate no audio.`],
    ["sd-p03-lifecycle", "P03 — The licensing lifecycle", "21 seconds · 00:30–00:51", "@Image1 = O4_COMPLEXITY.png · Generate Audio OFF", "Agreement administration, licensing guidance, optimisation, advocacy and escalation.", `Generate one continuous 21-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve the anonymous executive, their body proportions and clothing, the room geometry and the distinct abstract licensing, cloud, security, data and operational layers. No layer may contain readable symbols.

0.0–6.0s: Hold the executive calm and still while the separate system layers move with restrained complexity around them. The camera begins one slow 20-degree orbit at constant height.

6.0–16.0s: Without changing scene, the layers progressively align into an ordered circular workflow: agreement planes, licensing signals, consumption arcs, scenario branches and one clean escalation route. Each family remains visually distinct; nothing becomes a literal diagram.

16.0–21.0s: The ordered workflow stabilises around the executive. A single cyan route opens ahead as the camera completes its orbit and settles.

No text, numbers, written documents, logos, dashboards, new people, duplicate limbs, morphing, alarms, danger, rapid cuts, camera shake or watermark. Generate no audio.`],
    ["sd-p04-flex", "P04 — Support shaped to the institution", "20 seconds · 00:51–01:11", "@Image1 = O5_SIGNAL_PEOPLE_FREE.png · Generate Audio OFF", "Flexible support levels and proportionate MyD3 visibility without a literal dashboard.", `Generate one continuous 20-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve the anonymous executive, campus horizon and exactly three primary luminous routes. The routes are abstract service paths, never labelled.

0.0–5.0s: Residual visual noise drains calmly into the three existing routes. The executive remains steady and the camera holds its central composition.

5.0–15.0s: Each route illuminates once in sequence at a different intensity, expressing core administration, deeper specialist support and standing visibility. A set of clean translucent planes rises briefly beside the paths like controlled windows into the same system, but contains no interface or symbols. Begin one gentle forward push.

15.0–20.0s: The translucent planes settle and the three routes remain separate, proportionate and connected to the same bright campus destination. End on a stable, intelligible composition.

Exactly three main routes. No labels, text, numbers, dashboards, logos, contracts, new people, hard-sell imagery, path duplication, camera roll or watermark. Generate no audio.`],
    ["sd-p05-support", "P05 — Operational support pathway", "20 seconds · 01:11–01:31", "@Image1 = O6_HANDOFF.png · Generate Audio OFF", "Separately scoped Premier Support and Azure operations as accountable pathways, not inclusions.", `Generate one continuous 20-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve the centred luminous corridor, strong vanishing point and clean blue-black, cyan and teal palette.

0.0–6.0s: Hold a steady forward path while restrained edge filaments flow backwards. Keep the centre clear and calm under narration.

6.0–15.0s: Two secondary support lanes appear alongside the central path without merging into it. One maintains a steady protective pulse; the other reveals measured cloud-like infrastructure depth. Their visual separation must make them feel optional and deliberately connected, not automatically included.

15.0–20.0s: The camera makes one smooth acceleration towards the bright horizon while all three lanes remain visibly distinct. End in a controlled cyan-white occlusion for a clean cut.

No text, icons, labels, logos, people, dashboards, literal clouds, incident alarms, scene replacement, spin, camera shake, excessive centre blur or watermark. Generate no audio.`],
    ["sd-p06-capability", "P06 — Connected Microsoft capability", "19 seconds · 01:31–01:50", "@Image1 = C1_CONNECTED_CAPABILITY_PEOPLE_FREE.png · Generate Audio OFF", "Broader separately scoped capability across Modern Work, security, data and AI, applications and automation.", `Generate one continuous 19-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve the central university hub and all six distinct capability streams. Do not merge, multiply or label the streams.

0.0–5.0s: Hold the complete connected-capability composition with slow ambient movement inside each existing stream.

5.0–14.0s: The six streams travel smoothly towards the university, complete one restrained partial orbit and connect through separate points around the hub. The camera makes one slow confident push with controlled parallax.

14.0–19.0s: One subtle pulse passes from the hub back through every stream, showing a two-way relationship. Settle with all six streams still distinct and the institution visually central.

No text, labels, icons, logos, new buildings, new people, fantasy magic, stream duplication, merging, camera shake, hard cuts or watermark. Generate no audio.`],
    ["sd-p07-value", "P07 — Continuing value as priorities change", "16 seconds · 01:50–02:06", "@Image1 = C2_CONTINUING_VALUE_PEOPLE_FREE.png · optional 3-second cutaway to C3_HUMAN_PAYOFF.png in the edit · Generate Audio OFF", "Consulting, services, projects and operations supporting changing institutional priorities.", `Generate one continuous 16-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve exactly three distinct support patterns around the credible university environment.

0.0–5.0s: The continuous pathway maintains a steady flow and the operational halo remains calm and stable. The camera begins one gentle lateral move with a slight forward drift.

5.0–12.0s: The adaptable specialist stream branches briefly towards two emerging needs, illuminates them without labels, then rejoins the wider relationship. The other patterns remain active and visually separate.

12.0–16.0s: All three patterns balance around the campus as warm human light grows subtly in the learning spaces. End on a stable frame suitable for a brief cutaway to the approved C3 human-payoff still.

No text, pricing, diagrams, contracts, logos, new people, duplicated paths, guarantees, excessive motion, camera roll or watermark. Generate no audio.`],
    ["sd-p08-close", "P08 — Agreement cycle and clean close", "14 seconds · 02:06–02:20", "@Image1 = C4_ENDFRAME.png · Generate Audio OFF", "Scope, validation, documentation, onboarding, verification and ongoing support resolve into a typography-free finish.", `Generate one continuous 14-second 16:9 720p image-to-video shot from @Image1.

Use @Image1 as the exact first frame. Preserve the empty centre and lower-centre area, the navy field and restrained cyan-teal edge light. Do not add any lettering or branding.

0.0–8.0s: Six faint edge-light pulses travel in sequence around the perimeter, suggesting an orderly agreement cycle without becoming icons or a diagram. The centre remains completely clean. The camera performs a barely perceptible two per cent push.

8.0–11.0s: The pulses resolve into one calm, continuous perimeter glow and the single restrained flare shimmers once.

11.0–14.0s: All motion settles into a clean three-second hold beneath the final voiceover and the sustained chord from Convergence.

No text, numbers, logos, icons, people, objects, bright detail in the centre, presentation interface, sudden flare, fade to white, camera shake or watermark. Generate no audio.`],
  ].map(([id, title, duration, input, purpose, prompt]) => ({ id, group: "Seedance 2.5" as const, title, duration, input, purpose, prompt, ...productionMedia[id] })),
  {
    id: "suno-opening",
    group: "Suno",
    title: "Locked music source A — The Drop",
    purpose: "Use the already-generated opening render as the tonal source for the cover fake-out and first forward push.",
    duration: "Existing 28–32 second source · edit to picture",
    input: "Existing Pixio Songcraft render · instrumental source · do not regenerate",
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
    title: "Locked music source B — Convergence",
    purpose: "Use the already-generated closing render as the tonal source for connected capability, human resolution and the end frame.",
    duration: "Existing 24–30 second source · edit to picture",
    input: "Existing Pixio Songcraft render · instrumental source · do not regenerate",
    prompt: `Cinematic corporate synthwave outro, instrumental only.

Begin with confident forward motion that feels connected to a premium technology film. Use warm synth pads, restrained arpeggios, subtle cinematic percussion and a controlled deep bass foundation. Allow darker cyberpunk colours at the opening, then gradually resolve into a spacious, optimistic and human final section.

The music should support the ideas of connected capability, continuity and progress without becoming sentimental or triumphalist.

Avoid vocals, retro parody, aggressive EDM drops, horror tension and anthemic corporate rock.

Target duration: 24 to 30 seconds. Approximately 110 to 118 BPM. Include clear edit points near 0:04, 0:12, 0:18 and 0:23. End with one clean sustained hopeful chord that can hold under the final brand frame.`,
    secondaryLabel: "Mix lock",
    secondaryText: "Use The Drop and Convergence as the two locked music sources · build the 2:20 continuous bed in the edit · voiceover leads by 4–6 dB · preserve Convergence's clean final chord",
  },
  {
    id: "vo-master",
    group: "ElevenLabs",
    title: "Locked master voiceover — single copy block",
    purpose: "The complete source-grounded narration in one uninterrupted block for a single long ElevenLabs generation.",
    duration: "Approx. 2:20 including deliberate pauses",
    input: "ElevenLabs Text to Speech · Amelia · eleven_multilingual_v2 · language en · stability 0.55 · similarity 0.75 · style 0.05 · speed 0.94 · speaker boost ON · normalisation auto · seed 34017",
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
];

export const productionSteps = [
  "Hold the real cover slide perfectly still, then use P01 to enter its abstract ribbon world.",
  "Generate each Seedance scene in narrative order and add every approved frame or cut to this Bible as it lands.",
  "Keep the middle source-grounded: licensing lifecycle, education experience, flexible support, MyD3, Premier Support, Azure and wider Microsoft capability.",
  "Use longer visual holds under detailed narration instead of recreating slide layouts or generated information graphics.",
  "Run NotebookLM only as a coverage checker against the approved deck and locked master script.",
  "Generate the entire ElevenLabs narration as one file; split it only during the final edit.",
  "Use the existing Suno renders The Drop and Convergence as the two locked music sources; bridge and extend their instrumental material into one continuous bed in the final edit.",
  "Mix external narration and music over clean picture; Seedance native audio remains off unless a shot-specific effects stem is deliberately requested.",
  "Use no generated or post-production lettering. Keep supplied cover typography intact as source artwork and deliver subtitles as a separate SRT file.",
  "Run narrative, commercial, visual, audio, accessibility and technical QA, then export the review and final masters.",
];

export const qualityGates = [
  { title: "Narrative", items: ["Target 2:20; never exceed 2:30", "Every approved deck concept appears once", "Licensing begins the relationship and connected capability expands it"] },
  { title: "Commercial", items: ["Core and separately scoped capability are distinct", "No pricing, terms, guardrails or guarantees", "Sustained, flexible and standing are access patterns, not inclusions"] },
  { title: "Visual", items: ["The source cover stays pixel-sharp", "No new lettering, labels or logos", "People, architecture and key props stay stable", "Each shot has one action and one controlled camera move"] },
  { title: "Audio", items: ["One long ElevenLabs master read", "The Drop and Convergence remain the locked music sources", "Narration wins over music by 4–6 dB", "Data three and My D three are pronounced correctly", "The opening impact is conformed to the approved P01 cut"] },
  { title: "Accessibility and technical", items: ["16:9 720p generation and consistent master frame rate", "No more than three flashes per second", "A reviewed SRT accompanies the film without burned-in typography", "No clipping, black frames, watermark or distorted audio"] },
];

export const shotIds = ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "MUSIC-A", "MUSIC-B", "VOICE", "MIX", "SRT", "MASTER"];

export const researchLinks = [
  { label: "Gemini Notebook Video Overviews", url: "https://support.google.com/gemininotebook/answer/16454555?hl=en" },
  { label: "Gemini image generation and Nano Banana", url: "https://ai.google.dev/gemini-api/docs/image-generation" },
  { label: "Seedance official launch", url: "https://seed.bytedance.com/en/blog/seedance-2-0-official-launch" },
  { label: "ElevenLabs text-to-speech guide", url: "https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech" },
  { label: "Suno Exclude guidance", url: "https://help.suno.com/en/articles/3161921" },
];
