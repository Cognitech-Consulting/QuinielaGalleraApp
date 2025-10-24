import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeScreen from '../HomeScreen';

test('renders home screen', () => {
  render(<HomeScreen />);
  const homeScreenElement = screen.getByTestId('home-screen');
  expect(homeScreenElement).toBeInTheDocument();
});

test('displays welcome message', () => {
  render(<HomeScreen />);
  const welcomeMessageElement = screen.getByText('Welcome to the Home Screen!');
  expect(welcomeMessageElement).toBeInTheDocument();
});

test('displays user name', () => {
  const userName = 'John Doe';
  render(<HomeScreen userName={userName} />);
  const userNameElement = screen.getByText(`Hello, ${userName}!`);
  expect(userNameElement).toBeInTheDocument();
});

test('displays loading spinner', () => {
  render(<HomeScreen isLoading />);
  const loadingSpinnerElement = screen.getByTestId('loading-spinner');
  expect(loadingSpinnerElement).toBeInTheDocument();
});

test('displays error message', () => {
  const errorMessage = 'Failed to load data';
  render(<HomeScreen errorMessage={errorMessage} />);
  const errorMessageElement = screen.getByText(errorMessage);
  expect(errorMessageElement).toBeInTheDocument();
});