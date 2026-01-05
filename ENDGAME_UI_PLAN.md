# End Game UI Implementation Plan

## Overview
Display a modal when the game ends showing the final leaderboard with all players sorted by score, highlighting the winner.

## Requirements

### 1. End Game Modal Display
- Modal appears automatically when game status changes to "ended"
- Visible to ALL players in the game
- Cannot be closed (non-dismissible) - permanent game end state
- Clean, centered design using existing Modal component

### 2. Leaderboard Content
- Display all players with their final scores
- Sort players by score (descending) with tie-breaking by player order
- Highlight/distinguish the winner
- Show player names and scores clearly

### 3. Data Requirements
- Game status: "ended"
- Game winner ID (already exists in backend)
- All players with their scores
- Winner information needs to be added to frontend Game model

## Current State Analysis

### Backend (Convex)
✅ **Game Model** (`convex/domain/models/Game.ts`)
- Has `winner` property (line 15): `private _winner?: Id<"players">`
- Has `winner` getter (line 253): `get winner(): Id<"players"> | undefined`
- Game status "ended" is set when game ends

✅ **Database Schema** (`convex/schema.ts`)
- `games` table has `winner: v.optional(v.id("players"))` field (line 10)

✅ **End Game Logic**
- `EndGame.service.ts` sets winner correctly
- Both regular win and idle win set the winner field

### Frontend (React)

📍 **Current Structure**
- Main game component: `src/Game.tsx`
- Uses Modal component: `src/components/includes/modal.tsx`
- Game context: `src/context/gameContext.ts` (Zustand store)
- Game model: `src/context/model/game.ts`
- StartGameModal exists as reference: `src/components/game/startGameModal.tsx`

❌ **Missing in Frontend**
- `winner` field not in frontend Game model (`src/context/model/game.ts`)
- No EndGameModal component
- No logic to display modal when status === "ended"

## Implementation Plan

### Phase 1: Update Frontend Data Model

#### Step 1.1: Add winner to frontend Game schema
**File**: `src/context/model/game.ts`

**Changes**:
```typescript
export const gameSchema = z.object({
  id: z.string(),
  token: z.string(),
  status: gameStatusSchema.default("waiting"),
  players: z.array(playerSchema),
  cells: z.array(cellSchema),
  currentTurn: z.number(),
  tiles: z.array(tileSchema),
  winner: z.string().optional(), // Add winner field (player ID)
});
```

#### Step 1.2: Update Game transformation logic
**File**: `src/hooks/convex/game/useFetchFromBackendGameActions.tsx`

**Verify**: The `toGame` function properly maps the winner field from Convex Game to frontend Game

### Phase 2: Create EndGameModal Component

#### Step 2.1: Create EndGameModal component
**File**: `src/components/game/endGameModal.tsx` (NEW)

**Features**:
- Use existing Modal component
- Non-closeable (`canClose={false}`)
- Display game over title
- Show sorted leaderboard
- Highlight winner with special styling (e.g., gold medal icon, different background)
- Display player names and scores

**Component Structure**:
```typescript
export const EndGameModal = () => {
  const game = useGame();
  const { t } = useTranslation();
  
  // Sort players by score (desc), then by order (asc) for ties
  const sortedPlayers = useMemo(() => {
    return [...game.players].sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return a.order - b.order; // Lower order wins ties
    });
  }, [game.players]);

  const winner = game.players.find(p => p.id === game.winner);

  return (
    <Modal canClose={false} closeModal={() => null}>
      {/* Title: Game Over */}
      {/* Winner announcement */}
      {/* Leaderboard table/list */}
    </Modal>
  );
};
```

**Design Elements**:
- Title: "Game Over!" or "Game Ended"
- Winner section: "Winner: [Player Name]" with score
- Leaderboard:
  - Table or ordered list
  - Columns: Rank, Player Name, Score
  - Winner row highlighted (different background color, icon, or border)
  - Clean spacing and readable fonts
  - Use Tailwind CSS classes matching existing style

**Icons** (if available via FontAwesome):
- Trophy icon for winner
- Medal icons for top 3 positions

#### Step 2.2: Add translations
**File**: Translation files (need to locate where translations are stored)

**Keys to add**:
- "Game Over"
- "Winner"
- "Final Scores"
- "Player"
- "Score"
- "Rank"

### Phase 3: Integrate Modal into Game View

#### Step 3.1: Add EndGameModal to Game component
**File**: `src/Game.tsx`

**Changes**:
```typescript
import { EndGameModal } from "@components/game/endGameModal";

export default function Game() {
  const isLoaded = useLoaded();
  const game = useGame();

  return (
    <>
      {isLoaded ? (
        <DndProvider backend={HTML5Backend}>
          <GameStatusBar />
          <Board />
          <PlayerPlayArea />
          {game.status === "waiting" && <StartGameModal />}
          {game.status === "ended" && <EndGameModal />} {/* Add this */}
        </DndProvider>
      ) : (
        <div>Loading...</div>
      )}
    </>
  );
}
```

### Phase 4: Frontend Component Tests

#### Step 4.1: Create EndGameModal component tests
**File**: `src/components/game/__tests__/endGameModal.test.tsx` (NEW)

**Test Framework**: Vitest + React Testing Library (matching existing frontend setup)

**Tests to write**:
1. **Rendering tests**:
   - Should render modal when game status is "ended"
   - Should display "Game Over" title
   - Should show winner name and score
   
2. **Leaderboard tests**:
   - Should display all players in the leaderboard
   - Should sort players by score (descending)
   - Should handle ties by player order (ascending)
   - Should highlight the winner row
   
3. **Multiple player scenarios**:
   - Should work with 2 players
   - Should work with 3 players
   - Should work with 4 players
   
4. **Edge cases**:
   - Should handle tied scores correctly
   - Should handle negative scores
   - Should handle missing winner gracefully

**Mock Data Setup**:
```typescript
const mockGameEnded = {
  id: "game1",
  token: "token1",
  status: "ended" as const,
  winner: "player1",
  players: [
    { id: "player1", name: "Alice", score: 100, order: 1, ... },
    { id: "player2", name: "Bob", score: 75, order: 2, ... },
  ],
  // ... other fields
};
```

#### Step 4.2: Integration tests
**File**: `src/__tests__/Game.integration.test.tsx` (NEW or add to existing)

**Tests**:
- Should show StartGameModal when status is "waiting"
- Should show EndGameModal when status is "ended"
- Should show game board when status is "ongoing"

#### Step 4.3: Manual Testing Checklist
- [ ] Modal appears when game ends (regular win)
- [ ] Modal appears when game ends (idle win)
- [ ] All players see the modal
- [ ] Players are sorted correctly by score
- [ ] Winner is highlighted/distinguished
- [ ] Ties are handled correctly (lower order wins)
- [ ] Modal cannot be closed
- [ ] UI is responsive and looks good
- [ ] Translations work (if applicable)
- [ ] Works with 2, 3, and 4 players

#### Step 4.4: Visual Polish
- Ensure consistent styling with rest of app
- Add smooth animations/transitions if desired
- Verify accessibility (keyboard navigation, screen readers)
- Test on different screen sizes

### Phase 5: Optional Enhancements (Future)

These can be added later if desired:
- "Play Again" button (creates new game)
- "Return to Home" button
- Game statistics (total moves, duration, etc.)
- Share results functionality
- Confetti animation for winner
- Sound effects

## Files to Create
1. `src/components/game/endGameModal.tsx` - Main modal component
2. `src/components/game/__tests__/endGameModal.test.tsx` - Component tests
3. `src/__tests__/Game.integration.test.tsx` - Integration tests (or add to existing)

## Files to Modify
1. `src/context/model/game.ts` - Add winner field to schema
2. `src/Game.tsx` - Add conditional rendering of EndGameModal
3. `src/hooks/convex/game/useFetchFromBackendGameActions.tsx` - Verify winner mapping (may not need changes)
4. Translation files (location TBD) - Add new translation keys

## Success Criteria
- ✅ Modal displays automatically when game status is "ended"
- ✅ All players in the game see the modal
- ✅ Players are sorted by score (descending) with correct tie-breaking
- ✅ Winner is clearly highlighted
- ✅ UI is clean, readable, and consistent with app design
- ✅ Modal cannot be closed (permanent end state)
- ✅ Works correctly for all win types (regular win, idle win)
- ✅ Works with 2-4 players

## Development Approach
1. Start with Phase 1 (data model updates)
2. Create basic modal in Phase 2 (functionality first, polish later)
3. Integrate in Phase 3
4. Test thoroughly in Phase 4
5. Polish and enhance as needed

## Design Reference
Use `StartGameModal` (`src/components/game/startGameModal.tsx`) as a reference for:
- Modal usage pattern
- Styling consistency
- Translation usage
- Component structure

## Notes
- Backend already handles all game end logic correctly
- Winner field already exists in backend and database
- Frontend just needs to display the existing data
- No new backend work required
- Focus on clean, simple UI that matches existing design
