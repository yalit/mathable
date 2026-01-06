import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectGame } from "@components/home/selectGame";
import * as useJoinGameModule from "@hooks/useJoinGame";
import * as useFetchOngoingGamesModule from "@hooks/convex/game/useFetchOngoingGamesForSession";

// Mock the hooks
vi.mock("@hooks/useJoinGame");
vi.mock("@hooks/convex/game/useFetchOngoingGamesForSession");

describe("SelectGame", () => {
  const mockJoinGame = vi.fn();

  const mockGames = [
    {
      id: "game1",
      token: "token1",
      status: "ongoing",
      currentTurn: 5,
      players: [
        { id: "p1", name: "Alice", score: 10, token: "playerToken1" },
        { id: "p2", name: "Bob", score: 8, token: "playerToken2" },
      ],
    },
    {
      id: "game2",
      token: "token2",
      status: "waiting",
      currentTurn: 0,
      players: [{ id: "p3", name: "Charlie", score: 0, token: "playerToken3" }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useJoinGameModule.useJoinGame).mockReturnValue({
      joinGame: mockJoinGame,
    } as any);
  });

  describe("When no ongoing games exist", () => {
    beforeEach(() => {
      vi.mocked(
        useFetchOngoingGamesModule.useFetchOngoingGamesForSession,
      ).mockReturnValue([]);
    });

    it("renders nothing", () => {
      const { container } = render(<SelectGame />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("When ongoing games exist", () => {
    beforeEach(() => {
      vi.mocked(
        useFetchOngoingGamesModule.useFetchOngoingGamesForSession,
      ).mockReturnValue(mockGames as any);
    });

    it("renders the header section", () => {
      render(<SelectGame />);

      expect(screen.getByText("Your Ongoing Games")).toBeInTheDocument();
      expect(
        screen.getByText("Continue where you left off!"),
      ).toBeInTheDocument();
    });

    it("displays gamepad icons in header", () => {
      const { container } = render(<SelectGame />);
      const gamepadIcons = container.querySelectorAll('[data-icon="gamepad"]');
      // Should have at least 2 in header + status badges
      expect(gamepadIcons.length).toBeGreaterThanOrEqual(2);
    });

    it("renders all games", () => {
      render(<SelectGame />);

      expect(screen.getByText("ongoing")).toBeInTheDocument();
      expect(screen.getByText("waiting")).toBeInTheDocument();
    });

    it("displays game status with correct styling", () => {
      render(<SelectGame />);

      const ongoingStatus = screen
        .getByText("ongoing")
        .closest("div")?.parentElement;
      const waitingStatus = screen
        .getByText("waiting")
        .closest("div")?.parentElement;

      expect(ongoingStatus).toHaveClass("bg-emerald-50", "border-emerald-400");
      expect(waitingStatus).toHaveClass("bg-amber-50", "border-amber-400");
    });

    it("displays turn counter for each game", () => {
      render(<SelectGame />);

      const turnLabels = screen.getAllByText("Turn:");
      expect(turnLabels).toHaveLength(2);
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("displays player count correctly", () => {
      render(<SelectGame />);

      expect(screen.getByText(/Players \(2\/4\):/)).toBeInTheDocument();
      expect(screen.getByText(/Players \(1\/4\):/)).toBeInTheDocument();
    });

    it("displays all players with their scores", () => {
      render(<SelectGame />);

      // Verify all player names and scores exist in the document
      const allText = document.body.textContent;
      expect(allText).toContain("Alice");
      expect(allText).toContain("Bob");
      expect(allText).toContain("Charlie");
      expect(allText).toContain("10");
      expect(allText).toContain("8");
    });

    it("displays users icon in players section", () => {
      const { container } = render(<SelectGame />);
      const usersIcons = container.querySelectorAll('[data-icon="users"]');
      expect(usersIcons.length).toBe(2); // One per game
    });

    it("renders player badges with correct styling", () => {
      const { container } = render(<SelectGame />);

      const aliceBadge = container.querySelector(
        ".px-2.py-1.bg-sky-50.border-sky-300",
      );
      expect(aliceBadge).toBeInTheDocument();
    });

    it("displays rejoin buttons for each player", () => {
      render(<SelectGame />);

      const aliceButton = screen.getByRole("button", { name: /Alice/i });
      const bobButton = screen.getByRole("button", { name: /Bob/i });
      const charlieButton = screen.getByRole("button", { name: /Charlie/i });

      expect(aliceButton).toBeInTheDocument();
      expect(bobButton).toBeInTheDocument();
      expect(charlieButton).toBeInTheDocument();
    });

    it("displays arrow icons in rejoin buttons", () => {
      const { container } = render(<SelectGame />);
      const arrowIcons = container.querySelectorAll(
        '[data-icon="arrow-right"]',
      );
      // Should have arrow icons in button label + inside each button
      expect(arrowIcons.length).toBeGreaterThanOrEqual(3);
    });

    it("calls joinGame with correct parameters when rejoin button is clicked", () => {
      render(<SelectGame />);

      const aliceButton = screen.getByRole("button", { name: /Alice/i });
      fireEvent.click(aliceButton);

      expect(mockJoinGame).toHaveBeenCalledWith("token1", "playerToken1");
    });

    it("calls joinGame for second player in same game", () => {
      render(<SelectGame />);

      const bobButton = screen.getByRole("button", { name: /Bob/i });
      fireEvent.click(bobButton);

      expect(mockJoinGame).toHaveBeenCalledWith("token1", "playerToken2");
    });

    it("calls joinGame for player in different game", () => {
      render(<SelectGame />);

      const charlieButton = screen.getByRole("button", { name: /Charlie/i });
      fireEvent.click(charlieButton);

      expect(mockJoinGame).toHaveBeenCalledWith("token2", "playerToken3");
    });

    it("applies hover effect to game cards", () => {
      render(<SelectGame />);

      const gameCards = screen.getAllByText(/Turn:/)[0].closest("div")
        ?.parentElement?.parentElement;
      expect(gameCards).toHaveClass("hover:shadow-xl", "transition-shadow");
    });

    it("applies hover effect to rejoin buttons", () => {
      render(<SelectGame />);

      const aliceButton = screen.getByRole("button", { name: /Alice/i });
      expect(aliceButton).toHaveClass(
        "hover:bg-purple-700",
        "transition-colors",
      );
    });
  });

  describe("With 3+ players", () => {
    beforeEach(() => {
      const gameWith4Players = [
        {
          id: "game3",
          token: "token3",
          status: "ongoing",
          currentTurn: 10,
          players: [
            { id: "p1", name: "Alice", score: 20, token: "token1" },
            { id: "p2", name: "Bob", score: 18, token: "token2" },
            { id: "p3", name: "Charlie", score: 15, token: "token3" },
            { id: "p4", name: "Dave", score: 12, token: "token4" },
          ],
        },
      ];
      vi.mocked(
        useFetchOngoingGamesModule.useFetchOngoingGamesForSession,
      ).mockReturnValue(gameWith4Players as any);
    });

    it("displays all 4 players", () => {
      render(<SelectGame />);

      const allText = document.body.textContent;
      expect(allText).toContain("Alice");
      expect(allText).toContain("Bob");
      expect(allText).toContain("Charlie");
      expect(allText).toContain("Dave");
    });

    it("shows correct player count for full game", () => {
      render(<SelectGame />);

      expect(screen.getByText(/Players \(4\/4\):/)).toBeInTheDocument();
    });

    it("renders rejoin button for each of the 4 players", () => {
      render(<SelectGame />);

      expect(
        screen.getByRole("button", { name: /Alice/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Bob/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Charlie/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Dave/i })).toBeInTheDocument();
    });

    it("displays all players with their scores in badges", () => {
      render(<SelectGame />);

      // Scores are displayed, verify they exist in the document
      const allText = document.body.textContent;
      expect(allText).toContain("20");
      expect(allText).toContain("18");
      expect(allText).toContain("15");
      expect(allText).toContain("12");
    });
  });

  describe("Status-based styling", () => {
    it("applies correct styling for finished status", () => {
      const finishedGame = [
        {
          id: "game4",
          token: "token4",
          status: "finished",
          currentTurn: 20,
          players: [{ id: "p1", name: "Winner", score: 50, token: "token1" }],
        },
      ];
      vi.mocked(
        useFetchOngoingGamesModule.useFetchOngoingGamesForSession,
      ).mockReturnValue(finishedGame as any);

      render(<SelectGame />);

      const finishedStatus = screen
        .getByText("finished")
        .closest("div")?.parentElement;
      expect(finishedStatus).toHaveClass("bg-gray-50", "border-gray-400");
    });

    it("capitalizes status text", () => {
      const { container } = render(<SelectGame />);

      const capitalizedElements = container.querySelectorAll(".capitalize");
      expect(capitalizedElements.length).toBeGreaterThan(0);
    });
  });

  describe("Grid layout", () => {
    it("applies responsive grid classes", () => {
      vi.mocked(
        useFetchOngoingGamesModule.useFetchOngoingGamesForSession,
      ).mockReturnValue(mockGames as any);

      const { container } = render(<SelectGame />);
      const grid = container.querySelector(".grid");

      expect(grid).toHaveClass(
        "grid-cols-1",
        "md:grid-cols-2",
        "lg:grid-cols-3",
      );
    });
  });
});
