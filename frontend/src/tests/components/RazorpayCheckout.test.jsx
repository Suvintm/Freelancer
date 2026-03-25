import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import RazorpayCheckout from '../../components/RazorpayCheckout';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock Razorpay Global
const mockRazorpayOpen = vi.fn();
const mockRazorpayOn = vi.fn();
window.Razorpay = vi.fn().mockImplementation(function() {
  return {
    open: mockRazorpayOpen,
    on: mockRazorpayOn,
  };
});

const mockContextValue = {
  backendURL: 'http://localhost:5000',
  user: { name: 'Payer User', email: 'payer@test.com', token: 'fake-token' },
};

const renderWithContext = (ui) => {
  return render(
    <AppContext.Provider value={mockContextValue}>
      {ui}
    </AppContext.Provider>
  );
};

describe('RazorpayCheckout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    // Pre-create the script tag
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    document.body.appendChild(script);

    // Default mock for config
    axios.get.mockResolvedValue({
      data: { config: { supported: true } }
    });
  });

  it('should fetch configuration on mount', async () => {
    renderWithContext(
      <RazorpayCheckout 
        orderId="order_123" 
        amount={1000} 
        onClose={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  it('should show unsupported message if region not supported', async () => {
    axios.get.mockResolvedValueOnce({
      data: { config: { supported: false, message: 'Not available in your country' } }
    });

    renderWithContext(
      <RazorpayCheckout 
        orderId="order_123" 
        amount={1000} 
        onClose={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/International Payments Coming Soon/i)).toBeInTheDocument();
      expect(screen.getByText(/Not available in your country/i)).toBeInTheDocument();
    });
  });

  it('should initiate payment when Pay button is clicked', async () => {
    // Mock order creation
    axios.post.mockResolvedValue({
      data: {
        success: true,
        order: { id: 'rzp_order_123', amount: 100000, currency: 'INR' },
        keyId: 'rzp_test_key',
        prefill: { name: 'Payer User', email: 'payer@test.com' }
      }
    });

    renderWithContext(
      <RazorpayCheckout 
        orderId="order_123" 
        amount={1000} 
        onClose={vi.fn()} 
      />
    );

    // Wait for pay button to be available (not disabled)
    const payButton = await screen.findByRole('button', { name: /pay/i });
    await waitFor(() => expect(payButton).not.toBeDisabled());
    
    fireEvent.click(payButton);

    // Verify axios.post was called
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/payment-gateway/create-order'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    // Verify Razorpay constructor was called
    await waitFor(() => {
      expect(window.Razorpay).toHaveBeenCalled();
      expect(mockRazorpayOpen).toHaveBeenCalled();
    });
  });

  it('should handle payment failure', async () => {
    axios.post.mockResolvedValue({
        data: { success: true, order: { id: '123' }, keyId: 'key' }
    });

    const onFailure = vi.fn();
    renderWithContext(
      <RazorpayCheckout 
        orderId="order_123" 
        amount={1000} 
        onFailure={onFailure}
      />
    );

    const payButton = await screen.findByRole('button', { name: /pay/i });
    await waitFor(() => expect(payButton).not.toBeDisabled());
    fireEvent.click(payButton);

    // Wait for the handler to be registered
    await waitFor(() => {
      expect(mockRazorpayOn).toHaveBeenCalledWith('payment.failed', expect.any(Function));
    });

    // Extract the failure handler from mockRazorpayOn calls
    const failureHandler = mockRazorpayOn.mock.calls.find(call => call[0] === 'payment.failed')[1];
    
    // Simulate failure
    failureHandler({ error: { description: 'Insufficient funds' } });

    await waitFor(() => {
      expect(screen.getByText(/Payment Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Insufficient funds/i)).toBeInTheDocument();
    });
  });
});
