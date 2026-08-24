# AI Coding Rules

## Understand Before Changing

- For non-trivial tasks, inspect the relevant implementation, nearby call sites, and tests or validation commands before editing.
- Identify the likely root cause from repository evidence, including state, rendering, lifecycle, DOM, CSS, API/data flow, configuration, and event handling where relevant.
- State a falsifiable local hypothesis and choose the cheapest check that could disconfirm it before making a substantive change.
- For simple or obvious changes, proceed directly without unnecessary exploration.

## Project Context

- This is a no-build vanilla JavaScript SPA. The browser entry points are [index.html](index.html), [js/core.js](js/core.js), and [js/app.js](js/app.js); do not introduce framework or bundler assumptions.
- [js/core.js](js/core.js) owns shared client state, session storage, API requests, escaping, and small client helpers. [js/app.js](js/app.js) owns rendering and event handling; `render()` replaces `#app` wholesale, so preserve the existing modal and event-delegation flow.
- [api/](api) contains Vercel serverless handlers backed by Supabase Postgres. Reuse shared helpers such as `_auth.js`, `_cors.js`, `_audit.js`, and `_errors.js` instead of duplicating security or response logic.
- Keep secrets in environment variables. Never expose Supabase service-role credentials, password hashes, session secrets, or OAuth client secrets to browser code or logs.
- Treat any credential pasted into chat, source, or command output as exposed: do not reuse or persist it, and recommend rotating it before deployment.
- Preserve the current authentication, token revocation, bcrypt password handling, CORS, audit logging, and last-admin safeguards unless the requested change explicitly concerns them.
- Use the existing REST/PostgREST patterns and request/response shapes unless a coordinated API change is required.
- Read [README.md](README.md) for setup, deployment, environment variables, local development, and known intentional limitations.

## Scope and Simplicity

- Implement the requested outcome within the smallest reasonable area. Defer unrelated refactoring, redesign, cleanup, feature additions, and dependency changes.
- Prefer existing project patterns and simple standard-library solutions. Do not add abstractions or dependencies without a concrete need.
- Preserve public APIs, existing behavior, user-authored changes, and unrelated uncommitted work. Do not reset, clean, discard, or rewrite work you did not create.
- Do not create new files unless the task requires them or the existing structure cannot support the change.
- Keep code comments rare and purposeful; do not add narration for self-explanatory code.

## Verification

- After editing, run the narrowest relevant executable check before further exploration or patching.
- For client changes, use a browser check when available and inspect console errors and the affected DOM behavior.
- For server changes, exercise the affected endpoint with local `vercel dev` when environment variables are available; otherwise run focused syntax checks and clearly report the limitation.
- For simple JavaScript changes, at minimum run `node --check` on each changed JavaScript file.
- Review the final diff for scope, accidental edits, temporary debugging code, and obvious regressions. Never claim a check passed unless it was actually run.

## Recovery

- If two implementation attempts fail, stop speculative changes, reassess the diagnosis, preserve the current work, and explain the blocker before proceeding.
- Ask for clarification only when requirements conflict, a critical requirement is missing, materially different interpretations are possible, or proceeding could break important functionality.