import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "../test-utils";
import React from "react";

// Example Button component for testing
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled = false, variant = "primary" }) => {
  return (
    <button onClick={onClick} disabled={disabled} className={`btn btn-${variant}`} data-testid="custom-button">
      {children}
    </button>
  );
};

describe("Button Component", () => {
  it("should render button with text", () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    // Arrange
    const mockOnClick = vi.fn();
    render(<Button onClick={mockOnClick}>Click me</Button>);

    const button = screen.getByRole("button");

    // Act
    fireEvent.click(button);

    // Assert
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    // Arrange & Act
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole("button");

    // Assert
    expect(button).toBeDisabled();
  });

  it("should not call onClick when disabled", () => {
    // Arrange
    const mockOnClick = vi.fn();
    render(
      <Button onClick={mockOnClick} disabled>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button");

    // Act
    fireEvent.click(button);

    // Assert
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should apply correct CSS class for variant", () => {
    // Arrange & Act
    render(<Button variant="secondary">Secondary Button</Button>);

    const button = screen.getByTestId("custom-button");

    // Assert
    expect(button).toHaveClass("btn-secondary");
  });

  it("should have default primary variant", () => {
    // Arrange & Act
    render(<Button>Default Button</Button>);

    const button = screen.getByTestId("custom-button");

    // Assert
    expect(button).toHaveClass("btn-primary");
  });
});
