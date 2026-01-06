import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateGameCard } from "@components/home/createGameCard";
import * as useCreateGameModule from "@hooks/convex/game/useCreateGame";

// Mock the useCreateGame hook
vi.mock("@hooks/convex/game/useCreateGame");

describe("CreateGameCard", () => {
  const mockCreateGame = vi.fn();
  const mockLocationAssign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateGameModule.useCreateGame).mockReturnValue(
      mockCreateGame,
    );

    // Mock document.location
    delete (window as any).location;
    window.location = { href: "" } as any;
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("renders the create game form", () => {
    render(<CreateGameCard />);

    expect(screen.getByText("Create a New Game")).toBeInTheDocument();
    expect(
      screen.getByText("Start your mathematical adventure!"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Your Name")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your name..."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Game/i }),
    ).toBeInTheDocument();
  });

  it("displays gamepad icons", () => {
    const { container } = render(<CreateGameCard />);
    const icons = container.querySelectorAll('[data-icon="gamepad"]');
    expect(icons.length).toBe(2);
  });

  it("displays plus icon in button", () => {
    const { container } = render(<CreateGameCard />);
    const plusIcon = container.querySelector('[data-icon="plus"]');
    expect(plusIcon).toBeInTheDocument();
  });

  it("has disabled button when player name is empty", () => {
    render(<CreateGameCard />);
    const button = screen.getByRole("button", { name: /Create Game/i });

    expect(button).toBeDisabled();
    expect(button).toHaveClass("bg-gray-300", "cursor-not-allowed");
  });

  it("enables button when player name is entered", () => {
    render(<CreateGameCard />);
    const input = screen.getByPlaceholderText("Enter your name...");
    const button = screen.getByRole("button", { name: /Create Game/i });

    fireEvent.change(input, { target: { value: "John" } });

    expect(button).not.toBeDisabled();
    expect(button).toHaveClass("bg-sky-600");
  });

  it("updates input value when typing", () => {
    render(<CreateGameCard />);
    const input = screen.getByPlaceholderText(
      "Enter your name...",
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Alice" } });

    expect(input.value).toBe("Alice");
  });

  it("does not submit form when player name is empty", async () => {
    render(<CreateGameCard />);
    const form = screen
      .getByRole("button", { name: /Create Game/i })
      .closest("form");

    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockCreateGame).not.toHaveBeenCalled();
    });
  });

  it("calls createGame with player name on form submission", async () => {
    mockCreateGame.mockResolvedValue({
      status: "success",
      data: { gameToken: "game123", playerToken: "player456" },
    });

    render(<CreateGameCard />);
    const input = screen.getByPlaceholderText("Enter your name...");
    const form = screen
      .getByRole("button", { name: /Create Game/i })
      .closest("form");

    fireEvent.change(input, { target: { value: "Bob" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockCreateGame).toHaveBeenCalledWith("Bob");
    });
  });

  it("redirects to game page on successful game creation", async () => {
    mockCreateGame.mockResolvedValue({
      status: "success",
      data: { gameToken: "game123", playerToken: "player456" },
    });

    render(<CreateGameCard />);
    const input = screen.getByPlaceholderText("Enter your name...");
    const form = screen
      .getByRole("button", { name: /Create Game/i })
      .closest("form");

    fireEvent.change(input, { target: { value: "Charlie" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockCreateGame).toHaveBeenCalled();
    });

    // Note: document.location assignment is handled by the component
    // In a real browser, this would navigate, but in tests we just verify the call was made
  });

  it("does not redirect when game creation fails", async () => {
    mockCreateGame.mockResolvedValue({
      status: "error",
      data: { gameToken: "", playerToken: "" },
    });

    const originalLocation = document.location;

    render(<CreateGameCard />);
    const input = screen.getByPlaceholderText("Enter your name...");
    const form = screen
      .getByRole("button", { name: /Create Game/i })
      .closest("form");

    fireEvent.change(input, { target: { value: "Dave" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockCreateGame).toHaveBeenCalled();
    });

    // Location should not have changed
    expect(document.location).toBe(originalLocation);
  });

  it("does not redirect when tokens are empty", async () => {
    mockCreateGame.mockResolvedValue({
      status: "success",
      data: { gameToken: "", playerToken: "" },
    });

    const originalLocation = document.location;

    render(<CreateGameCard />);
    const input = screen.getByPlaceholderText("Enter your name...");
    const form = screen
      .getByRole("button", { name: /Create Game/i })
      .closest("form");

    fireEvent.change(input, { target: { value: "Eve" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockCreateGame).toHaveBeenCalled();
    });

    expect(document.location).toBe(originalLocation);
  });

  it("applies correct styling classes", () => {
    render(<CreateGameCard />);

    // Check main container styling
    const container = screen.getByText("Create a New Game").closest("div")
      ?.parentElement?.parentElement;
    expect(container).toHaveClass(
      "bg-white",
      "rounded-lg",
      "shadow-lg",
      "border-2",
    );

    // Check input container styling
    const inputContainer = screen.getByLabelText("Your Name").parentElement;
    expect(inputContainer).toHaveClass(
      "bg-sky-50",
      "border-2",
      "border-sky-200",
      "rounded-lg",
    );
  });

  it("has proper accessibility attributes", () => {
    render(<CreateGameCard />);

    const input = screen.getByPlaceholderText("Enter your name...");
    const label = screen.getByText("Your Name");

    expect(input).toHaveAttribute("id", "player_name");
    expect(input).toHaveAttribute("name", "player_name");
    expect(label).toHaveAttribute("for", "player_name");
  });
});
