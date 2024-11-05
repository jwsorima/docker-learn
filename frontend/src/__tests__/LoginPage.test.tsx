import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdmissionLoginPage from "../pages/LoginPage";
import { MemoryRouter } from "react-router-dom";
import { login } from "../utils/auth";
import { describe, test, vi, expect, beforeEach } from "vitest";

vi.mock("../utils/auth", () => ({
  login: vi.fn(),
}));

function renderWithRouter(component: React.ReactNode) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}

describe("AdmissionLoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mock history before each test
  });

  test("renders login form elements", () => {
    renderWithRouter(<AdmissionLoginPage />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  test("displays validation errors on empty fields", async () => {
    renderWithRouter(<AdmissionLoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/please provide your email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/please enter your password/i)).toBeInTheDocument();
  });

  test("calls login function on valid submission", async () => {
    // Mock a successful login response
    vi.mocked(login).mockResolvedValue({ success: true, message: "Login successful", accessToken: "dummy-token" })

    renderWithRouter(<AdmissionLoginPage />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("user@example.com", "password123", "applicants/login");
      expect(screen.getByText(/login successful/i)).toBeInTheDocument();
    });
  });

  test("displays error message on unsuccessful login attempt", async () => {
    // Mock an unsuccessful login response
    vi.mocked(login).mockResolvedValue({ success: false, message: "Invalid credentials" })

    renderWithRouter(<AdmissionLoginPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test("shows loading indicator when submitting the form", async () => {
    // Mock a delayed login response
    vi.mocked(login).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: "Login successful" }), 500))
    );

    renderWithRouter(<AdmissionLoginPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Check that the loading indicator is displayed
    expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Wait for the loading indicator to disappear after the login completes
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
  });
});
