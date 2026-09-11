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
  alt?: string;
};

export const groups: PromptGroup[] = ["NotebookLM", "Nano Banana Pro", "Seedance 2.5", "Suno", "ElevenLabs"];

const styleLock = `STYLE LOCK — Premium cyberpunk-corporate cinema for senior Australian and New Zealand university leaders.

Deep Data#3 blue-black (#000025) base, electric cyan (#00AEFF) and teal accents, with violet used sparingly for depth. High contrast, controlled volumetric haze, subtle reflective surfaces, realistic materials, restrained anamorphic flares, natural depth of field and fine film grain.

Optimistic, clean and credible — never dystopian. Keep the visual world relevant to higher education, enterprise technology, infrastructure and human progress.

16:9 landscape. Photorealistic. Corporate-grade. No generated text, logos, presentation interface, readable signage, recognisable real people, copyrighted characters, decay, aggression, heavy rain or generic glowing AI brains.`;

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
    ["nbp-o5", "O5 — The signal", "Resolves the noise into three clear narrative paths.", "/caudit/O5_SIGNAL.png", "Technology leader facing three ordered light paths towards a university", `The same university technology world is now calm and intelligible. One anonymous executive, seen from behind, faces exactly three luminous routes that resolve from residual complexity and lead towards a bright, credible campus.

Route one uses precise layered arcs to suggest commercial clarity. Route two forms a stable protected corridor to suggest operational confidence. Route three rises towards research spaces to suggest purposeful evolution. The routes share an origin and destination but remain clearly distinct.

Wide over-the-shoulder 16:9 frame, optimistic light and realistic materials. Exactly three primary pathways. No labels, text, logos, extra people, glowing brain or watermark.`],
    ["nbp-o6", "O6 — Handoff tunnel", "Creates a clean transition into the NotebookLM explainer.", "/caudit/O6_HANDOFF.png", "Cyan and teal light corridor converging on a bright horizon", `A clean forward-facing corridor built from connected cyan and teal light rails converges on a white-cyan horizon. Restrained architectural fins and abstract data filaments stream along the far edges while the central route remains simple, calm and perfectly clear.

Symmetrical 16:9 transition plate with a centred vanishing point and unobstructed middle third. Highly dimensional, premium enterprise visual effects with controlled motion energy.

No text, logos, people, interface elements, rotation, centre clutter or watermark.`],
    ["nbp-c1", "C1 — Connected capability", "Shows multiple separately scoped capabilities connecting through one relationship.", "/caudit/C1_CONNECTED_CAPABILITY.png", "Six distinct technology streams connecting around a university campus", `A modern university campus forms the central hub of a connected technology ecosystem. Six distinct but harmonious streams approach from visually different domains: cloud compute, collaboration spaces, cyber security operations, data platforms, responsible AI capability and technical support.

Each stream keeps its own form and remains separate until it joins a stable orbit around the institution. The image must communicate access to connected capabilities, not a bundled product. Elevated wide frame with clean spatial separation and credible architecture.

No text, logos, familiar vendor icons, interface, fantasy city or watermark.`],
    ["nbp-c2", "C2 — Three ways capability supports the journey", "Represents sustained, flexible and standing access patterns.", "/caudit/C2_CONTINUING_VALUE.png", "Three distinct support patterns surrounding a university environment", `A sophisticated cinematic metaphor for exactly three complementary access patterns supporting one university environment.

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
    ["sd-o2", "O2 — The drop", "3–4 seconds", "@Image1 = O2 frame; @Image2 = real title slide, reference only", `Use @Image1 as the exact first frame. Use @Image2 only to preserve the proportions and placement of the real title-slide composite; do not render its text or logo.

ACTION: The surface holds almost still, then separates once on a decisive bass impact. Precise glass-like layers peel towards camera as cyan light expands through the opening.
CAMERA: One fast, controlled push through the centre.
END FRAME: Full-frame white-cyan light bloom, held cleanly for eight frames.
AUDIO: One refined low-frequency impact, brief glass separation and a smooth tonal rise. No dialogue.

Preserve the deep navy, cyan and teal treatment. No new objects, people, text or logos. Fragments remain rigid and physically coherent; no melting, explosion, spin or camera roll.`],
    ["sd-o3", "O3 — Arrival", "6–8 seconds", "@Image1 = O3 frame", `Use @Image1 as the exact first frame and preserve every building, path, light source and person.

ACTION: Subtle data-light threads flow between buildings. Distant people continue walking naturally at normal speed.
CAMERA: One smooth forward aerial glide, descending slightly towards the illuminated central walkway; restrained parallax only.
END FRAME: Settle above the central path with stable architecture and forward momentum.
AUDIO: Soft campus ambience and a restrained electronic pulse. No voices.

Do not add buildings, crowds, signs, text or logos. Do not morph architecture, faces or bodies. Keep the mood advanced, optimistic and credible.`],
    ["sd-o4", "O4 — Complexity", "5–7 seconds", "@Image1 = O4 frame", `Use @Image1 as the exact first frame. Preserve the subject, clothing, body proportions, room geometry and lighting.

ACTION: The distinct licensing, cloud, security, data, AI and operational layers accelerate around the stationary subject and grow denser without colliding.
CAMERA: One slow 25-degree arc around the subject at constant height.
END FRAME: Hold with the subject still readable and the visual density at its peak.
AUDIO: Layered restrained digital movement and low tension; no alarms or dialogue.

Do not create text, written documents, logos or new people. No warping, duplication, scene change, violence or chaotic camera shake.`],
    ["sd-o5", "O5 — Resolution", "6–8 seconds", "@Image1 = O5 frame", `Use @Image1 as the exact first frame. Preserve the subject, campus and exactly three main pathways.

ACTION: Residual scattered signals flow cleanly into the three routes. Each route illuminates once in sequence, then all three move towards the shared horizon.
CAMERA: One central forward push that begins calmly and builds measured momentum.
END FRAME: Centre on the three routes converging towards bright campus space without merging into one beam.
AUDIO: Tension resolves into three tonal pulses and one forward rhythmic bed. No dialogue.

No labels, text, logos, objects or people. Do not replace the environment or create additional paths.`],
    ["sd-o6", "O6 — Handoff", "3–5 seconds", "@Image1 = O6 frame", `Use @Image1 as the exact first frame and preserve the centred corridor.

ACTION: Edge filaments stream backwards with controlled speed while the central path remains stable.
CAMERA: One smooth acceleration towards the bright horizon; no rotation.
END FRAME: Clean white-cyan full-frame hold for 12 frames, suitable for a hard cut or short dissolve.
AUDIO: Focused air rush and gentle tonal lift. No impact and no dialogue.

No text, logos, people, new objects, scene replacement or excessive motion blur in the centre.`],
    ["sd-c1", "C1 — Convergence", "6–8 seconds", "@Image1 = C1 frame", `Use @Image1 as the exact first frame. Preserve the campus hub and all six distinct capability streams.

ACTION: The six streams travel smoothly towards the institution, complete one restrained orbit and settle into a stable connected pattern. A single subtle pulse marks connection.
CAMERA: One slow confident push towards the campus with controlled parallax.
END FRAME: Each stream remains visibly separate around the connected hub.
AUDIO: Warm technical ambience and one soft connection pulse. No dialogue.

Do not merge the streams, add labels, logos, buildings or people, or introduce fantasy effects.`],
    ["sd-c2", "C2 — Continuing value", "7–9 seconds", "@Image1 = C2 frame", `Use @Image1 as the exact first frame and preserve exactly three support patterns.

ACTION: The continuous pathway maintains steady flow. The adaptable stream branches briefly towards two specialist needs and rejoins. The operational halo stays stable throughout.
CAMERA: One gentle lateral move with a slight forward drift to reveal how the patterns complement one another.
END FRAME: All three patterns remain distinct, active and balanced around the campus.
AUDIO: Three restrained textures working in harmony; no dialogue.

Do not add text, pricing, diagrams, contracts, people or logos. No hard-sell visual language or excessive motion.`],
    ["sd-c3", "C3 — Human payoff", "5–7 seconds", "@Image1 = C3 frame", `Use @Image1 as the exact first frame. Preserve every person, face, garment, architectural line and light source.

ACTION: People continue their existing natural movement at normal speed. Background campus activity remains subtle and credible.
CAMERA: One gentle eye-level forward dolly through the space with no reframing jump.
END FRAME: Settle on a warm human composition with technology still secondary.
AUDIO: Natural campus room tone and soft footsteps. No intelligible dialogue.

Do not add or remove people, change faces or clothing, alter signage or architecture, or create repeated figures, face warping or exaggerated motion.`],
    ["sd-c4", "C4 — Endframe settle", "4–6 seconds", "@Image1 = C4 frame", `Use @Image1 as the exact first frame. Preserve the empty centre and lower-centre safe area precisely.

ACTION: Sparse particles drift almost imperceptibly. Cyan-teal edge light moves gently and the single flare shimmers once.
CAMERA: Effectively locked off, with a barely perceptible one per cent push before a complete settle.
END FRAME: Two-second clean hold for the approved wordmark and closing statement.
AUDIO: One quiet sustained resolving tone. No dialogue.

Do not add text, logos, objects or people. Do not move detail into the safe area.`],
  ].map(([id, title, duration, input, prompt]) => ({ id, group: "Seedance 2.5" as const, title, duration, input, purpose: "Image-to-video motion prompt with one action, one camera move and a usable end state.", prompt })),
  {
    id: "suno-master",
    group: "Suno",
    title: "Locked master score — One connected relationship",
    purpose: "One continuous instrumental bed for the complete film, with editorial landmarks matched to the locked picture plan.",
    duration: "2:25 master · 2:20 content target",
    input: "Pixio Songcraft · Custom Mode ON · Make Instrumental ON",
    prompt: `Create one continuous premium cinematic electronic instrumental for a concise enterprise technology film aimed at senior Australian and New Zealand university leaders.

Length: approximately two minutes twenty-five seconds. Tempo: approximately 112 BPM. Begin with two seconds of near-silence beneath a static PowerPoint cover. From 0:02, introduce a restrained low pulse. At 0:07, deliver one refined sub-bass transition as the cover artwork comes alive and the camera enters the abstract ribbon world.

From 0:12 to 0:50, establish confident forward motion using warm analogue synths, precise electronic percussion and subtle glass-like textures. From 0:50 to 1:32, reduce density so detailed narration remains completely clear. From 1:32 to 2:06, widen the harmony and add measured momentum as connected capability expands. From 2:06, soften the rhythm into warmer human pads. At 2:18, begin the final resolution. Hold one clean, hopeful sustained chord from 2:22 to 2:25.

The music must feel assured, intelligent, modern and human. Keep the midrange sparse under narration. Use controlled sub bass, restrained percussion and clean dynamics. No dramatic trailer booms after the opening transition.

Instrumental only. No vocals, choir, spoken word, corporate rock, sentimental piano lead, festival EDM, retro synthwave parody, horror tension, aggressive industrial noise, comedy, distorted mastering or long fade-out.`,
    secondaryLabel: "Mix lock",
    secondaryText: "Voiceover leads at all times · score ducks 4–6 dB under speech · one opening impact at 0:07 · final chord holds 0:02:22–0:02:25",
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
  "Generate one continuous Suno Songcraft master and align its opening impact, quieter middle and final resolving chord to picture.",
  "Mix external narration and music over clean picture; Seedance native audio remains off unless a shot-specific effects stem is deliberately requested.",
  "Use no generated or post-production lettering. Keep supplied cover typography intact as source artwork and deliver subtitles as a separate SRT file.",
  "Run narrative, commercial, visual, audio, accessibility and technical QA, then export the review and final masters.",
];

export const qualityGates = [
  { title: "Narrative", items: ["Target 2:20; never exceed 2:30", "Every approved deck concept appears once", "Licensing begins the relationship and connected capability expands it"] },
  { title: "Commercial", items: ["Core and separately scoped capability are distinct", "No pricing, terms, guardrails or guarantees", "Sustained, flexible and standing are access patterns, not inclusions"] },
  { title: "Visual", items: ["The source cover stays pixel-sharp", "No new lettering, labels or logos", "People, architecture and key props stay stable", "Each shot has one action and one controlled camera move"] },
  { title: "Audio", items: ["One long ElevenLabs master read", "Narration wins over music by 4–6 dB", "Data three and My D three are pronounced correctly", "The opening impact lands at 0:07"] },
  { title: "Accessibility and technical", items: ["16:9 720p generation and consistent master frame rate", "No more than three flashes per second", "A reviewed SRT accompanies the film without burned-in typography", "No clipping, black frames, watermark or distorted audio"] },
];

export const shotIds = ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "MUSIC", "VOICE", "MIX", "SRT", "MASTER"];

export const researchLinks = [
  { label: "Gemini Notebook Video Overviews", url: "https://support.google.com/gemininotebook/answer/16454555?hl=en" },
  { label: "Gemini image generation and Nano Banana", url: "https://ai.google.dev/gemini-api/docs/image-generation" },
  { label: "Seedance official launch", url: "https://seed.bytedance.com/en/blog/seedance-2-0-official-launch" },
  { label: "ElevenLabs text-to-speech guide", url: "https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech" },
  { label: "Suno Exclude guidance", url: "https://help.suno.com/en/articles/3161921" },
];
