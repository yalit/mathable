# Commit Guidelines

This document outlines the commit message format and best practices for this project.

## Commit Message Format

We follow the **Conventional Commits** specification for clear, structured commit messages.

### Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature for the user
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Formatting, missing semicolons, etc. (no code change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Build system or external dependencies (webpack, npm, etc.)
- `ci`: CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Scope (Optional)

The scope provides additional context about what part of the codebase is affected:

- `auth`: Authentication system
- `game`: Game logic
- `board`: Board-related features
- `player`: Player-related features
- `tile`: Tile-related features
- `ui`: User interface components
- `api`: API/Convex backend
- `repository`: Repository layer
- `usecase`: Use case layer

### Description

- Use imperative mood: "add" not "added" or "adds"
- Don't capitalize first letter (unless it's a proper noun)
- No period at the end
- Keep under 50 characters
- Be specific and descriptive

### Body (Optional)

- Wrap at 72 characters
- Explain **what** and **why**, not **how**
- Separate from description with a blank line
- Use bullet points for multiple items

### Footer (Optional)

- Reference issues: `Fixes #123`, `Closes #456`, `Resolves #789`
- Breaking changes: `BREAKING CHANGE: description`
- Co-authors: `Co-authored-by: Name <email@example.com>`

## Examples

### Simple Commits

```bash
feat(auth): add OAuth2 login flow
fix(board): prevent tiles from moving while placed
docs: update installation instructions
refactor(repository): extract game rules to service layer
test(game): add end turn validation tests
chore(deps): update convex to latest version
```

### Commit with Body

```bash
feat(game): implement undo functionality

Add ability to reset current turn by undoing all moves.
Players can now revert their tile placements before
ending their turn, unless a BAG_TO_PLAYER move occurred.

- Add resetTurn mutation
- Update move tracking to support undo
- Add UI button for reset action

Closes #42
```

### Breaking Change

```bash
refactor(api)!: migrate game state to use cases pattern

BREAKING CHANGE: Game mutations now use use case layer.
Direct repository access from mutations has been removed.
Update any custom integrations to use the new API structure.

See CLEAN_ARCHITECTURE_PROPOSAL.md for migration guide.
```

### Multiple Issues

```bash
fix(board): correct cell validation logic

Fix multiple issues with cell validation when placing tiles
on operator cells and calculating allowed values.

Fixes #123, #124
See also: #125
```

## Commit Size Guidelines

### The Golden Rule: One Logical Change Per Commit

Each commit should represent a single, complete unit of work that:
- Has a clear, specific purpose
- Can be understood independently
- Could be reverted without breaking unrelated features
- Passes all tests and builds successfully

### Ideal Commit Size

```
✅ Good commit size:
- 1-10 files changed (for related changes)
- <200 lines of code (excluding generated/test code)
- Can be reviewed in 5-10 minutes
- Has a single, clear purpose

❌ Too large:
- 20+ files changed
- 500+ lines of code
- Multiple unrelated changes
- Takes 30+ minutes to review
- Mixes feature + refactor + fixes
```

### Size by Change Type

| Change Type | Ideal Files | Max Recommended |
|------------|-------------|-----------------|
| Bug fix | 1-5 files | 10 files |
| Small feature | 3-10 files | 20 files |
| Refactor | 5-15 files | 30 files |
| Large feature | Split into multiple commits | N/A |
| Tests | 1-3 files per test suite | 10 files |
| Docs | 1-5 files | 10 files |

## When to Commit

### Commit When You:

✅ Complete a logical unit of work
✅ Finish a feature component or module
✅ Fix a bug completely
✅ Add or update tests
✅ Refactor a specific piece of code
✅ Make changes you might want to revert independently
✅ Reach a stable state (tests pass, code builds)
✅ Before switching tasks or taking a break

### Don't Commit When:

❌ Code doesn't compile
❌ Tests are failing (unless intentional WIP on feature branch)
❌ You have unrelated changes mixed together
❌ Changes are incomplete or half-done

## Commit Workflow

### 1. Make Changes

```bash
# Work on your feature
# Make small, focused changes
```

### 2. Review Your Changes

```bash
# See what changed
git status
git diff

# Review what you're about to commit
git diff --cached
```

### 3. Stage Changes

```bash
# Stage specific files
git add src/components/Game.tsx

# Stage parts of files (interactive)
git add -p

# Stage all changes (use carefully)
git add .
```

### 4. Commit with Message

```bash
# Simple commit
git commit -m "feat(game): add score calculation"

# Commit with body
git commit -m "feat(game): add score calculation

Implement score calculation for completed mathematical
expressions on the board. Scores are multiplied based
on cell multipliers (2x, 3x) when applicable.

- Add calculateScore function
- Add tests for score calculation
- Update game state after scoring

Closes #78"
```

### 5. Amend if Needed (Before Pushing)

```bash
# Fix the last commit message
git commit --amend -m "new message"

# Add forgotten files to last commit
git add forgotten-file.ts
git commit --amend --no-edit
```

## Feature Branch Pattern

### Recommended Workflow

```bash
# 1. Create feature branch from main
git checkout -b feat/user-authentication

# 2. Make small, atomic commits as you work
git commit -m "feat(auth): add user model"
git commit -m "feat(auth): add login endpoint"
git commit -m "feat(auth): add authentication middleware"
git commit -m "test(auth): add integration tests"

# 3. Keep branch updated with main
git fetch origin
git rebase origin/main

# 4. Optional: Clean up commit history before merging
git rebase -i main  # squash, reword, reorder commits

# 5. Push and create pull request
git push origin feat/user-authentication
```

## Bad vs Good Examples

### ❌ Bad: Large, Unfocused Commit

```bash
git commit -m "various updates"

# Changes:
# - Add login feature (10 files)
# - Fix typo in README
# - Refactor database layer
# - Update dependencies
# - Fix CSS bug in unrelated component
```

**Problems:**
- Multiple unrelated changes
- Vague commit message
- Impossible to revert one change independently
- Difficult to review
- Hard to track down bugs later

### ✅ Good: Small, Atomic Commits

```bash
# 1. Feature work
git commit -m "feat(auth): add login form component"

# 2. Related feature work
git commit -m "feat(auth): implement JWT authentication service"

# 3. Integration
git commit -m "feat(auth): connect login form to auth service"

# 4. Unrelated bug fix
git commit -m "fix(ui): correct button alignment in forms"

# 5. Documentation
git commit -m "docs: update README with authentication setup"
```

**Benefits:**
- Each commit has a clear purpose
- Easy to review each change
- Can revert individual changes safely
- Clear project history
- Easy to track down when bugs were introduced

## Anti-Patterns to Avoid

### 1. The "Everything" Commit

```bash
❌ git commit -m "updates"
❌ git commit -m "changes"
❌ git commit -m "stuff"
❌ git commit -m "wip"
```

### 2. The Novel

```bash
❌ git commit -m "Added login feature and also fixed the bug in the header where it wasn't displaying correctly on mobile devices and also updated the README to include the new authentication instructions and refactored the database queries to use the new repository pattern and updated dependencies"
```

### 3. The Mixer

```bash
❌ Mixing feature + bug fix + refactor in one commit
❌ Mixing multiple features in one commit
❌ Mixing source code + config + docs with different purposes
```

### 4. The Broken Build

```bash
❌ Committing code that doesn't compile
❌ Committing code with failing tests
❌ Committing code with linting errors
```

## Tools and Configuration

### Commitlint (Recommended)

Automatically enforce commit message format:

```bash
# Install
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# Configure (commitlint.config.js)
module.exports = {
  extends: ['@commitlint/config-conventional']
};

# Add to package.json
{
  "scripts": {
    "commitlint": "commitlint --edit"
  }
}
```

### Git Commit Template

Create a template for commit messages:

```bash
# Create template file
cat > ~/.gitmessage.txt << EOF
# <type>[optional scope]: <description>
# |<----  Using a Maximum Of 50 Characters  ---->|

# [optional body]
# |<----   Try To Limit Each Line to a Maximum Of 72 Characters   ---->|

# [optional footer(s)]

# --- COMMIT END ---
# Type can be:
#    feat     (new feature)
#    fix      (bug fix)
#    refactor (refactoring code)
#    style    (formatting, missing semicolons, etc.)
#    docs     (changes to documentation)
#    test     (adding or refactoring tests)
#    chore    (updating grunt tasks, etc.)
# --------------------
# Remember to:
#   - Use imperative mood in the description
#   - Don't capitalize first letter
#   - No period at the end
# --------------------
EOF

# Configure git to use template
git config --global commit.template ~/.gitmessage.txt
```

### Pre-commit Checks

Add to your workflow before committing:

```bash
# Run tests
pnpm test

# Run linter
pnpm lint

# Build to ensure no compilation errors
pnpm build

# Review staged changes
git diff --cached
```

## Summary: The Perfect Commit

A perfect commit:
- ✅ Has a clear, descriptive message following Conventional Commits
- ✅ Contains one logical change
- ✅ Is small enough to review in <10 minutes
- ✅ Builds successfully and passes all tests
- ✅ Can be reverted independently without breaking other features
- ✅ Tells a story when read in the commit history
- ✅ References related issues/PRs
- ✅ Explains the "why" in the body when needed

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
- [Git Best Practices](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project)
