Antigravity IDE - Project Rules

Token Management & Execution Constraints

No Automated Builds:
Do not run build commands (e.g., npm run build, vite build, yarn build). Rely strictly on hot-module reloading.

No Browser Automation:
Do not launch the browser, take screenshots, or generate visual artifacts. I will manually test all UI and layout changes myself.

Targeted File Editing:
Do not perform open-ended searches across the codebase. Ask me for the exact file path if you do not know where a component is located.

Strict Ignore Policy:
Never read, index, or analyze files inside node_modules, .next, dist, build, or .env files under any circumstances.

Graphify Knowledge Graph Usage

You have access to a Graphify knowledge graph at: ./graphify-out

For every question about architecture, data flow, or finding components:

First run: graphify query "<user question>" --graph ./graphify-out/graph.json

Use ONLY the returned graph context to answer.

If the graph context is insufficient, then (and only then) read specific files.

Rules for the Graph:

Do NOT scan the entire codebase.

Do NOT load full files unless absolutely necessary.

Prefer relationships, dependencies, and paths from the graph.

Cite source files mentioned in the graph output when possible.