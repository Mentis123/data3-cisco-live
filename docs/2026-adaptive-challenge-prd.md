# Cisco Live 2026 adaptive challenge prototype

## Product decision

Replace the three-concept launcher at `/2026alpha` with one standalone, mobile-first adaptive incident challenge. Preserve the three earlier concepts at `/2026alpha/archive` and retain their existing deep links.

This prototype combines:

- the familiar interaction model of a multiple-choice quiz
- the incident consequences and engineering judgement tested in Cascade
- the trusted artificial intelligence (AI) governance subject matter tested in Permission to act
- the cross-domain thinking tested in The Signal Room

The prototype does not collect personal information, persist gameplay, submit a draw entry, or generate unreviewed questions at runtime.

## Audience and purpose

### Primary audience

Enterprise and corporate engineers attending Cisco Live 2026 Melbourne across networking, security, collaboration, and AI roles.

### Audience need

The experience must make sense in one sentence, reward technical judgement, teach one useful idea, and create a natural conversation with a Data<sup>#</sup>3 engineer without becoming a sales form.

### Product promise

> Choose your focus. Make five decisions in an escalating AI incident. Discover how your engineering instincts balance speed, trust, and control.

### Booth explanation

> Five adaptive questions. About 90 seconds. The challenge gets harder when you get it right.

## Research synthesis

The design is grounded in the following findings:

1. Cisco’s 2026 direction connects agentic AI with resilient infrastructure, networking, security, observability, and future workplaces. The challenge should test human oversight across those systems rather than generic Cisco product recall.
2. Cisco Live Melbourne promotes hands-on learning, technical challenges, and personalised agendas. A short applied challenge fits the event more closely than a passive content experience.
3. Computerised adaptive testing traditionally selects easier or harder items after each response. Research also indicates that an easier adaptive starting point can improve engagement and reduce anxiety.
4. Multiple-choice activities create more learning value when they provide immediate conceptual feedback instead of only indicating whether an answer was right or wrong.
5. A start page should give people enough information to understand the task, expected duration, and value before they begin. One question per screen reduces cognitive load and works well on small displays.
6. WCAG 2.2 requires adequately sized and spaced controls. The prototype will exceed the 24 CSS pixel minimum with 48-pixel touch targets and strong focus indicators.
7. Competition entry is a separate data-collection purpose. Australian Privacy Principle guidance supports collecting only information that is reasonably necessary and explaining the purpose at collection time.

### Sources

- [Cisco Live 2026 Melbourne](https://www.ciscolive.com/apjc.html)
- [Cisco Live Melbourne learning experiences](https://www.ciscolive.com/apjc/learn.html)
- [Cisco Live U.S. 2026: leading in the agentic AI age](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m06/cisco-live-u-s-leading-in-the-agentic-ai-age.html)
- [Cisco AgenticOps innovations](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m02/cisco-expands-agenticops-innovations-across-portfolio.html)
- [Cisco security for the agentic era](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m02/cisco-redefines-security-for-the-agentic-era.html)
- [Cisco: how AI will transform the workplace in 2026](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2025/m12/how-ai-will-transform-the-workplace-in-2026.html)
- [Computerised adaptive testing overview, Cambridge University Press](https://assets.cambridge.org/97810095/76871/excerpt/9781009576871_excerpt.pdf)
- [Adaptive testing, feedback, and motivation study](https://journals.sagepub.com/doi/pdf/10.1177/0146621617707556?download=true)
- [Conceptual feedback in formative multiple-choice testing](https://pmc.ncbi.nlm.nih.gov/articles/PMC7550480/)
- [GOV.UK start-page pattern](https://design-system.service.gov.uk/patterns/start-using-a-service/)
- [GOV.UK question-page pattern](https://design-system.service.gov.uk/patterns/question-pages/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [OAIC guidance on collecting personal information](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information)

## Refined player journey

### 1. Start screen

The first screen contains everything needed to decide whether to play:

- one-sentence challenge promise
- what the participant will learn
- five-question and approximately 90-second expectation
- adaptive-difficulty explanation
- proposed draw incentive with an explicit alpha disclaimer
- four focus choices: networking, security, collaboration, and AI
- one start button, enabled after a focus is selected

There is no mandatory explainer sequence or video.

### 2. Five-question adaptive incident

Each screen presents the incident scenario first, followed by one question and three plausible actions. The path starts at Easy. The first four decisions adapt between Easy and Expert. The fifth decision is always a purpose-written Impossible scenario, creating a clear finale without exhausting the difficulty too early.

Difficulty labels are:

- Easy
- Expert
- Impossible

The prototype describes the path as adaptive. It does not claim that a generative AI model created or scored the questions.

### 3. Immediate consequence

After each answer, the screen shows:

- whether the answer was the strongest response
- a concise explanation of the engineering principle
- the next calibrated difficulty
- one clear continue action
- one persistent exit action that returns to the start screen and clears the active run

### 4. Result

The result presents:

- focus area
- strongest-answer count out of five
- highest difficulty reached
- an engineering response profile
- one concrete takeaway
- proposed draw-entry status, clearly marked as inactive in the alpha
- actions to replay with another focus or challenge the prototype

No sales call to action is required. The experience should make conversation with booth engineers feel natural.

## Adaptive model

Each focus has a curated seven-item bank ordered from difficulty zero to six.

- Start target: one
- For questions one to four, a correct response increases the target by two
- For questions one to four, another response decreases the target by one
- The adaptive target is clamped between zero and four until the final question
- Next item: unused item with the smallest distance from the new target
- Ties: lower item index first for deterministic testing
- Final item: the unused level-six question for the selected focus
- Completion: five answered items

This is intentionally simpler than psychometric computerised adaptive testing. It is transparent, testable, resilient offline, and sufficient to evaluate whether adaptive difficulty improves the booth experience.

## Content rules

- Every item has one strongest answer, not one cartoonishly obvious answer.
- Distractors represent credible but incomplete engineering instincts.
- Answer options are comparable in specificity and length; the strongest answer must not be revealed by its wording pattern.
- The scenario always appears before the question.
- Impossible appears only on question five, using a technically nuanced final scenario.
- Feedback explains the principle and does not shame the participant.
- Questions avoid brittle product-version trivia.
- Cisco-aligned subject matter includes secure AI, AgenticOps, networking, observability, collaboration, identity, resilience, and human oversight.
- All production questions require review by a suitably qualified Data<sup>#</sup>3 subject matter expert before the event.

## Alpha data and production data

### Alpha

- state remains on the device for the active session
- no database or backend changes
- no personal information
- no actual draw entry

### Production candidate

Store only what is needed:

- anonymous gameplay session identifier
- selected focus
- question and content version identifiers
- difficulty path
- answer identifiers and timestamps
- completion and result profile
- separately consented draw-entry record

Draw entry must have its own collection notice, terms, retention decision, and link to the relevant privacy policy. Gameplay analytics should not require personal information.

## Mobile and accessibility requirements

- design from a 320-pixel viewport upward
- one primary task per screen
- no horizontal scrolling at 200% zoom
- 48-pixel minimum interactive controls
- visible three-pixel focus treatment
- semantic headings and live regions for changed feedback
- no interaction that relies on colour alone
- reduced-motion support
- no audio dependency
- no countdown that penalises thoughtful reading

## Archive behaviour

- `/2026alpha` becomes the standalone adaptive challenge
- `/2026alpha/archive` becomes the earlier-concepts launcher
- `/2026alpha/cascade`, `/2026alpha/permission-to-act`, and `/2026alpha/signal-room` remain functional
- the new experience links to the archive only through subdued secondary text
- the archive clearly identifies the concepts as superseded explorations

## Plan evaluation and refinement

### Initial plan risks

1. **A separate focus-selection screen recreated onboarding friction.**
   - Refinement: focus selection moves onto the single start screen.
2. **Calling the selection engine “AI” would overstate the implementation.**
   - Refinement: describe it as adaptive and explain that difficulty responds to answers.
3. **Verbose feedback could push the journey beyond booth tolerance.**
   - Refinement: limit each feedback block to one short principle and one consequence.
4. **A leaderboard could reward guessing or speed rather than judgement.**
   - Refinement: use strongest-answer count, difficulty reached, and an individual profile only.
5. **The selected category is useful but not sufficient as customer research.**
   - Refinement: treat it as declared interest used to personalise play, not as a substitute for discovery.
6. **A live generative question engine would add accuracy, latency, and connectivity risks.**
   - Refinement: use an approved static bank and deterministic adaptation for the prototype.

### Final prototype scope

The refined prototype therefore contains exactly four surfaces:

1. start and focus selection
2. adaptive question
3. immediate consequence
4. result

## Mo-intent acceptance test

Before release, the prototype must satisfy every statement below:

- A booth colleague can explain it in one sentence.
- The participant sees what they will learn before pressing Start.
- The interaction looks and behaves like a familiar quiz.
- Networking, security, collaboration, and AI are meaningful content paths.
- Difficulty visibly responds to performance.
- The scenario appears before every question.
- All three actions sound initially defensible.
- Impossible is reserved for the fifth and final decision.
- There are only five questions.
- A participant can exit the active challenge from any gameplay or result screen.
- There is no second survey or confusing data-gathering phase.
- The incentive is visible but does not overpower the learning value.
- The result creates a conversation about Data<sup>#</sup>3 engineering capability.
