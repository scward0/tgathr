import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';
import { SkeletonCard } from '../SkeletonCard';
import { EventDetailSkeleton } from '../EventDetailSkeleton';
import { ResponsePageSkeleton } from '../ResponsePageSkeleton';

/**
 * Comprehensive accessibility tests for all loading state components
 * Ensures WCAG 2.1 Level AA compliance for loading indicators
 */
describe('Loading States Accessibility', () => {
  describe('LoadingSpinner ARIA attributes', () => {
    it('has role="status" for screen reader announcement', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('has aria-live="polite" for non-intrusive updates', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-label describing the loading state', () => {
      render(<LoadingSpinner label="Loading event data" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading event data');
    });

    it('hides decorative spinner from screen readers', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      const decorativeSpinner = spinner.querySelector('.animate-spin');
      expect(decorativeSpinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('SkeletonCard ARIA attributes', () => {
    it('has role="status" for screen reader announcement', () => {
      render(<SkeletonCard />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
    });

    it('has aria-label describing what is loading', () => {
      render(<SkeletonCard />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading event');
    });

    it('has aria-busy="true" to indicate loading state', () => {
      render(<SkeletonCard />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('EventDetailSkeleton ARIA attributes', () => {
    it('has aria-busy="true" on main container', () => {
      const { container } = render(<EventDetailSkeleton />);
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveAttribute('aria-busy', 'true');
    });

    it('provides descriptive labels for each skeleton section', () => {
      render(<EventDetailSkeleton />);

      // Check that all sections have proper ARIA labels
      expect(screen.getByLabelText('Loading event header')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading event statistics')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading smart recommendations')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading participants list')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading availability heatmap')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading event details')).toBeInTheDocument();
    });

    it('uses role="status" for all skeleton sections', () => {
      render(<EventDetailSkeleton />);
      const statusElements = screen.getAllByRole('status');

      // Should have at least 6 sections (header, stats, recommendations, participants, heatmap, details)
      expect(statusElements.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('ResponsePageSkeleton ARIA attributes', () => {
    it('has role="status" on main container', () => {
      render(<ResponsePageSkeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
    });

    it('has aria-label describing the loading state', () => {
      render(<ResponsePageSkeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading event data');
    });

    it('has aria-busy="true" to indicate loading state', () => {
      render(<ResponsePageSkeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('General Accessibility Requirements', () => {
    it('all loading states use semantic HTML roles', () => {
      const { container: spinner } = render(<LoadingSpinner />);
      const { container: skeleton } = render(<SkeletonCard />);
      const { container: eventDetail } = render(<EventDetailSkeleton />);

      // Check that role="status" is used
      expect(spinner.querySelector('[role="status"]')).toBeInTheDocument();
      expect(skeleton.querySelector('[role="status"]')).toBeInTheDocument();
      expect(eventDetail.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it('all skeleton loaders use animate-pulse for visual feedback', () => {
      const { container: skeleton } = render(<SkeletonCard />);
      const { container: eventDetail } = render(<EventDetailSkeleton />);

      // Check for animation class
      expect(skeleton.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(eventDetail.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('loading states preserve layout to prevent content shift', () => {
      const { container: skeleton } = render(<SkeletonCard />);

      // Check that skeleton has proper structure with padding and spacing
      const card = skeleton.querySelector('.bg-gray-800');
      expect(card).toHaveClass('rounded-lg', 'p-6');
    });
  });

  describe('WCAG 2.1 Level AA Compliance', () => {
    it('provides text alternatives for loading indicators', () => {
      render(<LoadingSpinner label="Processing request" />);

      // Text label should be present
      expect(screen.getByText('Processing request')).toBeInTheDocument();

      // ARIA label should also be present
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Processing request');
    });

    it('uses non-intrusive live regions (polite)', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');

      // Should use aria-live="polite" not "assertive"
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });

    it('provides sufficient color contrast for skeleton loaders', () => {
      const { container } = render(<SkeletonCard />);

      // Skeleton should use bg-gray-700 on bg-gray-800 for contrast
      expect(container.querySelector('.bg-gray-700')).toBeInTheDocument();
      expect(container.querySelector('.bg-gray-800')).toBeInTheDocument();
    });
  });
});
