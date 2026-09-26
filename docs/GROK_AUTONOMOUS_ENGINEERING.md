# Kingdom Studio AI — Grok Autonomous Engineering Contract

## Purpose

This document is the persistent engineering contract for autonomous work on Kingdom Studio AI.

The agent must read this file before beginning work on the repository and must continue to use it as the governing engineering instruction throughout the project.

The objective is not to produce isolated demos or individual screens. The objective is to take the existing Kingdom Studio AI repository from its current state to a reliable, generic, production-ready AI filmmaking platform.

The agent is the lead engineer responsible for repository inspection, architecture, implementation, testing, debugging, database work, AI integration, frontend work, security, verification, Git discipline, and continued execution.

The human owner is the product/creative authority. The agent should make ordinary engineering decisions autonomously and only request human input when a genuine product, destructive, security, credential, or otherwise material decision cannot safely be inferred.

---

## 1. Read the Repository Before Acting

Before implementing anything, inspect the repository itself. Do not rely on an old conversation, old plan, or assumption about the current state.

Read, when present and relevant:

- README and repository documentation
- package.json and lockfile
- AGENTS.md, CLAUDE.md, GEMINI.md or other agent instructions
- BUILD_STATUS.md
- architecture and design documents
- database schema and Supabase migrations
- API routes and server actions
- AI/provider integrations
- tests and test fixtures
- environment example files
- feature directories
- existing UI components and hooks
- Git history and recent commits
- CI workflows

Search for TODO, FIXME, placeholder, mock, temporary, disabled, and incomplete implementations.

Search production code for hardcoded test/story data before declaring a feature generic.

Treat the repository as the source of truth.

If documentation conflicts with working code, investigate the discrepancy and update the documentation when appropriate.

---

## 2. The Product Is Generic

Kingdom Studio AI is a general-purpose AI filmmaking platform.

It must work with arbitrary screenplays rather than one particular story.

The current screenplay `THE MESSAGE` is only a regression/test fixture. Its characters, locations, events, dialogue, title, and plot must never be embedded in production logic.

Never hardcode screenplay-specific entities such as:

- Michael
- Esther
- Tunde
- Kunle
- The Message
- Old Railway Station

or equivalent test-story information into production behaviour.

The platform must support screenplays with different:

- titles
- character names
- character counts
- genres
- languages where supported
- locations
- scene counts
- formatting styles
- levels of detail
- narrative structures
- named and unnamed characters
- short and feature-length structures

Regression tests may use THE MESSAGE, but production code must operate from screenplay data and canonical domain models.

---

## 3. Core Product Pipeline

The intended production pipeline is:

Screenplay
→ Canonical Screenplay Analysis
→ Story Intelligence
→ Story Bible
→ Characters
→ Locations
→ Scenes
→ Shot List
→ Storyboard
→ AI Director
→ Assets
→ Generation Jobs
→ Image/Video/Audio Generation
→ Render
→ Export

Build the dependency chain in this order unless repository evidence shows a different dependency is required.

Do not repeatedly ask what module to build next when the next dependency is clear from the repository and this pipeline.

After completing one milestone, verify it, update project status, commit it, push it, and continue to the next executable dependency.

---

## 4. Canonical Intelligence Architecture

Use a canonical screenplay intelligence layer as the shared source for downstream production features.

The desired architecture is:

SCREENPLAY
→ CANONICAL ANALYSIS
→ DOMAIN INTELLIGENCE
→ AI PROPOSALS
→ USER REVIEW/EDIT
→ APPROVAL
→ PERSISTED DOMAIN MODEL

Do not allow Story Bible, Characters, Locations, Scenes, Shot Lists, Storyboards, or AI Director features to independently invent contradictory interpretations of the same screenplay when canonical intelligence can be reused.

Canonical analysis should preserve, where supported:

- screenplay title
- screenplay version
- scenes
- scene headings
- locations
- time of day
- characters
- character appearances
- dialogue
- action
- transitions
- narrative beats
- relationships
- themes
- visual signals
- production signals
- evidence
- uncertainty

Structured AI responses must be validated before persistence.

---

## 5. Facts, Interpretations, and Unknowns

Every AI-assisted creative workflow must distinguish:

1. SCREENPLAY FACT — directly supported by source material.
2. GROUNDED INTERPRETATION — an AI inference supported by source evidence but not explicitly stated.
3. UNKNOWN / UNCERTAIN — information the screenplay does not establish.
4. USER INPUT — information supplied or approved by the filmmaker.

Never turn an unknown into a fact merely because an AI model produced a plausible answer.

Preserve unresolved mysteries, ambiguous character roles, unidentified people, unknown motives, and missing production information.

---

## 6. AI Proposal and User Authority

AI is an assistant, not the final creative authority.

The preferred workflow is:

AI proposes
→ User reviews
→ User edits if necessary
→ User applies/approves
→ System persists

Do not silently overwrite user-approved creative information with a later AI synchronization.

When screenplay content changes, generate updated proposals and preserve existing user-approved information unless the user explicitly changes it.

AI-generated information should have provenance where practical, including source screenplay/version, source entity/evidence, provider/model, and creation time.

---

## 7. Story Bible

Story Bible synchronization must be generic and screenplay-driven.

AI may propose:

- title
- logline
- synopsis
- human problem
- theme
- core message
- narrative structure
- genre
- tone
- language
- visual style
- target audience
- universe
- time period
- primary locations
- AI context
- writing rules
- forbidden elements
- preferred vocabulary
- visual consistency rules

But unsupported fields must not be fabricated.

Kingdom-specific fields such as Burden, Truth, Scripture Foundation, and Kingdom Objective must not be invented simply because the application is Christian/Kingdom-focused. If the screenplay does not provide sufficient evidence, leave those fields for the filmmaker to define.

Story Bible completion percentages must be deterministic and based on actual persisted state, never hardcoded placeholders.

---

## 8. Character Intelligence

Characters must be extracted dynamically from canonical screenplay analysis.

Support characters introduced through:

- dialogue cues
- action
- scene descriptions
- relationships
- other valid screenplay evidence

Do not mistake:

- transitions
- action labels
- scripture references
- ordinary prose
- message text
- locations
- headings
- generic words

for character entities.

A character profile may contain:

- name
- role
- status
- age
- gender
- occupation
- nationality
- ethnicity
- biography
- appearance
- distinguishing features
- height
- weight
- eye colour
- hair colour
- personality
- strengths
- weaknesses
- fears
- habits
- values
- motivation
- goal
- conflict
- character arc
- spiritual journey
- speech style
- catchphrases
- AI instructions

Only populate information supported by screenplay evidence, grounded AI interpretation, or user input. Keep unsupported information unknown.

Character completion must be calculated from actual schema state and must work for any character. Never create completion logic around a named test character.

AI character synchronization must use a proposal/persistence boundary. Existing user-approved character data remains authoritative.

---

## 9. Locations

Locations should be extracted from canonical screenplay intelligence.

A location model should support, where appropriate:

- name
- type
- description
- visual characteristics
- time context
- scenes using the location
- source evidence
- AI proposal data
- user-approved data
- provenance

Do not create fictional locations merely because an AI model guessed one.

---

## 10. Scenes

Scenes must remain traceable to screenplay source material.

A scene should maintain relationships to relevant:

- screenplay version
- scene heading
- location
- characters
- action
- dialogue
- narrative purpose
- visual direction
- production requirements

AI may enrich a scene, but it must not silently rewrite confirmed screenplay facts.

---

## 11. Shot Lists and Storyboards

Shot planning should consume screenplay, scene, character, and location intelligence.

Support shot data such as:

- shot number
- scene
- shot type
- framing
- camera angle
- camera movement
- lens suggestion where useful
- subject
- action
- dialogue reference
- visual description
- continuity information
- generation prompt
- production status

Storyboards must use the same character and location intelligence so visual continuity can be maintained.

Do not generate disconnected images that ignore established character/location information.

---

## 12. AI Director

The AI Director should function as a production intelligence layer for:

- scene intent
- blocking
- camera
- composition
- lighting
- pacing
- sound
- emotional progression
- continuity
- visual storytelling

It may propose creative decisions, but must distinguish proposals from confirmed screenplay facts and user decisions.

---

## 13. Assets and Generation Jobs

Assets should be reusable production entities associated with the relevant production and domain entities.

Support, where appropriate:

- character references
- location references
- props
- costumes
- generated images
- generated video
- audio
- music
- documents
- other production references

AI generation should be represented as a job with appropriate state such as:

- queued
- running
- completed
- failed
- cancelled

Persist provider/model, prompt, parameters, source entity, status, output, error information, and timestamps where appropriate.

Generation failures must be recoverable and observable.

---

## 14. AI Providers and Fallbacks

Keep AI provider integrations behind maintainable abstractions.

The repository may use providers such as OpenAI, Gemini, OpenRouter, Replicate, Hugging Face, Cloudflare, xAI, or others.

Never hardcode API keys.

Never expose secrets in source, logs, UI, commits, or generated documentation.

Use environment variables.

When a task supports provider fallback, implement a clear fallback strategy and preserve useful error information.

Do not assume one provider will always respond successfully.

Handle:

- empty responses
- malformed JSON
- timeouts
- rate limits
- authentication failures
- provider errors
- network errors
- token/context limits

Validate AI output before persistence.

---

## 15. Database and Security

Use the existing Supabase architecture consistently.

Maintain:

- foreign keys
- constraints
- indexes
- ownership relationships
- timestamps
- versioning where needed
- provenance
- RLS

Do not weaken Row Level Security simply to make a workflow easier.

User-owned production data must not be accessible across unauthorized users or productions.

Test important authorization boundaries.

---

## 16. Screenplay Versioning and Synchronization

Screenplays change during real production.

When a screenplay changes:

1. Preserve or create the appropriate screenplay version.
2. Re-run canonical analysis.
3. Determine what intelligence changed.
4. Update downstream proposals as necessary.
5. Preserve user-approved information.
6. Avoid destructive silent overwrites.
7. Preserve provenance.
8. Expose meaningful changes to the user where practical.

A screenplay update must not corrupt established production information.

---

## 17. Testing Strategy

Tests must prove generic behaviour, not only the current example.

Keep THE MESSAGE as a regression fixture, but also create additional fictional fixtures with different:

- character names
- character counts
- genres
- scene structures
- locations
- screenplay formatting
- sparse information
- unnamed characters

Test important behaviours such as:

- character extraction
- action-only character detection
- cue normalization
- transition rejection
- location extraction
- scene extraction
- canonical analysis
- proposal generation
- provenance
- user-approved data preservation
- screenplay re-synchronization
- deterministic completion calculations
- malformed AI responses
- provider fallback

Search production code for test-story names and fail or review if they appear outside legitimate test fixtures.

---

## 18. Verification Gate

Before declaring a milestone complete, run the relevant tests and, for meaningful repository changes, run:

`npm test`

`npm run lint`

`npx tsc --noEmit`

`npm run build`

Do not claim a command passed unless it was actually executed.

If a command fails, investigate and fix the underlying issue. Re-run it.

A build that compiles but has failing tests is not green.

A passing unit test suite with a broken production build is not green.

---

## 19. UI Verification

For user-facing changes, verify the actual workflow rather than relying only on unit tests.

Check:

- navigation
- loading states
- empty states
- error states
- form behaviour
- save behaviour
- refresh behaviour
- persistence
- AI sync
- proposal review
- apply/save boundaries
- database updates
- authorization

The target is an end-to-end working product.

---

## 20. Git Workflow

Use focused feature branches when appropriate.

Make coherent commits with meaningful messages.

Before pushing a completed milestone, verify the relevant test/build commands.

Update BUILD_STATUS.md with the actual state.

Push the verified milestone.

Then inspect the repository again and continue to the next dependency.

Do not create a commit merely to appear active.

Do not push known broken code unless the user explicitly requests an intermediate checkpoint and the commit clearly states its status.

---

## 21. Autonomous Execution Rules

The default operating mode is continuous execution.

Do not stop after producing a roadmap.

Do not stop after implementing one file.

Do not ask “what should I build next?” when repository evidence and this contract make the next step clear.

Do not repeatedly ask the human to restate project context.

Instead:

1. Inspect.
2. Determine the next dependency.
3. Implement.
4. Test.
5. Debug.
6. Verify.
7. Document.
8. Commit.
9. Push.
10. Continue.

Only stop and ask the human when there is a genuine decision that cannot safely be inferred.

Examples of valid reasons to ask:

- destructive product behaviour is ambiguous
- two materially different product architectures are possible
- an external credential/permission is required
- security/privacy/legal approval is required
- a major creative/product decision cannot be inferred

Routine engineering choices should be made autonomously.

---

## 22. Failure Recovery

When something fails, do not simply report it.

Use this loop:

FAILURE
→ READ ERROR
→ LOCATE SOURCE
→ UNDERSTAND ROOT CAUSE
→ PATCH CORRECT ABSTRACTION
→ ADD REGRESSION TEST
→ RUN TEST
→ RUN FULL VERIFICATION
→ CONTINUE

Do not hide failures or mark them resolved without evidence.

---

## 23. Avoid Shallow Fixes

Do not solve a generic architectural problem by adding special cases for the current screenplay.

Bad approach:

“If the character is Michael, populate these fields.”

Correct approach:

“Determine what can be inferred for any character from available screenplay evidence and populate only supported information.”

Bad approach:

“If the Story Bible is THE MESSAGE, use these values.”

Correct approach:

“Analyze the current screenplay dynamically and produce grounded proposals.”

Bad approach:

“Set completion to 80% after sync.”

Correct approach:

“Calculate completion deterministically from actual model state.”

Always fix the abstraction rather than the current example.

---

## 24. Documentation and Project Memory

Maintain repository documentation so another engineering session can continue without relying on chat history.

At minimum keep current:

- BUILD_STATUS.md
- relevant architecture documentation
- test documentation where useful
- environment requirements without secrets
- migration notes where necessary

When a significant architectural decision is made, document the reason and expected invariant.

---

## 25. Production Readiness Gate

Do not declare the platform production-ready merely because the UI contains all pages.

The final system should have working end-to-end flows for:

- authentication
- authorization
- screenplay import
- screenplay versioning
- canonical screenplay analysis
- Story Bible intelligence
- character intelligence
- location intelligence
- scene intelligence
- shot planning
- storyboard generation
- AI Director
- asset management
- generation jobs
- provider fallback where supported
- rendering
- export
- persistence
- provenance
- user approval boundaries
- error handling
- loading/empty states
- RLS/security
- automated tests
- lint
- TypeScript validation
- production build

A module is complete when its actual user workflow works, not merely when its page exists.

---

## 26. Final Operating Principle

Build the product, not the demo.

Build generic capabilities, not screenplay-specific hacks.

Preserve working code.

Improve weak abstractions when necessary.

Do not invent unsupported story facts.

AI proposes; the filmmaker decides.

Verify before claiming success.

Keep the repository as the persistent source of truth.

Keep BUILD_STATUS.md current.

Commit coherent milestones.

Push verified work.

Continue through the production pipeline until Kingdom Studio AI is genuinely usable from screenplay through final export.

When one module is complete, do not wait for another prompt if the next dependency is clear.

Continue.
