import React from 'react';
import { render } from '@testing-library/react-native';
import PlaceholderScreen from '../src/components/PlaceholderScreen';
import { ThemeProvider } from '../src/context/ThemeContext';

// Mock the ThemeProvider to provide a stable context for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};

describe('PlaceholderScreen', () => {
  it('renders correctly with the provided name', () => {
    const screenName = 'TEST_SCREEN';
    const { getByText } = render(
      <AllTheProviders>
        <PlaceholderScreen name={screenName} />
      </AllTheProviders>
    );

    // Verify the title is rendered
    expect(getByText(screenName)).toBeTruthy();
    
    // Verify the brand subtitle is rendered
    expect(getByText('Experience SuviX on Mobile')).toBeTruthy();
  });
});
