import { render, screen } from '@testing-library/react';
import App from './App';

// PUBLIC_INTERFACE
test("renders sidebar and 'Notes' app title", () => {
  render(<App />);
  expect(screen.getByText(/Notes/i)).toBeInTheDocument();
});

// PUBLIC_INTERFACE
test("renders create note button", () => {
  render(<App />);
  const btn = screen.getByText(/\+ New Note/i);
  expect(btn).toBeInTheDocument();
});

// PUBLIC_INTERFACE
test('shows empty message if no notes', () => {
  render(<App />);
  expect(screen.getByText(/Select or create a note/i)).toBeInTheDocument();
});
