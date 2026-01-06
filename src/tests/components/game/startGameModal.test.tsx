import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StartGameModal } from "@components/game/startGameModal";
import * as hooksModule from "@context/hooks";
import * as translationModule from "@hooks/useTranslation";
import { useSessionMutation } from "convex-helpers/react/sessions";

// Mock the hooks
vi.mock("@context/hooks");
vi.mock("@hooks/useTranslation");
vi.mock("convex-helpers/react/sessions");

describe("StartGameModal", () => {
  const mockStartGame = vi.fn();
  const mockT = (key: string) => key;
  const mockUseSessionMutation = vi.mocked(useSessionMutation);

  const mockPlayer = {
    id: "p1",
    name: "Alice",
    owner: true,
    current: false,
    score: 0,
    order: 1,
    tiles: [],
  };

  const mockGame = {
    id: "game123",
    token: "token123",
    players: [
      mockPlayer,
      {
        id: "p2",
        name: "Bob",
        owner: false,
        current: false,
        score: 0,
        order: 2,
        tiles: [],
      },
    ],
    status: "waiting",
    currentTurn: 0,
    winner: null,
    cells: [],
    tiles: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooksModule.useGame).mockReturnValue(mockGame as any);
    vi.mocked(hooksModule.usePlayer).mockReturnValue(mockPlayer as any);
    vi.mocked(translationModule.useTranslation).mockReturnValue({
      t: mockT,
    } as any);
    mockUseSessionMutation.mockReturnValue(mockStartGame);

    // Mock window.location.origin
    delete (window as any).location;
    window.location = { origin: "http://localhost:3000" } as any;

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders the modal with title", () => {
      render(<StartGameModal />);

      expect(screen.getByText("Game start procedure")).toBeInTheDocument();
    });

    it("displays users icons in title", () => {
      const { container } = render(<StartGameModal />);
      const usersIcons = container.querySelectorAll('[data-icon="users"]');
      expect(usersIcons.length).toBeGreaterThanOrEqual(2); // At least 2 in title
    });

    it("displays players list with count", () => {
      render(<StartGameModal />);

      expect(screen.getByText(/Players \(2\/4\):/)).toBeInTheDocument();
      expect(screen.getByText("Alice (You)")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("highlights current player", () => {
      render(<StartGameModal />);

      const aliceCard = screen.getByText(/Alice/).closest("div");
      const bobCard = screen.getByText("Bob").closest("div");

      expect(aliceCard).toHaveClass("bg-teal-50", "border-teal-400");
      expect(bobCard).toHaveClass("bg-gray-50", "border-gray-300");
    });
  });

  describe("When game can start (2+ players)", () => {
    it("displays success status message", () => {
      render(<StartGameModal />);

      expect(screen.getByText("The game can be started")).toBeInTheDocument();
    });

    it("displays check icon for ready state", () => {
      const { container } = render(<StartGameModal />);
      const checkIcon = container.querySelector('[data-icon="check"]');
      expect(checkIcon).toBeInTheDocument();
      expect(checkIcon).toHaveClass("text-emerald-600");
    });

    it("applies emerald styling to status message", () => {
      const { container } = render(<StartGameModal />);
      const statusMessage = container.querySelector(
        ".bg-emerald-50.border-emerald-400",
      );
      expect(statusMessage).toBeInTheDocument();
    });

    it("shows enabled start button for owner", () => {
      render(<StartGameModal />);

      const button = screen.getByRole("button", { name: /Start Game/i });
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass("bg-teal-600");
    });

    it("calls startGame when button is clicked", async () => {
      mockStartGame.mockResolvedValue(undefined);

      render(<StartGameModal />);
      const button = screen.getByRole("button", { name: /Start Game/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalledWith({ gameId: "game123" });
      });
    });

    it("displays play icon in start button", () => {
      const { container } = render(<StartGameModal />);
      const playIcon = container.querySelector('[data-icon="play"]');
      expect(playIcon).toBeInTheDocument();
    });
  });

  describe("When game cannot start (< 2 players)", () => {
    beforeEach(() => {
      const gameWithOnePlayer = {
        ...mockGame,
        players: [mockPlayer],
      };
      vi.mocked(hooksModule.useGame).mockReturnValue(gameWithOnePlayer as any);
    });

    it("displays warning status message", () => {
      render(<StartGameModal />);

      expect(
        screen.getByText("There is not enough players to start the game"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Minimum 2 players required"),
      ).toBeInTheDocument();
    });

    it("displays warning icon", () => {
      const { container } = render(<StartGameModal />);
      const warningIcon = container.querySelector(
        '[data-icon="triangle-exclamation"]',
      );
      expect(warningIcon).toBeInTheDocument();
      expect(warningIcon).toHaveClass("text-amber-600");
    });

    it("applies amber styling to status message", () => {
      const { container } = render(<StartGameModal />);
      const statusMessage = container.querySelector(
        ".bg-amber-50.border-amber-400",
      );
      expect(statusMessage).toBeInTheDocument();
    });

    it("shows disabled start button for owner", () => {
      render(<StartGameModal />);

      const button = screen.getByRole("button", { name: /Start Game/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass("bg-gray-300", "cursor-not-allowed");
    });

    it("does not call startGame when disabled button is clicked", async () => {
      render(<StartGameModal />);
      const button = screen.getByRole("button", { name: /Start Game/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockStartGame).not.toHaveBeenCalled();
      });
    });

    it("updates player count display", () => {
      render(<StartGameModal />);

      expect(screen.getByText(/Players \(1\/4\):/)).toBeInTheDocument();
    });
  });

  describe("Share link feature (Owner only)", () => {
    it("displays share link section for owner", () => {
      render(<StartGameModal />);

      expect(screen.getByText("Invite Friends")).toBeInTheDocument();
      expect(
        screen.getByText(
          /Share this link with your friends so they can join the game/i,
        ),
      ).toBeInTheDocument();
    });

    it("shows correct join link", () => {
      render(<StartGameModal />);

      const input = screen.getByDisplayValue(
        "http://localhost:3000/game/token123",
      ) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("readonly");
    });

    it("displays share icon", () => {
      const { container } = render(<StartGameModal />);
      const shareIcons = container.querySelectorAll('[data-icon="share"]');
      expect(shareIcons.length).toBeGreaterThanOrEqual(1);
    });

    it("copies link to clipboard when copy button is clicked", async () => {
      render(<StartGameModal />);
      const copyButton = screen.getByRole("button", { name: /Copy/i });

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          "http://localhost:3000/game/token123",
        );
      });
    });

    it("shows 'Copied!' message after successful copy", async () => {
      render(<StartGameModal />);
      const copyButton = screen.getByRole("button", { name: /Copy/i });

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText("Copied!")).toBeInTheDocument();
      });
    });

    it.skip("reverts to 'Copy' after 2 seconds", async () => {
      vi.useFakeTimers();

      render(<StartGameModal />);
      const copyButton = screen.getByRole("button", { name: /Copy/i });

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText("Copied!")).toBeInTheDocument();
      });

      await vi.advanceTimersByTimeAsync(2000);

      expect(screen.getByText("Copy")).toBeInTheDocument();
      expect(screen.queryByText("Copied!")).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it.skip("handles clipboard error gracefully", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
        new Error("Clipboard error"),
      );

      render(<StartGameModal />);
      const copyButton = screen.getByRole("button", { name: /Copy/i });

      fireEvent.click(copyButton);

      await waitFor(
        () => {
          expect(consoleError).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      consoleError.mockRestore();
    });

    it("does not display share link section for non-owner", () => {
      const nonOwnerPlayer = { ...mockPlayer, owner: false };
      vi.mocked(hooksModule.usePlayer).mockReturnValue(nonOwnerPlayer as any);

      render(<StartGameModal />);

      expect(screen.queryByText("Invite Friends")).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue(/http/)).not.toBeInTheDocument();
    });
  });

  describe("Non-owner view", () => {
    beforeEach(() => {
      const nonOwnerPlayer = {
        ...mockPlayer,
        id: "p2",
        name: "Bob",
        owner: false,
      };
      vi.mocked(hooksModule.usePlayer).mockReturnValue(nonOwnerPlayer as any);
    });

    it("displays waiting message instead of button", () => {
      render(<StartGameModal />);

      expect(
        screen.getByText("Waiting for the owner of the game to start"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Start Game/i }),
      ).not.toBeInTheDocument();
    });

    it("displays clock icon in waiting message", () => {
      const { container } = render(<StartGameModal />);
      const clockIcon = container.querySelector('[data-icon="clock"]');
      expect(clockIcon).toBeInTheDocument();
      expect(clockIcon).toHaveClass("text-gray-400");
    });

    it("does not show share link section", () => {
      render(<StartGameModal />);

      expect(screen.queryByText("Invite Friends")).not.toBeInTheDocument();
    });
  });

  describe("Multiple players display", () => {
    it("displays all players correctly with 3 players", () => {
      const gameWithThreePlayers = {
        ...mockGame,
        players: [
          mockPlayer,
          {
            id: "p2",
            name: "Bob",
            owner: false,
            score: 0,
            order: 2,
            tiles: [],
          },
          {
            id: "p3",
            name: "Charlie",
            owner: false,
            score: 0,
            order: 3,
            tiles: [],
          },
        ],
      };
      vi.mocked(hooksModule.useGame).mockReturnValue(
        gameWithThreePlayers as any,
      );

      render(<StartGameModal />);

      expect(screen.getByText(/Players \(3\/4\):/)).toBeInTheDocument();
      expect(screen.getByText("Alice (You)")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    it("displays all players correctly with 4 players (full game)", () => {
      const fullGame = {
        ...mockGame,
        players: [
          mockPlayer,
          {
            id: "p2",
            name: "Bob",
            owner: false,
            score: 0,
            order: 2,
            tiles: [],
          },
          {
            id: "p3",
            name: "Charlie",
            owner: false,
            score: 0,
            order: 3,
            tiles: [],
          },
          {
            id: "p4",
            name: "Dave",
            owner: false,
            score: 0,
            order: 4,
            tiles: [],
          },
        ],
      };
      vi.mocked(hooksModule.useGame).mockReturnValue(fullGame as any);

      render(<StartGameModal />);

      expect(screen.getByText(/Players \(4\/4\):/)).toBeInTheDocument();
      expect(screen.getByText("Alice (You)")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
      expect(screen.getByText("Dave")).toBeInTheDocument();
    });
  });

  describe("Modal properties", () => {
    it("renders as non-closable modal", () => {
      const { container } = render(<StartGameModal />);

      // Modal should not have a close button
      const closeButtons = container.querySelectorAll(
        'button[aria-label="close"]',
      );
      expect(closeButtons.length).toBe(0);
    });
  });
});
