import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "../pages/Home";
import { MemoryRouter } from 'react-router-dom';

function TestHome() {
  return (
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

describe("HomePage", () => {
  test("renders", () => {
    render(<TestHome />)
    expect(screen.getByText("Login")).toBeDefined();
  })
})