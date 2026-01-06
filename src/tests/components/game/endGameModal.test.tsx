import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EndGameModal } from "@components/game/endGameModal";
import type { Game } from "@context/model/game";

// Mock the hooks
vi.mock("@context/hooks", () => ({
  useGame: vi.fn(),
}));

vi.mock("@hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Return the key as-is for testing
  }),
}));

// Mock FontAwesome components
vi.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({ icon }: { icon: unknown }) => (
    <span data-testid="icon">{String(icon)}</span>
  ),
}));

import { useGame } from "@context/hooks";

const mockUseGame = useGame as ReturnType<typeof vi.fn>;

describe("EndGameModal", () => {
  const createMockGame = (overrides?: Partial<Game>): Game => ({
    id: "game1",
    token: "token1",
    status: "ended",
    currentTurn: 10,
    cells: [],
    tiles: [],
    players: [
      {
        id: "player1",
        name: "Alice",
        token: "token1",
        current: false,
        tiles: [],
        score: 100,
        owner: true,
        order: 1,
        userId: "user1",
      },
      {
        id: "player2",
        name: "Bob",
        token: "token2",
        current: false,
        tiles: [],
        score: 75,
        owner: false,
        order: 2,
        userId: "user2",
      },
    ],
    winner: "player1",
    ...overrides,
  });

  test("should render Game Over title", () => {
    const mockGame = createMockGame();
    mockUseGame.mockReturnValue(mockGame);

    render(<EndGameModal />);

    expect(screen.getByText(/Game Over/i)).toBeInTheDocument();
  });

  test("should display winner name and score", () => {
    const mockGame = createMockGame();
    mockUseGame.mockReturnValue(mockGame);

    render(<EndGameModal />);

    expect(screen.getByText(/Winner/i)).toBeInTheDocument();
    // Alice appears twice (in winner box and leaderboard), use getAllByText
    const aliceElements = screen.getAllByText(/Alice/i);
    expect(aliceElements.length).toBeGreaterThan(0);
    // Score of 100 also appears twice, use getAllByText
    const scoreElements = screen.getAllByText("100");
    expect(scoreElements.length).toBeGreaterThan(0);
  });

  test("should display all players in leaderboard", () => {
    const mockGame = createMockGame();
    mockUseGame.mockReturnValue(mockGame);

    render(<EndGameModal />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("should sort players by score descending", () => {
    const mockGame = createMockGame({
      players: [
        {
          id: "player1",
          name: "Alice",
          token: "token1",
          current: false,
          tiles: [],
          score: 50,
          owner: true,
          order: 1,
          userId: "user1",
        },
        {
          id: "player2",
          name: "Bob",
          token: "token2",
          current: false,
          tiles: [],
          score: 100,
          owner: false,
          order: 2,
          userId: "user2",
        },
      ],
      winner: "player2",
    });
    mockUseGame.mockReturnValue(mockGame);

    const { container } = render(<EndGameModal />);

    // Find all player rows in the leaderboard (exclude winner announcement)
    const leaderboardRows = container.querySelectorAll(".space-y-2 > div");

    // Bob (100 points) should be first, Alice (50 points) should be second
    expect(leaderboardRows[0]).toHaveTextContent("Bob");
    expect(leaderboardRows[0]).toHaveTextContent("100");
    expect(leaderboardRows[1]).toHaveTextContent("Alice");
    expect(leaderboardRows[1]).toHaveTextContent("50");
  });

  test("should handle tie-breaking by player order", () => {
    const mockGame = createMockGame({
      players: [
        {
          id: "player1",
          name: "Alice",
          token: "token1",
          current: false,
          tiles: [],
          score: 100,
          owner: true,
          order: 2,
          userId: "user1",
        },
        {
          id: "player2",
          name: "Bob",
          token: "token2",
          current: false,
          tiles: [],
          score: 100,
          owner: false,
          order: 1,
          userId: "user2",
        },
      ],
      winner: "player2",
    });
    mockUseGame.mockReturnValue(mockGame);

    const { container } = render(<EndGameModal />);

    // Find all player rows in the leaderboard
    const leaderboardRows = container.querySelectorAll(".space-y-2 > div");

    // Both have 100 points, but Bob has lower order (1 vs 2), so Bob wins
    expect(leaderboardRows[0]).toHaveTextContent("Bob");
    expect(leaderboardRows[0]).toHaveTextContent("100");
    expect(leaderboardRows[1]).toHaveTextContent("Alice");
    expect(leaderboardRows[1]).toHaveTextContent("100");
  });

  test("should highlight winner row with emerald styling", () => {
    const mockGame = createMockGame();
    mockUseGame.mockReturnValue(mockGame);

    const { container } = render(<EndGameModal />);

    // Check for emerald classes (green theme)
    const winnerRow = container.querySelector(".bg-emerald-50");
    expect(winnerRow).toBeInTheDocument();
    expect(winnerRow).toHaveClass("border-emerald-400");
  });

  test("should work with 3 players", () => {
    const mockGame = createMockGame({
      players: [
        {
          id: "player1",
          name: "Alice",
          token: "token1",
          current: false,
          tiles: [],
          score: 150,
          owner: true,
          order: 1,
          userId: "user1",
        },
        {
          id: "player2",
          name: "Bob",
          token: "token2",
          current: false,
          tiles: [],
          score: 100,
          owner: false,
          order: 2,
          userId: "user2",
        },
        {
          id: "player3",
          name: "Charlie",
          token: "token3",
          current: false,
          tiles: [],
          score: 75,
          owner: false,
          order: 3,
          userId: "user3",
        },
      ],
      winner: "player1",
    });
    mockUseGame.mockReturnValue(mockGame);

    render(<EndGameModal />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  test("should work with 4 players", () => {
    const mockGame = createMockGame({
      players: [
        {
          id: "player1",
          name: "Alice",
          token: "token1",
          current: false,
          tiles: [],
          score: 150,
          owner: true,
          order: 1,
          userId: "user1",
        },
        {
          id: "player2",
          name: "Bob",
          token: "token2",
          current: false,
          tiles: [],
          score: 100,
          owner: false,
          order: 2,
          userId: "user2",
        },
        {
          id: "player3",
          name: "Charlie",
          token: "token3",
          current: false,
          tiles: [],
          score: 75,
          owner: false,
          order: 3,
          userId: "user3",
        },
        {
          id: "player4",
          name: "Diana",
          token: "token4",
          current: false,
          tiles: [],
          score: 50,
          owner: false,
          order: 4,
          userId: "user4",
        },
      ],
      winner: "player1",
    });
    mockUseGame.mockReturnValue(mockGame);

    render(<EndGameModal />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("Diana")).toBeInTheDocument();
  });

  test("should handle negative scores", () => {
    const mockGame = createMockGame({
      players: [
        {
          id: "player1",
          name: "Alice",
          token: "token1",
          current: false,
          tiles: [],
          score: 50,
          owner: true,
          order: 1,
          userId: "user1",
        },
        {
          id: "player2",
          name: "Bob",
          token: "token2",
          current: false,
          tiles: [],
          score: -10,
          owner: false,
          order: 2,
          userId: "user2",
        },
      ],
      winner: "player1",
    });
    mockUseGame.mockReturnValue(mockGame);

    render(<EndGameModal />);

    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("-10")).toBeInTheDocument();
  });

  test("should handle missing winner gracefully", () => {
    const mockGame = createMockGame({
      winner: undefined,
    });
    mockUseGame.mockReturnValue(mockGame);

    render(<EndGameModal />);

    // Should still render Game Over and leaderboard
    expect(screen.getByText(/Game Over/i)).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("should display Final Scores heading", () => {
    const mockGame = createMockGame();
    mockUseGame.mockReturnValue(mockGame);

    render(<EndGameModal />);

    expect(screen.getByText(/Final Scores/i)).toBeInTheDocument();
  });

  test("should render trophy icons for winner", () => {
    const mockGame = createMockGame();
    mockUseGame.mockReturnValue(mockGame);

    render(<EndGameModal />);

    const icons = screen.getAllByTestId("icon");
    expect(icons.length).toBeGreaterThan(0);
  });
});
