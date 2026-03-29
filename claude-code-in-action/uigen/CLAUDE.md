# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack (uses node-compat.cjs internally)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Vitest unit tests
npm run setup        # Install deps + generate Prisma client + run migrations
npm run db:reset     # Reset SQLite database
```

To run a single test file: `npx vitest run src/components/chat/__tests__/MessageList.test.tsx`

## Environment

Copy `.env` and set:
- `ANTHROPIC_API_KEY` — optional; without it the app uses a mock provider that generates static demo code
- `JWT_SECRET` — defaults to a dev-only key if unset

## Architecture

UIGen is a Next.js 15 (App Router) app where users describe React components in natural language and watch them generate in real-time with a live preview.

### Three-Panel Layout

`src/app/main-content.tsx` renders the shell:
- **Left**: Chat panel (`src/components/chat/`)
- **Right top**: Preview iframe or Code Editor tab
- **Right bottom**: File tree + Monaco editor (`src/components/editor/`)

### Request/Response Flow

1. User message → `ChatInterface` → POST `/api/chat` (`src/app/api/chat/route.ts`)
2. `route.ts` calls the AI model (Claude Haiku or mock) via the Vercel AI SDK with two tools:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`) — view/create/replace file content
   - `file_manager` (`src/lib/tools/file-manager.ts`) — rename/delete files
3. Tool calls update the **VirtualFileSystem** (`src/lib/file-system.ts`) held in `FileSystemContext`
4. The preview iframe in `PreviewFrame.tsx` picks up file changes, transpiles JSX via Babel Standalone, and re-renders the output

### Virtual File System

`src/lib/file-system.ts` is an in-memory FS (no disk writes). It is serialized to JSON and persisted in the `Project.data` column (SQLite via Prisma) for authenticated users. `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) distributes it to the component tree.

### AI Provider

`src/lib/provider.ts` returns either:
- **Claude Haiku** (`claude-haiku-4-5`) when `ANTHROPIC_API_KEY` is set
- **Mock provider** otherwise — returns hard-coded JSX so the app works without an API key

The system prompt lives in `src/lib/prompts/generation.tsx`. It instructs the model to always create `/App.jsx` as the entry point and use `@/` import aliases with Tailwind CSS.

### Authentication

JWT sessions (7-day) stored in HTTP-only cookies via `jose`. Logic in `src/lib/auth.ts` and server actions in `src/actions/`. Auth is optional — anonymous users can generate components but projects aren't persisted.

### Database

Prisma + SQLite (`prisma/dev.db`). Two models: `User` and `Project` (stores serialized messages + file system JSON). The schema is defined in `prisma/schema.prisma` — reference it anytime you need to understand the structure of data stored in the database.

### Preview System

`src/components/preview/PreviewFrame.tsx` renders an iframe with `allow-scripts allow-same-origin`. The JSX transformer (`src/lib/transform/jsx-transformer.ts`) uses Babel Standalone to transpile files and builds an import map for module resolution. Entry point auto-detection looks for `App.jsx` then `index.jsx`.

### Testing

Tests use Vitest + React Testing Library with a jsdom environment. Test files live alongside their source in `__tests__/` subdirectories. Config: `vitest.config.mts`.

## Code Style

Use comments sparingly — only for complex or non-obvious logic.
