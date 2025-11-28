import { render, screen } from '@testing-library/react';
import {
  EventDetailSkeleton,
  EventHeaderSkeleton,
  StatsCardsSkeleton,
  RecommendationsSkeleton,
  ParticipantsListSkeleton,
  HeatmapSkeleton,
  EventDetailsSkeleton,
} from '../EventDetailSkeleton';

describe('EventDetailSkeleton', () => {
  it('renders complete event detail skeleton structure', () => {
    render(<EventDetailSkeleton />);

    // Should render all sections with proper ARIA attributes
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('has proper ARIA busy attribute', () => {
    const { container } = render(<EventDetailSkeleton />);
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveAttribute('aria-busy', 'true');
  });

  it('includes animation classes for shimmer effect', () => {
    const { container } = render(<EventDetailSkeleton />);
    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });
});

describe('EventHeaderSkeleton', () => {
  it('renders event header skeleton with proper ARIA label', () => {
    render(<EventHeaderSkeleton />);

    const header = screen.getByRole('status');
    expect(header).toHaveAttribute('aria-label', 'Loading event header');
  });

  it('includes all header elements', () => {
    const { container } = render(<EventHeaderSkeleton />);
    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(2);
  });
});

describe('StatsCardsSkeleton', () => {
  it('renders three stats cards', () => {
    render(<StatsCardsSkeleton />);

    const statsContainer = screen.getByRole('status');
    expect(statsContainer).toHaveAttribute('aria-label', 'Loading event statistics');

    const { container } = render(<StatsCardsSkeleton />);
    const cards = container.querySelectorAll('.bg-gray-800');
    expect(cards.length).toBe(3);
  });
});

describe('RecommendationsSkeleton', () => {
  it('renders recommendations skeleton with proper ARIA label', () => {
    render(<RecommendationsSkeleton />);

    const recommendations = screen.getByRole('status');
    expect(recommendations).toHaveAttribute('aria-label', 'Loading smart recommendations');
  });

  it('renders three recommendation cards', () => {
    const { container } = render(<RecommendationsSkeleton />);
    const cards = container.querySelectorAll('.border-2.border-gray-700');
    expect(cards.length).toBe(3);
  });
});

describe('ParticipantsListSkeleton', () => {
  it('renders participants list skeleton with proper ARIA label', () => {
    render(<ParticipantsListSkeleton />);

    const participantsList = screen.getByRole('status');
    expect(participantsList).toHaveAttribute('aria-label', 'Loading participants list');
  });

  it('renders four participant items', () => {
    const { container } = render(<ParticipantsListSkeleton />);
    const items = container.querySelectorAll('.bg-gray-750');
    expect(items.length).toBe(4);
  });
});

describe('HeatmapSkeleton', () => {
  it('renders heatmap skeleton with proper ARIA label', () => {
    render(<HeatmapSkeleton />);

    const heatmap = screen.getByRole('status');
    expect(heatmap).toHaveAttribute('aria-label', 'Loading availability heatmap');
  });

  it('renders heatmap grid structure', () => {
    const { container } = render(<HeatmapSkeleton />);
    const gridRows = container.querySelectorAll('.flex.gap-2');
    expect(gridRows.length).toBeGreaterThan(0);
  });
});

describe('EventDetailsSkeleton', () => {
  it('renders event details skeleton with proper ARIA label', () => {
    render(<EventDetailsSkeleton />);

    const details = screen.getByRole('status');
    expect(details).toHaveAttribute('aria-label', 'Loading event details');
  });

  it('renders detail items', () => {
    const { container } = render(<EventDetailsSkeleton />);
    const detailItems = container.querySelectorAll('.space-y-3 > div');
    expect(detailItems.length).toBe(4);
  });
});
