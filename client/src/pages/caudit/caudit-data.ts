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
    title: "Custom visual style",
    purpose: "Creates the calm, credible middle section and preserves contrast with the cinematic bookends.",
    input: "Video Overview → Visual style → Custom",
    prompt: `Premium cinematic enterprise editorial style for senior university technology, commercial and procurement leaders in Australia and New Zealand.

Use credible contemporary higher-education environments: Australian and New Zealand campuses, research spaces, technology operations, collaborative decision-making and clean modern architecture. Prioritise natural human moments over posed stock photography.

Use a deep navy, white, cyan and teal palette aligned to Data#3. Combine editorial photography with restrained information graphics, simple diagrams, source-slide visuals where accurate, gentle motion and strong hierarchy.

Show clarity emerging from complexity, connected platforms, accountable support, secure environments and capability developing over time. Keep the result modern, calm, human, executive-level and commercially credible.

Avoid cyberpunk treatment in this middle section, cartoons, whiteboards, kawaii, generic collages, science-fiction cities, glowing brains, excessive holograms, dense dashboards, walls of text and generated branding. Never generate or imitate the Data#3 logo. Avoid readable text inside generated imagery.

This section must feel intentionally calmer than the separately produced cinematic opening and closing.`,
  },
  {
    id: "nlm-focus",
    group: "NotebookLM",
    title: "Explainer steering prompt",
    purpose: "Directs the source-grounded three-to-four-minute executive narrative.",
    duration: "3–4 minutes",
    input: "Video Overview → Format: Explainer → Steering prompt",
    prompt: `Create a concise three-to-four-minute executive explainer for senior university IT, commercial and procurement leaders in Australia and New Zealand.

This is the substantive middle of a larger film. A separate cinematic opening and closing will be added. Begin directly with the Microsoft licensing story. Do not create a company introduction, logo animation, dramatic hook, long recap or end card.

Build one connected narrative around:
1. Microsoft licensing as the starting point of the Data#3 relationship.
2. Dedicated higher-education experience and accountable account support.
3. The licensing lifecycle: agreement management, licensing guidance, commercial optimisation, customer advocacy and Microsoft escalation.
4. Flexible support aligned to each institution’s internal capability.
5. Proportionate visibility and control through MyD3.
6. Broader, separately scoped capability across Azure, Modern Work, Security, Data and AI, Copilot, applications, automation and technical support.
7. Continuing value through sustained capability, flexible access to specialist expertise and standing operational support.
8. A simple invitation to engage the Data#3 education account team.

Clearly distinguish core licensing services from optional or separately purchased services. Never imply that Premier Support, Azure, managed services, consulting, projects or wider Microsoft capabilities are included in the licensing agreement.

Do not include pricing, contract terms, minimum commitments, team ratios or commercial guardrails. Do not guarantee savings, optimisation, incident resolution, risk reduction or business outcomes.

Use confident, concise and consultative Australian business English. Synthesise the source instead of reading slides aloud. Omit any claim explicitly marked “REQUIRES OWNER VALIDATION”, and never mention internal notes or drafting instructions.

Finish cleanly on this idea, then stop: Microsoft licensing may begin the relationship. The greater value comes from the expertise, continuity and connected capability available around it.`,
  },
  {
    id: "nlm-correction",
    group: "NotebookLM",
    title: "Correction pass",
    purpose: "Use only when the first overview is too generic, long or commercially imprecise.",
    input: "Regenerate with this steering instruction",
    prompt: `Revise the Video Overview to be more concise, source-grounded and commercially precise.

Begin with the substantive Microsoft licensing story. Remove generic company introduction, repeated conclusions, slide-by-slide narration and promotional language.

Give clear, proportionate coverage to the licensing lifecycle, customer advocacy with Microsoft, support aligned to each institution’s internal capability, visibility and control, connected Microsoft capability and continuing value through sustained, flexible or standing access to expertise.

Distinguish core licensing support, optional Premier Support and broader separately engaged capability. Do not guarantee savings or outcomes. Do not imply that optional services are included in the LSP agreement. Omit internal validation notes and unapproved claims.

Do not create a cinematic opening, logo screen or closing sequence. Finish with a clean handoff to the separately produced closing bookend. Keep the result within approximately three to four minutes.`,
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
    id: "suno-open",
    group: "Suno",
    title: "Opening track — The drop",
    purpose: "Creates the transition from ordinary slide walkthrough to cinematic momentum.",
    duration: "28–32 seconds",
    input: "Custom mode → Instrumental ON",
    prompt: `Premium cinematic electronic underscore for an enterprise technology film. Begin with approximately three seconds of near-silence and low-frequency anticipation. At 0:03, deliver one sophisticated sub-bass impact. Build into modern synth pulses, restrained arpeggios, precise glitch percussion, cinematic drums and controlled harmonic lift.

Emotional arc: routine and constrained → surprising → advanced → optimistic → confident. Dark minor opening resolving towards a hopeful forward tonal centre. Approximately 126 BPM. Clear editorial accents around 0:03, 0:10, 0:17 and 0:24. Finish with forward momentum and an unresolved sustained pad for transition into narration. Instrumental only.`,
    secondaryLabel: "Exclude",
    secondaryText: "vocals, choir, spoken word, horror tension, aggressive industrial noise, festival EDM drop, retro synthwave parody, comedy, distorted mastering, long fade-out",
  },
  {
    id: "suno-close",
    group: "Suno",
    title: "Closing track — Convergence",
    purpose: "Resolves the visual world into connected capability and a warm endframe.",
    duration: "24–30 seconds",
    input: "Custom mode → Instrumental ON",
    prompt: `Premium cinematic electronic outro using the same sonic family as the opening: deep navy synth atmosphere, cyan-like arpeggios, restrained cinematic percussion and controlled sub bass. Begin with confident forward motion, then gradually open into warmer pads, greater harmonic space and a human final section.

Emotional arc: connected → assured → spacious → optimistic. Approximately 114 BPM. Clear editorial accents around 0:04, 0:12, 0:18 and 0:23. End with one clean sustained hopeful chord that holds under the brand frame. Instrumental only.`,
    secondaryLabel: "Exclude",
    secondaryText: "vocals, choir, spoken word, retro parody, aggressive EDM, horror tension, anthemic corporate rock, sentimental piano climax, distorted mastering, abrupt ending",
  },
  {
    id: "vo-open",
    group: "ElevenLabs",
    title: "Opening voiceover — preferred",
    purpose: "A confident, restrained provocation over the opening bookend.",
    duration: "Approx. 16–19 seconds",
    input: "Multilingual v2 or preferred long-form model; Australian or neutral business voice",
    prompt: `Everyone else will walk you through their slides.

We thought you deserved something different.

Beneath the licensing, the renewals and the complexity… there is a clearer way to buy well, operate with confidence and evolve with purpose.

This is Data three.`,
    secondaryLabel: "Starting settings",
    secondaryText: "Stability 55 · Similarity 75 · Style 0 · Speed 0.94 · Speaker boost only if it improves the chosen voice",
  },
  {
    id: "vo-open-alt",
    group: "ElevenLabs",
    title: "Opening voiceover — executive alternative",
    purpose: "A more formal option when the preferred opening feels too theatrical.",
    duration: "Approx. 14–17 seconds",
    input: "Use the same locked voice and settings as the preferred opening",
    prompt: `A Microsoft agreement may look like a transaction.

For a university, it is the beginning of something much larger.

Commercial clarity. Operational confidence. The capability to keep evolving.

This is the wider Microsoft relationship, backed by Data three.`,
    secondaryLabel: "Pronunciation",
    secondaryText: "Keep “Data three” in the speech script. Add the real Data#3 wordmark visually in the edit.",
  },
  {
    id: "vo-close",
    group: "ElevenLabs",
    title: "Closing voiceover — preferred",
    purpose: "Connects licensing to continuing capability without implying bundled services.",
    duration: "Approx. 22–26 seconds",
    input: "Use the same locked voice; begin after the visual re-entry settles",
    prompt: `Licensing is only the beginning.

Beyond the agreement is the capability to support, secure, optimise and evolve.

Sustained capability for continuing priorities.
Flexible specialist expertise as needs change.
Standing operational support where continuity matters.

One relationship. Connected capability.

Your Microsoft investment. Your way.

Backed by Data three.`,
    secondaryLabel: "Delivery",
    secondaryText: "Pause after the first line. Separate the three access patterns without reading them like a product list. Let the final line land over the approved wordmark.",
  },
  {
    id: "vo-close-alt",
    group: "ElevenLabs",
    title: "Closing voiceover — shorter alternative",
    purpose: "Use when the final edit needs a tighter close.",
    duration: "Approx. 14–17 seconds",
    input: "Use the same locked voice and settings",
    prompt: `Licensing begins the relationship.

Continuing value comes from what surrounds it: support, cloud, security, data and AI, and access to the right expertise as priorities change.

One relationship. Connected capability.

Backed by Data three.`,
    secondaryLabel: "Pronunciation",
    secondaryText: "Keep “Data three” in the speech script. Add the real approved wordmark in the edit.",
  },
];

export const productionSteps = [
  "Lock the edited PowerPoint source and export the real title slide.",
  "Generate the NotebookLM Explainer from the locked deck only.",
  "Review the explainer for accuracy, commercial separation, tone and duration.",
  "Generate the opening music, then lock the exact bass-drop timestamp.",
  "Use the supplied opening keyframes to generate the five short Seedance cuts.",
  "Generate and lock the opening narration.",
  "Assemble the opening and NotebookLM handoff.",
  "Generate the closing track as a tonal sibling of the opening.",
  "Use the supplied closing keyframes to generate the four Seedance cuts.",
  "Generate and lock the closing narration.",
  "Assemble the complete film and add approved branding and typography.",
  "Run narrative, commercial, visual, audio, accessibility and technical QA.",
  "Export a review version, caption file and final master.",
];

export const qualityGates = [
  { title: "Narrative", items: ["Licensing appears immediately", "Buy well, Operate with confidence and Evolve with purpose remain intelligible", "The ending expands the relationship without diluting the licensing proposition"] },
  { title: "Commercial", items: ["Core and separately scoped capability are distinct", "No pricing, terms, guardrails or guarantees", "Sustained, flexible and standing are access patterns, not inclusions"] },
  { title: "Visual", items: ["Real title slide stays crisp", "Generated text and logos are absent", "People, architecture and key props stay stable", "The middle is intentionally calmer than the bookends"] },
  { title: "Audio", items: ["The bass drop lands on the visual break", "Narration wins over music", "“Data three” is pronounced correctly", "The closing chord holds cleanly under the brand frame"] },
  { title: "Accessibility and technical", items: ["16:9 sequence and consistent frame rate", "No more than three flashes per second", "Captions reviewed; social-first versions use burned-in captions", "No clipping, black frames or distorted audio"] },
];

export const shotIds = ["O1", "O2", "O3", "O4", "O5", "O6", "NLM", "C1", "C2", "C3", "C4", "A1", "A2", "VO1", "VO2", "BRAND", "MASTER"];

export const researchLinks = [
  { label: "Gemini Notebook Video Overviews", url: "https://support.google.com/gemininotebook/answer/16454555?hl=en" },
  { label: "Gemini image generation and Nano Banana", url: "https://ai.google.dev/gemini-api/docs/image-generation" },
  { label: "Seedance official launch", url: "https://seed.bytedance.com/en/blog/seedance-2-0-official-launch" },
  { label: "ElevenLabs text-to-speech guide", url: "https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech" },
  { label: "Suno Exclude guidance", url: "https://help.suno.com/en/articles/3161921" },
];
