import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import userEvent from '@testing-library/user-event'
import Register from "../pages/Register";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { describe, test, vi, expect, beforeEach, MockedFunction } from "vitest";

vi.mock('axios', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      create: vi.fn().mockReturnThis(),
      interceptors: {
        request: {
          use: vi.fn(),
          eject: vi.fn(),
        },
        response: {
          use: vi.fn(),
          eject: vi.fn(),
        },
      },
      isAxiosError: (error: any): error is import('axios').AxiosError => {
        return error?.isAxiosError === true;
      },
    },
  };
});

function renderWithRouter(component: React.ReactNode) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}

describe("Register Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderWithRouter(<Register />);
  });

  test("renders registration form elements", () => {

    expect(screen.getByLabelText(/^Full Name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contact Number$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Address$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Sex$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Birthdate$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email Address$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm Password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  test("displays validation errors on empty fields", async () => {

    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/contact number is required/i)).toBeInTheDocument();
    expect(screen.getByText(/address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/sex is required/i)).toBeInTheDocument();
    expect(screen.getByText(/birthdate is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  test("displays error when passwords do not match", async () => {
  
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), { target: { value: "password456" } });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
  
    const errorMessages = await screen.findAllByText(/passwords do not match/i);
    expect(errorMessages).toHaveLength(2);
  });


  test("shows loading indicator when submitting the form", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  
    (axios.post as MockedFunction<typeof axios.post>).mockResolvedValue(
      new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 4000))
    );
  
    await user.type(screen.getByLabelText(/^Full Name$/i), "John Doe");
    await user.type(screen.getByLabelText(/^Contact Number$/i), "912 345 6789");
    await user.type(screen.getByLabelText(/^Address$/i), "123 Main St");

    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("combobox", { name: "Sex" }));
    });

    const dropdownMenu = screen.getByTestId('select-sex-input');
    expect(dropdownMenu).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("option", { name: "Male" })).toBeInTheDocument());
    
    await act(async() => {
      await user.click(screen.getByRole("option", { name: "Male" }));
    })
    
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Sex" })).toHaveTextContent("Male"));
        

    await user.type(screen.getByLabelText(/^Birthdate$/i), "01/01/2000");
    await user.type(screen.getByLabelText(/^Email Address$/i), "john@example.com");
    await user.type(screen.getByLabelText(/^Password$/i), "password123");
    await user.type(screen.getByLabelText(/^Confirm Password$/i), "password123");
  
    await user.click(screen.getByRole("button", { name: 'Register' }));
  
    expect(axios.post).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
  
    expect(screen.getByText("Registering...")).toBeInTheDocument();
  
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
  
    expect(screen.queryByText("Registering...")).not.toBeInTheDocument();

    const alertContainer = screen.getByRole("alert");
    expect(within(alertContainer).getByText(/Registration successful!/i)).toBeInTheDocument();

    vi.useRealTimers();
  });


  test("displays validation error when birthdate is missing", async () => {
    const user = userEvent.setup();

    await userEvent.type(screen.getByLabelText(/^Full Name$/i), "John Doe" );
    await userEvent.type(screen.getByLabelText(/^Contact Number$/i), "912 345 6789"  );
    await userEvent.type(screen.getByLabelText(/^Address$/i), "123 Main St" );


    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("combobox", { name: "Sex" }));
    });
    await waitFor(() => expect(screen.getByRole("option", { name: "Male" })).toBeInTheDocument());
    await act(async() => {
      await user.click(screen.getByRole("option", { name: "Male" }));
    })
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Sex" })).toHaveTextContent("Male"));

    
    await userEvent.type(screen.getByLabelText(/^Email Address$/i), "john@example.com" );
    await userEvent.type(screen.getByLabelText(/^Password$/i), "password123" );
    await userEvent.type(screen.getByLabelText(/^Confirm Password$/i), "password123" );

    await userEvent.click(screen.getByRole("button", { name: 'Register' }));

    expect(await screen.findByText(/birthdate is required/i)).toBeInTheDocument();
  });

  test("displays error message when registration fails", async () => {
    (axios.post as MockedFunction<typeof axios.post>).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { message: "An account with this email already exists." },
      },
    });


    await userEvent.type(screen.getByLabelText(/^Full Name$/i), "John Doe");
    await userEvent.type(screen.getByLabelText(/^Contact Number$/i), "912 345 6789");
    await userEvent.type(screen.getByLabelText(/^Address$/i), "123 Main St");

    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("combobox", { name: "Sex" }));
    });
    const dropdownMenu = screen.getByTestId('select-sex-input');
    expect(dropdownMenu).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("option", { name: "Male" })).toBeInTheDocument());
    await act(async() => {
      await userEvent.click(screen.getByRole("option", { name: "Male" }));
    })
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Sex" })).toHaveTextContent("Male"));
        

    await userEvent.type(screen.getByLabelText(/^Birthdate$/i), "01/01/2000");
    await userEvent.type(screen.getByLabelText(/^Email Address$/i), "john@example.com");
    await userEvent.type(screen.getByLabelText(/^Password$/i), "password123");
    await userEvent.type(screen.getByLabelText(/^Confirm Password$/i), "password123");
  
    await userEvent.click(screen.getByRole("button", { name: 'Register' }));


    const errorMessages = await screen.findAllByText(/^An account with this email already exists.$/i);

    expect(errorMessages.length).toBeGreaterThan(0);
  });
});
