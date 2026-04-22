import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Loader from '../../components/Loader';

describe('Loader Component', () => {
  it('should render correctly', () => {
    const { container } = render(<Loader />);
    expect(container.firstChild).toHaveClass('fixed', 'inset-0', 'bg-black/90');
  });

  it('should display the loading text', () => {
    render(<Loader />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should have 12 animated bars', () => {
    const { container } = render(<Loader />);
    // Each bar is a motion.div which renders as a div
    // We can count them by looking at the inner container
    const bars = container.querySelectorAll('.origin-bottom');
    expect(bars.length).toBe(12);
  });
});
