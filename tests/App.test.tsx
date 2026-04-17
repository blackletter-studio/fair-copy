import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { App } from "../src/taskpane/App";

describe("App (scaffold)", () => {
  it("renders the Fair Copy header and a disabled Clean button", () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <App />
      </FluentProvider>,
    );
    expect(screen.getByText(/Fair Copy/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clean/i })).toBeDisabled();
  });
});
