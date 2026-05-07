# Diagram-as-Research

_Derived from Julie Yaunches' "Accelerated Engineering" talk (NVIDIA, AI Agents 2026, May 5 2026)._

> **"Diagramming is a thinking tool — not just documentation."** (slide 14:36:07)
>
> **"One prompt. Codebase → diagram → shared understanding."** (slide 14:36:41)

The slowest part of any non-trivial change is loading the right mental model. Yaunches uses a personal mermaid-to-png skill to do this many times per session — the agent reads the codebase, generates a mermaid diagram, renders to PNG, opens it, then iteratively zooms via prompts like "let's dig into how the gateway works with OpenShell."

The point is **interrogation, not documentation**. The diagram is throwaway. The mental model that survives is the value.

---

## When to use it

Always before:

- Touching multi-agent orchestration config
- Changing a multi-stage analysis pipeline (test → object store → status → queue → callback)
- Modifying a streaming-chat path (client → load balancer → app server → tool calls → session manager → response stream)
- Editing concurrent-write paths on hot database tables
- Live/test mode boundary changes in payment integrations
- Adding or recreating a serverless function in a multi-function fleet
- Wiring a new MCP server or modifying agent collaborations
- Touching auth (Cognito flows, middleware, JWT, CSRF)
- Catalog import + search dedup paths (synthetic-id deduplication, fallback stores)

Skip for:
- One-line bug fixes where the seam is obvious
- Documentation-only changes
- Fixing a flaky test in a single suite

---

## How to do it

1. **Ask the agent for a high-level diagram first.** Example prompt:
   > "Draw a mermaid diagram of the streaming chat path from a client message arriving at the bot through the supervisor's `process_user_query` to the response. Include the load balancer, the app server, the session manager, and any tool-calling hops. Render it as PNG so I can look at it."

2. **Wait, look, then zoom in.** Pick the box that's least clear. Example follow-up:
   > "Now zoom into the supervisor — show me how `process_user_query` decides whether to call the analysis agent vs. the metadata agent vs. the metrics agent. Same render pattern."

3. **Surface specific facts you didn't know before continuing.** Yaunches' gateway example surfaced four facts via diagram:
   - Agent calls `inference.local` — never sees credentials
   - Gateway injects credentials and forwards to provider
   - Policy engine blocks all unallowed egress
   - Credential store lives on host, not in sandbox

   The example pattern: a user-facing streaming endpoint where the bytes flow through 4–6 layers (auth → request handler → message bus → worker → stream-back → client). The diagram surfaces which layer owns which credential / state.

4. **Save the PNG only if the artifact will be re-used.** Most diagrams are throwaway — the value is loading the model into your context, not the file. If you save it, put it in `.planning/diagrams/<task-slug>/` (gitignored).

---

## Companion tools

- Your codebase's whole-subsystem graphify tool, if any (e.g. graphify, code2graph, AST-based mapping). Heavier than per-task mermaid; useful when the diagram needs to be re-queryable.
- **mermaid native rendering** in the Claude Code preview panel — use this for the lightweight per-task pattern. Just ask the agent to output mermaid in a fenced code block; the renderer takes care of it.

---

## Generic seams worth diagramming

When you're trying to load a system into context, the diagrams that pay off most are the ones drawn around real integration boundaries:

- Multi-agent supervisor + tool-calling chain
- Auth surface (JWT verification → session-cookie → middleware)
- Concurrent-write database hot path
- Async pipeline (event → queue → worker → callback)
- Live/test mode boundary in payment integrations
- Catalog/search dedup paths

---

## What NOT to do

- **Don't use diagram-as-research as documentation.** Yaunches was explicit: "diagramming is a thinking tool — not just documentation." Documentation lives in the repo and ages out. The diagram you draw before a task is a throwaway thinking tool.
- **Don't draw the whole codebase.** Always start specific. "How does X talk to Y?" not "Draw the whole system." (For whole-codebase mapping, use a dedicated codebase-mapping tool.)
- **Don't skip the iteration step.** The first diagram is rarely right. Yaunches: "you're kind of like interrogating the diagram until you see what's happening."
- **Don't draw a diagram that just rephrases the file structure.** If the diagram is `Service A → Service B → Service C` with no constraints, hidden invariants, or trust boundaries surfaced, it's not adding context. Push the agent to surface what's interesting: "what credentials cross which boundaries", "what's the failure mode when X is unreachable", "where does the invariant break if a step retries".
