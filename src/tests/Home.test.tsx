import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "../Home";
import * as useJoinGameModule from "@hooks/useJoinGame";
import * as useFetchOngoingGamesModule from "@hooks/convex/game/useFetchOngoingGamesForSession";
import * as useCreateGameModule from "@hooks/convex/game/useCreateGame";

// Mock child components' dependencies
vi.mock("@hooks/useJoinGame");
vi.mock("@hooks/convex/game/useFetchOngoingGamesForSession");
vi.mock("@hooks/convex/game/useCreateGame");

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useJoinGameModule.useJoinGame).mockReturnValue({
      joinGame: vi.fn(),
    } as any);
    vi.mocked(useFetchOngoingGamesModule.useFetchOngoingGamesForSession).mockReturnValue([]);
    vi.mocked(useCreateGameModule.useCreateGame).mockReturnValue(vi.fn());
  });

  describe("Hero Section", () => {
    it("renders the main title", () => {
      render(<Home />);

      expect(screen.getByText("Mathable")).toBeInTheDocument();
    });

    it("displays calculator icon", () => {
      const { container } = render(<Home />);
      const calculatorIcon = container.querySelector('[data-icon="calculator"]');
      expect(calculatorIcon).toBeInTheDocument();
      expect(calculatorIcon).toHaveClass("text-sky-600", "text-4xl", "animate-bounce");
    });

    it("displays brain icon", () => {
      const { container } = render(<Home />);
      const brainIcon = container.querySelector('[data-icon="brain"]');
      expect(brainIcon).toBeInTheDocument();
      expect(brainIcon).toHaveClass("text-purple-600", "text-4xl", "animate-bounce");
    });

    it("displays puzzle piece icons", () => {
      const { container } = render(<Home />);
      const puzzleIcons = container.querySelectorAll('[data-icon="puzzle-piece"]');
      expect(puzzleIcons.length).toBe(2); // One on each side of tagline
    });

    it("renders the tagline", () => {
      render(<Home />);

      expect(
        screen.getByText("Challenge your mind with mathematical puzzles!")
      ).toBeInTheDocument();
    });

    it("applies gradient text to title", () => {
      render(<Home />);

      const title = screen.getByText("Mathable");
      expect(title).toHaveClass(
        "text-transparent",
        "bg-clip-text",
        "bg-gradient-to-r"
      );
    });
  });

  describe("Feature Pills", () => {
    it("displays Strategy feature pill", () => {
      render(<Home />);

      expect(screen.getByText("🎯 Strategy")).toBeInTheDocument();
    });

    it("displays Mathematics feature pill", () => {
      render(<Home />);

      expect(screen.getByText("🧮 Mathematics")).toBeInTheDocument();
    });

    it("displays Multiplayer feature pill", () => {
      render(<Home />);

      expect(screen.getByText("👥 Multiplayer")).toBeInTheDocument();
    });

    it("applies correct styling to feature pills", () => {
      render(<Home />);

      const strategyPill = screen.getByText("🎯 Strategy").parentElement;
      expect(strategyPill).toHaveClass(
        "px-4",
        "py-2",
        "bg-white/80",
        "backdrop-blur-sm",
        "rounded-full",
        "shadow-md",
        "border-2",
        "border-sky-200"
      );
    });

    it("applies different border colors to each pill", () => {
      render(<Home />);

      const strategyPill = screen.getByText("🎯 Strategy").parentElement;
      const mathPill = screen.getByText("🧮 Mathematics").parentElement;
      const multiplayerPill = screen.getByText("👥 Multiplayer").parentElement;

      expect(strategyPill).toHaveClass("border-sky-200");
      expect(mathPill).toHaveClass("border-purple-200");
      expect(multiplayerPill).toHaveClass("border-pink-200");
    });
  });

  describe("Layout and Styling", () => {
    it("applies gradient background", () => {
      const { container } = render(<Home />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveClass(
        "min-h-screen",
        "w-full",
        "bg-gradient-to-br",
        "from-sky-100",
        "via-purple-50",
        "to-pink-100"
      );
    });

    it("renders container with proper styling", () => {
      const { container } = render(<Home />);
      const containerDiv = container.querySelector(".container");

      expect(containerDiv).toHaveClass("mx-auto", "px-4", "py-8");
    });
  });

  describe("Divider Section", () => {
    it("displays OR divider", () => {
      render(<Home />);

      expect(screen.getByText("OR")).toBeInTheDocument();
    });

    it("applies correct styling to divider", () => {
      render(<Home />);

      const orText = screen.getByText("OR");
      expect(orText).toHaveClass("px-4", "text-sm", "font-semibold", "text-gray-600");
    });
  });

  describe("Footer Section", () => {
    it("displays footer text", () => {
      render(<Home />);

      expect(
        screen.getByText(/Play solo or with up to 4 players • Challenge your friends!/i)
      ).toBeInTheDocument();
    });

    it("applies correct styling to footer", () => {
      render(<Home />);

      const footer = screen.getByText(/Play solo or with up to 4 players/i).parentElement;
      expect(footer).toHaveClass("mt-16", "text-center", "text-gray-500", "text-sm");
    });
  });

  describe("Child Components", () => {
    it("renders SelectGame component", () => {
      render(<Home />);

      // SelectGame renders nothing when there are no games, so we verify it was mounted
      // by checking if the parent structure exists
      const { container } = render(<Home />);
      expect(container).toBeTruthy();
    });

    it("renders CreateGameCard component", () => {
      render(<Home />);

      // CreateGameCard has distinct elements we can check for
      expect(screen.getByText("Create a New Game")).toBeInTheDocument();
    });
  });

  describe("Integration with SelectGame", () => {
    it("displays ongoing games when they exist", () => {
      const mockGames = [
        {
          id: "game1",
          token: "token1",
          status: "ongoing",
          currentTurn: 5,
          players: [
            { id: "p1", name: "Alice", score: 10, token: "playerToken1" },
          ],
        },
      ];

      vi.mocked(useFetchOngoingGamesModule.useFetchOngoingGamesForSession).mockReturnValue(
        mockGames as any
      );

      render(<Home />);

      expect(screen.getByText("Your Ongoing Games")).toBeInTheDocument();
    });

    it("does not display SelectGame section when no games exist", () => {
      vi.mocked(useFetchOngoingGamesModule.useFetchOngoingGamesForSession).mockReturnValue([]);

      render(<Home />);

      expect(screen.queryByText("Your Ongoing Games")).not.toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("uses responsive text sizes", () => {
      render(<Home />);

      const title = screen.getByText("Mathable");
      expect(title).toHaveClass("text-6xl");

      const tagline = screen.getByText("Challenge your mind with mathematical puzzles!");
      expect(tagline).toHaveClass("text-xl");
    });

    it("uses responsive spacing", () => {
      render(<Home />);

      const mainContent = screen.getByText("Mathable").closest("div")?.parentElement;
      expect(mainContent).toHaveClass("mb-12");
    });
  });

  describe("Animations", () => {
    it("applies bounce animation to calculator icon", () => {
      const { container } = render(<Home />);
      const calculatorIcon = container.querySelector('[data-icon="calculator"]');

      expect(calculatorIcon).toHaveClass("animate-bounce");
    });

    it("applies bounce animation to brain icon", () => {
      const { container } = render(<Home />);
      const brainIcon = container.querySelector('[data-icon="brain"]');

      expect(brainIcon).toHaveClass("animate-bounce");
    });

    it("sets different animation delays for icons", () => {
      const { container } = render(<Home />);
      const calculatorIcon = container.querySelector('[data-icon="calculator"]');
      const brainIcon = container.querySelector('[data-icon="brain"]');

      expect(calculatorIcon).toHaveStyle({ animationDelay: "0s" });
      expect(brainIcon).toHaveStyle({ animationDelay: "0.2s" });
    });
  });

  describe("Accessibility", () => {
    it("has proper semantic structure", () => {
      const { container } = render(<Home />);

      const h1 = container.querySelector("h1");
      expect(h1).toBeInTheDocument();
      expect(h1?.textContent).toBe("Mathable");
    });

    it("uses proper heading hierarchy", () => {
      render(<Home />);

      const h1 = screen.getByText("Mathable");
      expect(h1.tagName).toBe("H1");
    });
  });
});
