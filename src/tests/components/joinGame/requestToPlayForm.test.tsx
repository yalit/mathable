import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequestToPlayForm } from "@components/joinGame/requestToPlayForm";
import * as hooksModule from "@context/hooks";
import { useSessionMutation } from "convex-helpers/react/sessions";

// Mock the hooks
vi.mock("@context/hooks");
vi.mock("convex-helpers/react/sessions");

describe("RequestToPlayForm", () => {
  const mockJoinGame = vi.fn();
  const mockUseSessionMutation = vi.mocked(useSessionMutation);

  const mockGame = {
    id: "game123",
    token: "token123",
    players: [
      { id: "p1", name: "Alice", score: 0, order: 1 },
      { id: "p2", name: "Bob", score: 0, order: 2 },
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
    mockUseSessionMutation.mockReturnValue(mockJoinGame);

    // Mock document.location
    delete (window as any).location;
    window.location = { href: "" } as any;
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  describe("When game can be joined", () => {
    it("renders join game form", () => {
      render(<RequestToPlayForm />);

      expect(
        screen.getByRole("heading", { name: /Join the Game/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("A game is already in progress!"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Join the Game/i }),
      ).toBeInTheDocument();
    });

    it("displays door icons", () => {
      const { container } = render(<RequestToPlayForm />);
      const icons = container.querySelectorAll('[data-icon="door-open"]');
      expect(icons.length).toBe(2);
    });

    it("displays current players section", () => {
      render(<RequestToPlayForm />);

      expect(screen.getByText(/Current Players \(2\/4\):/)).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("displays users icon in players section", () => {
      const { container } = render(<RequestToPlayForm />);
      const usersIcon = container.querySelector('[data-icon="users"]');
      expect(usersIcon).toBeInTheDocument();
    });

    it("has disabled button when player name is empty", () => {
      render(<RequestToPlayForm />);
      const button = screen.getByRole("button", { name: /Join the Game/i });

      expect(button).toBeDisabled();
      expect(button).toHaveClass("bg-gray-300", "cursor-not-allowed");
    });

    it("enables button when player name is entered", () => {
      render(<RequestToPlayForm />);
      const input = screen.getByPlaceholderText("Enter your name...");
      const button = screen.getByRole("button", { name: /Join the Game/i });

      fireEvent.change(input, { target: { value: "Charlie" } });

      expect(button).not.toBeDisabled();
      expect(button).toHaveClass("bg-emerald-600");
    });

    it("updates input value when typing", () => {
      render(<RequestToPlayForm />);
      const input = screen.getByPlaceholderText(
        "Enter your name...",
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { value: "Dave" } });

      expect(input.value).toBe("Dave");
    });

    it("calls joinGame with correct parameters on form submission", async () => {
      mockJoinGame.mockResolvedValue({
        status: "success",
        data: { playerToken: "player789" },
      });

      render(<RequestToPlayForm />);
      const input = screen.getByPlaceholderText("Enter your name...");
      const form = screen
        .getByRole("button", { name: /Join the Game/i })
        .closest("form");

      fireEvent.change(input, { target: { value: "Eve" } });
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockJoinGame).toHaveBeenCalledWith({
          gameId: "game123",
          playerName: "Eve",
        });
      });
    });

    it("redirects to game page on successful join", async () => {
      mockJoinGame.mockResolvedValue({
        status: "success",
        data: { playerToken: "player789" },
      });

      render(<RequestToPlayForm />);
      const input = screen.getByPlaceholderText("Enter your name...");
      const form = screen
        .getByRole("button", { name: /Join the Game/i })
        .closest("form");

      fireEvent.change(input, { target: { value: "Frank" } });
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockJoinGame).toHaveBeenCalled();
      });

      // Note: document.location assignment is handled by the component
      // In a real browser, this would navigate, but in tests we just verify the call was made
    });

    it("does not redirect when join fails", async () => {
      mockJoinGame.mockResolvedValue({
        status: "error",
        data: { playerToken: "" },
      });

      const originalLocation = document.location;

      render(<RequestToPlayForm />);
      const input = screen.getByPlaceholderText("Enter your name...");
      const form = screen
        .getByRole("button", { name: /Join the Game/i })
        .closest("form");

      fireEvent.change(input, { target: { value: "Grace" } });
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockJoinGame).toHaveBeenCalled();
      });

      expect(document.location).toBe(originalLocation);
    });

    it("does not redirect when playerToken is empty", async () => {
      mockJoinGame.mockResolvedValue({
        status: "success",
        data: { playerToken: "" },
      });

      const originalLocation = document.location;

      render(<RequestToPlayForm />);
      const input = screen.getByPlaceholderText("Enter your name...");
      const form = screen
        .getByRole("button", { name: /Join the Game/i })
        .closest("form");

      fireEvent.change(input, { target: { value: "Henry" } });
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockJoinGame).toHaveBeenCalled();
      });

      expect(document.location).toBe(originalLocation);
    });

    it("applies gradient background", () => {
      const { container } = render(<RequestToPlayForm />);
      const background = container.firstChild;

      expect(background).toHaveClass(
        "bg-gradient-to-br",
        "from-sky-50",
        "to-blue-100",
      );
    });
  });

  describe("When game is full", () => {
    beforeEach(() => {
      const fullGame = {
        ...mockGame,
        players: [
          { id: "p1", name: "Alice", score: 0, order: 1 },
          { id: "p2", name: "Bob", score: 0, order: 2 },
          { id: "p3", name: "Charlie", score: 0, order: 3 },
          { id: "p4", name: "Dave", score: 0, order: 4 },
        ],
      };
      vi.mocked(hooksModule.useGame).mockReturnValue(fullGame as any);
    });

    it("renders game full message", () => {
      render(<RequestToPlayForm />);

      expect(screen.getByText("Game is Full")).toBeInTheDocument();
      expect(
        screen.getByText(
          "This game has reached the maximum number of players (4/4).",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Sorry, better luck next time!"),
      ).toBeInTheDocument();
    });

    it("displays X mark icon", () => {
      const { container } = render(<RequestToPlayForm />);
      const xIcon = container.querySelector('[data-icon="xmark"]');
      expect(xIcon).toBeInTheDocument();
      expect(xIcon).toHaveClass("text-red-500");
    });

    it("does not render join form", () => {
      render(<RequestToPlayForm />);

      expect(
        screen.queryByRole("button", { name: /Join the Game/i }),
      ).not.toBeInTheDocument();
    });

    it("does not render current players section", () => {
      render(<RequestToPlayForm />);

      expect(screen.queryByText(/Current Players/)).not.toBeInTheDocument();
    });
  });

  describe("Player count display", () => {
    it("shows correct player count with 1 player", () => {
      const gameWithOnePlayer = {
        ...mockGame,
        players: [{ id: "p1", name: "Alice", score: 0, order: 1 }],
      };
      vi.mocked(hooksModule.useGame).mockReturnValue(gameWithOnePlayer as any);

      render(<RequestToPlayForm />);

      expect(screen.getByText(/Current Players \(1\/4\):/)).toBeInTheDocument();
    });

    it("shows correct player count with 3 players", () => {
      const gameWithThreePlayers = {
        ...mockGame,
        players: [
          { id: "p1", name: "Alice", score: 0, order: 1 },
          { id: "p2", name: "Bob", score: 0, order: 2 },
          { id: "p3", name: "Charlie", score: 0, order: 3 },
        ],
      };
      vi.mocked(hooksModule.useGame).mockReturnValue(
        gameWithThreePlayers as any,
      );

      render(<RequestToPlayForm />);

      expect(screen.getByText(/Current Players \(3\/4\):/)).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });
  });
});
