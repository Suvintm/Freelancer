import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('Smoke Test', () => {
  it('should verify that Vitest and RTL are working', () => {
    render(<h1>SuviX Testing</h1>);
    expect(screen.getByText('SuviX Testing')).toBeInTheDocument();
  });
});
