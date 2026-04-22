import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ProfileChecklist from '../../components/ProfileChecklist';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCompletionData = {
  percent: 60,
  breakdown: [
    { id: 'name', label: 'Set Full Name', complete: true, required: true },
    { id: 'phone', label: 'Verify Phone', complete: true, required: true },
    { id: 'portfolio', label: 'Add Portfolio', complete: false, required: true },
    { id: 'kycVerified', label: 'KYC Verification', complete: false, required: true },
    { id: 'bonus', label: 'Bonus Bio', complete: false, required: false },
  ],
};

const renderComponent = (props) => {
  return render(
    <BrowserRouter>
      <ProfileChecklist {...props} />
    </BrowserRouter>
  );
};

describe('ProfileChecklist Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render progress percentage', () => {
    renderComponent({ completionData: mockCompletionData });
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('should show count of pending critical tasks', () => {
    renderComponent({ completionData: mockCompletionData });
    // There are 2 required but not complete: portfolio and kycVerified
    expect(screen.getByText(/2 mission-critical tasks pending/i)).toBeInTheDocument();
  });

  it('should toggle detail view when clicked', () => {
    renderComponent({ completionData: mockCompletionData });
    
    // Header click
    const header = screen.getByText(/Profile Health/i);
    fireEvent.click(header);

    // Detail items should appear
    expect(screen.getByText(/Add Portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/KYC Verification/i)).toBeInTheDocument();
  });

  it('should navigate to correct page when "Fix Now" is clicked', () => {
    renderComponent({ completionData: mockCompletionData });
    
    // Open details
    fireEvent.click(screen.getByText(/Profile Health/i));

    // Find and click "Fix Now" for portfolio
    const fixNowButtons = screen.getAllByRole('button', { name: /fix now/i });
    // portfolio is the first one in mock data that is not complete
    fireEvent.click(fixNowButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/editor-profile-update');
    
    // Find and click "Fix Now" for KYC
    fireEvent.click(fixNowButtons[1]);
    expect(mockNavigate).toHaveBeenCalledWith('/kyc-details');
  });

  it('should render "Bonus Tasks" section if present', () => {
    renderComponent({ completionData: mockCompletionData });
    fireEvent.click(screen.getByText(/Profile Health/i));
    
    expect(screen.getByText(/Bonus Tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Bonus Bio/i)).toBeInTheDocument();
  });

  it('should return null if no completion data provided', () => {
    const { container } = renderComponent({ completionData: null });
    expect(container.firstChild).toBeNull();
  });
});
