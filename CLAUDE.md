# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mathable is a multiplayer math-based board game built with React, TypeScript, Vite, and Convex as the backend. Players place numbered tiles on a grid-based board with mathematical operators to score points.

## Development Commands

```bash
# Start both frontend and backend in parallel
pnpm dev

# Start frontend only
pnpm dev:frontend

# Start Convex backend only
pnpm dev:backend

# Build for production
pnpm build

# Lint code
pnpm lint

# Preview production build
pnpm preview
```

## Architecture

### Backend: Convex

The backend uses Convex, a reactive serverless database and backend platform. All backend code lives in `/convex`.

#### Repository Pattern

The codebase uses a **repository pattern** with singleton instances:
- **Query repositories** (`convex/repository/query/*.repository.ts`) - Read operations from the database
- **Mutation repositories** (`convex/repository/mutations/*.repository.ts`) - Write operations to the database
- Repositories are initialized via middleware in `convex/middleware/repository.middleware.ts`
- All repositories implement interfaces defined in `convex/repository/repositories.interface.ts`
- Access repository instances via `[Repository]QueryRepository.instance` or `[Repository]MutationRepository.instance`

#### Custom Middleware

Three custom middleware functions wrap Convex functions:
- `withRepositoryQuery` - Wraps queries, initializes query repositories
- `withRepositoryMutation` - Wraps public mutations, initializes both query and mutation repositories
- `withRepositoryInternalMutation` - Wraps internal mutations, initializes both repository types

#### Function Organization

- `convex/queries/` - Public query endpoints (e.g., `queries.game.get`)
- `convex/mutations/public/` - Public mutation endpoints callable from frontend
- `convex/mutations/internal/` - Internal mutations only callable from backend code via `ctx.runMutation(internal.*)`
- Session management via `convex-helpers/server/sessions` in `convex/middleware/sessions.ts`

#### Data Model

Key tables in `convex/schema.ts`:
- `games` - Game state, indexed by token and status
- `players` - Player data linked to games and users
- `cells` - Board grid cells with mathematical operators/values/multipliers
- `tiles` - Numbered tiles that can be in bag, player hand, or on board
- `moves` - Move history for undo functionality and game state tracking
- `users` - Session-based user tracking (sessionId must not be leaked to clients)

Important: `allowedValues` and `impactingCells` in cells table track which values are valid for each cell based on adjacent mathematical constraints.

### Frontend: React + TypeScript

The frontend uses React 19 with TypeScript, organized around:

#### Routing

Three main routes defined in `src/main.tsx`:
- `/` - Home page (select/create games)
- `/game/:gameToken` - Join game page
- `/game/:gameToken/player/:playerToken` - Active game page

#### State Management

- **Zustand** for local state (`src/context/gameContext.ts`)
- **Convex hooks** for real-time reactive data
- `GameProvider` (`src/context/gameProvider.tsx`) syncs Convex data to Zustand store
- Custom hooks in `src/context/hooks.ts` expose game state: `useGame()`, `usePlayer()`, `useSessionId()`, `useLoaded()`

#### Key Libraries

- **react-dnd** - Drag-and-drop for tile placement
- **react-router-dom** - Client-side routing
- **Tailwind CSS** - Styling (v4 with Vite plugin)
- **FontAwesome** - Icons
- **Zod** - Runtime schema validation (shared schemas between frontend/backend)

#### Component Structure

- `src/components/game/` - Core game UI (board, tiles, player area)
- `src/components/home/` - Home page components
- `src/components/joinGame/` - Join game flow
- `src/components/global/` - Shared components (rules modal)
- `src/components/includes/` - Base UI components (modal, icon)

#### Factories

`src/context/factories/` contains factory functions for creating game entities:
- `gameFactory.ts` - Initial board setup, tile distribution
- `cellFactory.ts`, `tileFactory.ts`, `playerFactory.ts` - Entity creation
- These are shared with backend code (imported from src/ in convex/)

### Game Logic

#### Turn Flow

1. Current player drags tiles from hand to board cells
2. `moves` table records each placement with type `PLAYER_TO_CELL`
3. `allowedValues` recalculated when tiles placed on cells
4. Reset turn: undo all moves (unless `BAG_TO_PLAYER` move occurred from operator cell)
5. End turn: calculate score, rotate to next player, refill hand to 7 tiles, increment `currentTurn`

#### Game End Conditions

Checked in `convex/mutations/public/play.ts:endTurn`:
1. **Win**: Current player has no tiles and bag is empty
2. **Idle**: No moves for last 2 rounds (4 turns total)

## Important Patterns

### Calling Internal Mutations

```typescript
await ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
  tileId: t._id,
  playerId: p._id,
});
```

### Session-Based Authentication

- Users identified by `sessionId` stored in localStorage
- No traditional auth - session IDs map to user records
- Always use `withSessionMutation` or `withSessionQuery` for user-specific operations

### Convex-Frontend Data Flow

1. Frontend calls Convex query/mutation via `useQuery`/`useMutation` hooks
2. Convex returns data, automatically re-runs queries when data changes
3. Custom hooks in `src/hooks/convex/` fetch game/player data
4. `GameProvider` syncs to Zustand store for local access

### Path Aliases

`tsconfig.app.json` defines path aliases:
- `@context/*` → `src/context/*`
- `@hooks/*` → `src/hooks/*`
- `@components/*` → `src/components/*`
- etc.

## Key Files to Understand

- `convex/schema.ts` - Database schema and indexes
- `convex/middleware/repository.middleware.ts` - Repository initialization
- `src/context/gameContext.ts` - Global state shape
- `src/context/gameProvider.tsx` - State synchronization
- `convex/mutations/public/game.ts` - Game creation, joining, starting
- `convex/mutations/public/play.ts` - Turn management
- `src/context/factories/gameFactory.ts` - Board and tile initialization
