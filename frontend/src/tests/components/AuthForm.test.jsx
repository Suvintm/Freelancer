import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AuthForm from '../../components/AuthForm';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockContextValue = {
  showAuth: true,
  setShowAuth: vi.fn(),
  backendURL: 'http://localhost:5000',
  setUser: vi.fn(),
};

const renderWithContext = (ui, { providerProps } = {}) => {
  return render(
    <AppContext.Provider {...providerProps}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </AppContext.Provider>
  );
};

describe('AuthForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form by default', () => {
    renderWithContext(<AuthForm />, {
      providerProps: { value: mockContextValue }
    });
    
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('should toggle to register form', () => {
    renderWithContext(<AuthForm />, {
      providerProps: { value: mockContextValue }
    });

    const toggleButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(toggleButton);

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mobile number/i)).toBeInTheDocument();
  });

  it('should call axios.post on login submission', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { name: 'Test User', role: 'client' },
        token: 'fake-token'
      }
    });

    renderWithContext(<AuthForm />, {
      providerProps: { value: mockContextValue }
    });

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' }
    });

    const submitButton = screen.getByRole('button', { name: /^continue$/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123'
        })
      );
    });

    expect(mockContextValue.setUser).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/client-home');
  });

  it('should show error message on failed login', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Invalid credentials' }
      }
    });

    renderWithContext(<AuthForm />, {
      providerProps: { value: mockContextValue }
    });

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'wrong@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpass' }
    });

    const submitButton = screen.getByRole('button', { name: /^continue$/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
