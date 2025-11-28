import { render, screen } from '@testing-library/react';
import { SkeletonCard } from '../SkeletonCard';

describe('SkeletonCard', () => {
  it('renders skeleton card with proper structure', () => {
    render(<SkeletonCard />);

    const card = screen.getByRole('status');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-gray-800', 'rounded-lg', 'p-6');
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<SkeletonCard />);

    const card = screen.getByRole('status');
    expect(card).toHaveAttribute('aria-label', 'Loading event');
    expect(card).toHaveAttribute('aria-busy', 'true');
  });

  it('includes shimmer animation on skeleton elements', () => {
    const { container } = render(<SkeletonCard />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('renders multiple skeleton cards without errors', () => {
    const { container } = render(
      <>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </>
    );

    const cards = screen.getAllByRole('status');
    expect(cards).toHaveLength(3);
  });

  it('has consistent styling with event cards', () => {
    render(<SkeletonCard />);

    const card = screen.getByRole('status');
    expect(card).toHaveClass('bg-gray-800');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('p-6');
  });
});
