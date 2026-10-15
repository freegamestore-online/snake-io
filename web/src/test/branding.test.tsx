import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameTopbar } from "@freegamestore/games";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Guards the player-visible name: the topbar must show "Slither Arena" and
// never leak the old "snake.io" or copied "slither.io" branding.
describe("visible branding", () => {
  it("renders the Slither Arena title in the topbar", () => {
    render(<GameTopbar title="Slither Arena" score={0} />);
    expect(screen.getByText("Slither Arena")).toBeInTheDocument();
  });

  it("never shows snake.io or slither.io in the rendered text", () => {
    render(<GameTopbar title="Slither Arena" score={0} />);
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("snake.io");
    expect(text).not.toContain("slither.io");
  });

  it("keeps the old branding out of the app's title source", () => {
    // jsdom gives import.meta.url a non-file scheme, so resolve from the web/ root
    const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
    const game = readFileSync(join(process.cwd(), "src/game.ts"), "utf8");
    for (const source of [app, game]) {
      expect(source).not.toContain("snake.io");
      expect(source).not.toContain("slither.io");
    }
  });
});
