# Repository Guidelines

## Project Structure & Module Organization

Source lives in `src/` (TypeScript). Key areas:
- `src/const` — constants, enums, keyboard labels.
- `src/common` — shared types/enums and base structures.
- `src/helpers` — parsing/formatting utilities.
- `src/services` — business logic (DynamoDB, scheduling, messaging).

Compiled output goes to `dist/` (generated). Docs are in `docs/`, including architecture notes in `docs/architecture.md`.

## Build, Test, and Development Commands

Use npm scripts from `package.json`:
- `npm run dev` — development mode via nodemon (rebuilds `dist/`, runs with `NODE_ENV=development`).
- `npm run prod` — production run (tsc build + run `dist/index.js`).
- `npm run build-prod` — build + copy env/config into `dist/` for a production bundle.
- `npm run docker-build` / `npm run docker-run` — build and run the production Docker image.

## Coding Style & Naming Conventions

- Language: TypeScript (Node.js).
- Indentation: follow existing files (4 spaces in `src/`).
- Prefer existing patterns for imports and enums; keep naming descriptive (e.g., `MessageService`, `DbAwsService`).
- No formatter or linter is configured; keep style consistent with nearby code.

## Testing Guidelines

No automated test framework is configured. If you add tests, document the runner and add a script to `package.json`. For now, validate changes by running `npm run dev` or `npm run prod`.

## Commit & Pull Request Guidelines

Commit history uses short, descriptive messages with task IDs (e.g., `ICTB-34 add interval support`) and occasional conventional prefixes like `fix:`. Follow that pattern when possible.

For pull requests, include:
- a concise description of behavior changes,
- links to related tasks/issues,
- and how you verified the change (command/output or manual steps).

## Configuration & Secrets

Configuration comes from `.env` or `.env.production` (see `.env.example`). Never commit real tokens; keep secrets local.

## Additional Documentation

`docs/architecture.md` – high-level architecture;
`docs/architecture-rules.md` – architecture rules;
`docs/tasksTrackingSystem.md` – task tracking;
`docs/requirements.md` – project requirements.

## TODOs Plans & Future Work

See `docs/tasksTrackingSystem.md` Look for tasks with TODO that are not crossed out. (Crossed out tasks are done.).

Before completing the task, analyze the project and ask me clarifying questions (1-5 questions). After I answer them, create a detailed plan with points and sub-points. Add this plan to the file "docs/plans.md" with the specified ICTB number with "TODO". Refer to this plan each time and update it as you complete the task.
