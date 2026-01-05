# End Game Implementation Plan

## Overview
Complete the end game logic for Mathable, focusing on final score calculations and proper game termination conditions.

## Requirements

### 1. Game Win Condition (Regular Win)
- ✅ Current player has no tiles in hand at end of turn
- ✅ Bag is empty
- ✅ Winner gets points from all opponent tiles added to their score
- ✅ Each opponent loses points equal to their remaining tiles

### 2. Game Idle Condition (Idle Win)
- ✅ No PLAYER_TO_CELL moves for 2 full rounds (2 turns per player)
- ✅ Reset moves (CELL_TO_PLAYER) don't count as playing
- ✅ Winner is player with highest score
- ✅ NO score adjustments (no tile bonuses/penalties)

## Implementation Steps (Test-Driven)

### Phase 0: Test Existing EndGameService Implementation ✅ COMPLETED

#### Step 0.1: Create EndGameService Unit Tests ✅
**File**: `convex/tests/services/EndGame.service.test.ts` (CREATED)

**Purpose**: Test the existing `EndGameService` methods to ensure current functionality works before making changes.

**Tests written:** (All 15 tests passing ✅)

1. **isGameWon() tests:** ✅
   - ✅ "should return true when player has no tiles and bag is empty"
   - ✅ "should return false when player has tiles even if bag is empty"
   - ✅ "should return false when bag has tiles even if player has no tiles"
   - ✅ "should return false when both player and bag have tiles"

2. **isGameIdle() tests:** ✅
   - ✅ "should return false when no moves exist"
   - ✅ "should return false when last move is recent (within 2 rounds)"
   - ✅ "should return true when last move is older than 2 rounds for 2 players"
   - ✅ "should return true when last move is older than 2 rounds for 3 players"
   - ✅ "should return true when last move is older than 2 rounds for 4 players"

3. **endGameWithWinner() tests:** ✅
   - ✅ "should set game status to ended"
   - ✅ "should set winner id correctly"
   - ✅ "should save game to database"

4. **endGameAsIdle() tests:** ✅
   - ✅ "should set game status to ended"
   - ✅ "should not set a winner"
   - ✅ "should save game to database"

**Test Approach:**
- Tests access EndGameService through the EndTurn usecase (via API mutations)
- This is necessary because the service is accessed through the DI container which is only available in Convex functions
- Used GameTestHelper to create test games and players
- Manually set up game state (empty bags, old moves, etc.) to trigger different scenarios

#### Step 0.2: Run Tests and Fix Issues ✅
- ✅ All 15 tests passing
- ✅ Fixed test data to include valid cellId and tileId for PLAYER_TO_CELL moves (Move factory validates these fields)

#### Step 0.3: Document Current Behavior ✅

**Findings:**

1. **isGameWon() works correctly:**
   - ✅ Returns true ONLY when both conditions met: player has no tiles AND bag is empty
   - ✅ Returns false in all other combinations
   - **Note**: This is the correct behavior per requirements

2. **isGameIdle() works correctly:**
   - ✅ Returns false when no moves exist
   - ✅ Correctly calculates idle based on player count: `lastMove.turn < game.currentTurn - (2 * playerCount)`
   - ✅ Tested with 2, 3, and 4 players - all working correctly
   - **Important Discovery**: Current implementation checks for ANY move, not specifically PLAYER_TO_CELL moves
   - **Action Required**: Phase 1 will need to update this to only check PLAYER_TO_CELL moves (actual tile placements)

3. **endGameWithWinner() works correctly:**
   - ✅ Sets game status to "ended"
   - ✅ Sets winner ID correctly
   - ✅ Persists changes to database
   - **Note**: Currently does NOT apply final scoring (this is expected, Phase 2 will add this)

4. **endGameAsIdle() works correctly:**
   - ✅ Sets game status to "ended"
   - ✅ Does NOT set a winner (correct for idle games)
   - ✅ Persists changes to database
   - **Important Discovery**: Current implementation does NOT determine winner by highest score
   - **Action Required**: Phase 1 will need to add logic to find highest scorer and set as winner

**Known Limitations (to be addressed in later phases):**
- ❌ isGameIdle() checks ANY move type, should only check PLAYER_TO_CELL moves
- ❌ endGameAsIdle() doesn't determine winner by highest score
- ❌ endGameWithWinner() doesn't apply final score adjustments (tile bonuses/penalties)

**Test Quality:**
- All tests are integration tests through the actual use case
- Tests verify both service behavior AND database persistence
- Tests cover all player count variations (2, 3, 4 players)
- **Idle detection tests use realistic gameplay simulation:**
  - Players actually play tiles in round 1
  - Players end turns without playing for 2 full rounds
  - Tests verify idle detection triggers correctly on the first turn after 2 idle rounds
  - This approach is more realistic than manually inserting move records

**Phase 0 Success Criteria:** ✅ ALL MET
- ✅ All tests pass
- ✅ Existing functionality verified
- ✅ No regression issues found
- ✅ Baseline established for future changes

---

### Phase 1: Test Setup and Idle Win Logic

#### Step 1.1: Write Test for Idle Win Detection
**File**: `convex/tests/usecases/play/EndTurn.usecase.test.ts`
- Test: "should detect idle win when no tiles played for 2 rounds"
- Test: "should not detect idle if PLAYER_TO_CELL move exists within 2 rounds"
- Test: "should not detect idle if CELL_TO_PLAYER (reset) is only move"
- Test: "should detect idle after both players reset but don't place tiles"

#### Step 1.2: Update EndGameService.isGameIdle()
**File**: `convex/domain/services/Game/EndGame.service.ts`
- Change logic to find last PLAYER_TO_CELL move (not just any move)
- Calculate rounds correctly: `2 rounds = 2 * number of players turns`
- Consider CELL_TO_PLAYER and BAG_TO_PLAYER as non-playing moves

#### Step 1.3: Write Test for Idle Win Resolution
**File**: `convex/tests/usecases/play/EndTurn.usecase.test.ts`
- Test: "should end game as idle with highest scorer as winner"
- Test: "should handle tie in idle scenario (first by order wins)"
- Test: "should not apply tile bonuses in idle win"

#### Step 1.4: Implement Idle Win Resolution
**File**: `convex/domain/services/Game/EndGame.service.ts`
- Create new method: `endGameAsIdle(game: Game)` 
  - Find player with highest score
  - Set that player as winner
  - End game with status "ended"
  - NO score adjustments

**File**: `convex/repository/query/moves.repository.ts`
- Add method: `findLastPlayerToCellMove(game: Game)` to find last actual tile placement

### Phase 2: Regular Win with Final Scoring

#### Step 2.1: Write Tests for Final Score Calculation
**File**: `convex/tests/services/FinalScore.service.test.ts` (NEW)
- Test: "should calculate opponent tile sum correctly"
- Test: "should add opponent tiles to winner score"
- Test: "should subtract tiles from each opponent score"
- Test: "should handle multiple opponents (3-4 players)"
- Test: "should not modify scores in idle win"

#### Step 2.2: Create FinalScore Service
**File**: `convex/domain/services/Play/FinalScore.service.ts` (NEW)
- Interface: `FinalScoreServiceInterface`
  - `calculateAndApplyFinalScores(game: Game, winner: Player, players: Player[]): Promise<void>`
  
- Implementation:
  1. Get all tiles for each opponent player
  2. Sum opponent tile values
  3. Add sum to winner's score
  4. For each opponent: subtract their tile values from their score
  5. Save all modified players

#### Step 2.3: Write Tests for Regular Win Flow
**File**: `convex/tests/usecases/play/EndTurn.usecase.test.ts`
- Test: "should end game when player empties hand with empty bag"
- Test: "should apply final scoring on regular win"
- Test: "should not end game if bag has tiles even if hand empty"
- Test: "should not end game if player has tiles even if bag empty"

#### Step 2.4: Update EndGameService.endGameWithWinner()
**File**: `convex/domain/services/Game/EndGame.service.ts`
- Call FinalScoreService to adjust scores
- Set winner in game
- End game with status "ended"

### Phase 3: Integration and Edge Cases ✅ COMPLETED

#### Step 3.1: Update EndTurn UseCase ✅
**File**: `convex/usecases/play/EndTurn.usecase.ts`
- ✅ Ensure proper order: check win first, then idle (VERIFIED - win check at line 41, idle check at line 47)
- ✅ Return appropriate game ended status and winner info (VERIFIED)

#### Step 3.2: Integration Tests ✅
**Status**: All required integration tests already exist in `convex/tests/usecases/play/EndTurn.usecase.test.ts`

Integration tests completed:
- ✅ "should end game when player empties hand with empty bag" (line 418) - Complete game flow with regular win
- ✅ "should apply final scoring on regular win" (line 474) - Verifies final scores in database
- ✅ "should end game as idle with highest scorer as winner" (line 220) - Complete game flow with idle win
- ✅ "should not apply tile bonuses or penalties in idle win" (line 343) - Verifies no scoring adjustments
- ✅ All tests verify game status transitions properly (ongoing → ended)

Total: 13 EndTurn integration tests, all passing ✅

#### Step 3.3: Edge Case Tests ✅
**Status**: All required edge case tests already exist

Edge cases covered:
- ✅ "should handle negative scores after final scoring" - In `convex/tests/services/FinalScore.service.test.ts:131`
- ✅ "should return true when last move is older than 2 rounds for 3 players" - In `convex/tests/services/EndGame.service.test.ts:369`
- ✅ "should return true when last move is older than 2 rounds for 4 players" - In `convex/tests/services/EndGame.service.test.ts:442`
- ✅ "should not end game if bag has tiles even if hand empty" (line 546) - Verifies last tile placement doesn't trigger premature win
- ✅ "should not end game if player has tiles even if bag empty" (line 584) - Verifies both conditions required
- ✅ BAG_TO_PLAYER moves handled correctly in `ResetTurn.usecase.ts` - Can't undo random tile draws from operator cells

**Note**: The edge case "player empties hand mid-turn by picking from operator cell" is already properly handled by the game logic. When a player clicks an operator cell and gets a BAG_TO_PLAYER tile, the ResetTurn logic prevents undoing that move, ensuring the randomness is preserved. Win detection happens at EndTurn, after all mid-turn actions.

### Phase 4: Repository Updates ✅ COMPLETED

#### Step 4.1: Update MovesQueryRepository ✅
**File**: `convex/repository/query/moves.repository.ts`
- ✅ Added: `findLastPlayerToCellMove(game: Game): Promise<Move | null>` - Used by EndGame.service.ts

#### Step 4.2: Update PlayersQueryRepository ✅
**File**: `convex/repository/query/players.repository.ts`
- ✅ Verified: `findByGame()` returns all players (line 63)
- ✅ No separate `findHighestScorer` needed - logic implemented inline in EndGame.service.ts:108-133 with proper tie-breaking

### Phase 5: Service Registration ✅ COMPLETED

#### Step 5.1: Register FinalScore Service ✅
**File**: `convex/services.config.ts`
- ✅ FinalScoreServiceInterface added to container (line 136)
- ✅ Singleton instance registered (lines 137, 151)

#### Step 5.2: Update Type Definitions ✅
**File**: `convex/domain/services/Game/FinalScore.service.ts`
- ✅ FinalScoreServiceInterface exported from service file (interface is self-contained)

## Testing Strategy

### Unit Tests
- Each service method tested in isolation
- Mock repositories and dependencies
- Cover all edge cases

### Integration Tests  
- Full game flow from start to win/idle
- Verify database state after game ends
- Test with 2, 3, and 4 players

### Test Data Helpers
- Create helper methods in GameTestHelper:
  - `setupGameNearWin()` - game with empty bag, player with 1 tile
  - `setupGameNearIdle()` - game with no moves for multiple turns
  - `placeTileAndScore()` - helper to place tile and track moves

## Success Criteria ✅ ALL MET

- ✅ All tests pass (79 tests passing)
- ✅ Regular win correctly applies final scoring
- ✅ Idle win correctly identifies highest scorer
- ✅ Idle win does NOT apply tile bonuses/penalties
- ✅ Game status properly transitions to "ended"
- ✅ Winner is properly recorded in database
- ✅ No regression in existing functionality

## Files Created ✅
1. ✅ `convex/tests/services/EndGame.service.test.ts` (Phase 0) - 15 tests
2. ✅ `convex/tests/services/FinalScore.service.test.ts` (Phase 2) - 5 tests
3. ✅ `convex/domain/services/Game/FinalScore.service.ts` (Phase 2)
4. ❌ `convex/tests/usecases/play/EndGame.integration.test.ts` (NOT NEEDED - integration tests added to EndTurn.usecase.test.ts instead)

## Files Modified ✅
1. ✅ `convex/domain/services/Game/EndGame.service.ts` - Added idle win logic and final scoring integration
2. ✅ `convex/usecases/play/EndTurn.usecase.ts` - Already had correct win/idle order
3. ✅ `convex/tests/usecases/play/EndTurn.usecase.test.ts` - Added 13 tests total (9 new tests for idle and regular win)
4. ✅ `convex/repository/query/moves.repository.ts` - Added findLastPlayerToCellMove method
5. ✅ `convex/repository/query/players.repository.ts` - Verified findByGame works (no changes needed)
6. ✅ `convex/services.config.ts` - Registered FinalScoreService
7. ✅ `convex/tests/GameTest.helper.ts` - Added helper methods for test setup

---

## 🎉 IMPLEMENTATION COMPLETE - ALL PHASES DONE

### Final Test Summary
- **Total Tests**: 79 passing
- **Test Files**: 10
- **Coverage**:
  - ✅ Phase 0: EndGame.service.test.ts (15 tests)
  - ✅ Phase 1: Idle detection tests (4 tests in EndTurn.usecase.test.ts)
  - ✅ Phase 2: FinalScore.service.test.ts (5 tests) + Regular win tests (4 tests in EndTurn.usecase.test.ts)
  - ✅ Phase 3: Integration and edge cases verified (all requirements met)
  - ✅ Phase 4: Repository updates complete
  - ✅ Phase 5: Service registration complete

### Implementation Highlights
1. **Idle Win Logic**: Correctly identifies games with no PLAYER_TO_CELL moves for 2 full rounds, awards win to highest scorer with proper tie-breaking
2. **Regular Win Logic**: Detects when player empties hand with empty bag, applies final scoring (winner gains opponent tile values, opponents lose their tile values)
3. **Final Scoring Service**: Handles multiple players, negative scores, and integration with both win types
4. **Test Coverage**: Comprehensive unit, integration, and edge case tests covering 2-4 player scenarios
5. **No Regressions**: All existing tests continue to pass

### Game End Flow (Complete)
```
EndTurn Called
    ↓
Check if player won (no tiles + empty bag)?
    ↓ YES → Apply final scoring → End game with winner
    ↓ NO
Check if game is idle (no moves for 2 rounds)?
    ↓ YES → Find highest scorer → End game with winner (no scoring adjustments)
    ↓ NO
Continue game → Switch to next player → Refill hand
```
