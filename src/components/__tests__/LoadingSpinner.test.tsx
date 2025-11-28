import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  it('renders with custom label', () => {
    render(<LoadingSpinner label="Loading event data" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading event data');
    expect(screen.getByText('Loading event data')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="md" />);
    spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('w-8', 'h-8');

    rerender(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('w-12', 'h-12');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="my-custom-class" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('my-custom-class');
  });

  it('includes animation class', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('animate-spin');
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<LoadingSpinner label="Processing" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveAttribute('aria-label', 'Processing');

    // The inner div should be hidden from screen readers
    expect(spinner.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
