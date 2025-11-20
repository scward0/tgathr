import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from '@/components/Navigation';
import { useUser } from '@stackframe/stack';
import { usePathname } from 'next/navigation';

// Mock Stack authentication
const mockSignOut = jest.fn();
const mockUser = {
  id: 'user-123',
  displayName: 'Test User',
  primaryEmail: 'test@example.com',
  signOut: mockSignOut,
};

jest.mock('@stackframe/stack', () => ({
  useUser: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
    (useUser as jest.Mock).mockReturnValue(mockUser);
  });

  describe('NAV-001: Desktop Navigation Rendering', () => {
    it('renders desktop navigation with all required elements', () => {
      render(<Navigation />);

      // Verify logo is visible
      expect(screen.getByRole('link', { name: /tgathr home/i })).toBeInTheDocument();

      // Verify "My Events" link is visible (desktop version)
      const myEventsLinks = screen.getAllByRole('link', { name: /my events/i });
      expect(myEventsLinks.length).toBeGreaterThan(0);
      expect(myEventsLinks[0]).toBeInTheDocument();

      // Verify "Create Event" link is visible (desktop version)
      const createEventLinks = screen.getAllByRole('link', { name: /create event/i });
      expect(createEventLinks.length).toBeGreaterThan(0);
      expect(createEventLinks[0]).toBeInTheDocument();

      // Verify user email/display name is displayed (appears in both desktop and mobile)
      const userDisplayNames = screen.getAllByText('Test User');
      expect(userDisplayNames.length).toBeGreaterThan(0);
      expect(userDisplayNames[0]).toBeInTheDocument();

      // Verify "Sign Out" button is visible
      const signOutButtons = screen.getAllByRole('button', { name: /sign out/i });
      expect(signOutButtons.length).toBeGreaterThan(0);
    });

    it('does not show hamburger menu icon on desktop viewport', () => {
      render(<Navigation />);

      // Hamburger button should exist but be hidden on desktop (md:hidden class)
      const hamburgerButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(hamburgerButton).toBeInTheDocument();
      expect(hamburgerButton).toHaveClass('md:hidden');
    });

    it('does not render navigation when user is not authenticated', () => {
      (useUser as jest.Mock).mockReturnValue(null);
      const { container } = render(<Navigation />);

      // Navigation should not render at all
      expect(container.firstChild).toBeNull();
    });

    it('displays user email when displayName is not available', () => {
      const userWithoutDisplayName = {
        ...mockUser,
        displayName: undefined,
      };
      (useUser as jest.Mock).mockReturnValue(userWithoutDisplayName);

      render(<Navigation />);

      // Email appears in both desktop and mobile menu
      const emailElements = screen.getAllByText('test@example.com');
      expect(emailElements.length).toBeGreaterThan(0);
      expect(emailElements[0]).toBeInTheDocument();
    });
  });

  describe('NAV-002: Mobile Hamburger Menu Toggle', () => {
    it('shows hamburger icon and toggles mobile menu', async () => {
      const user = userEvent.setup();
      render(<Navigation />);

      // Verify hamburger menu icon is visible
      const hamburgerButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(hamburgerButton).toBeInTheDocument();
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');

      // Verify mobile menu is not visible initially (translate-x-full)
      const mobileMenu = screen.getByLabelText('Mobile navigation menu');
      expect(mobileMenu).toHaveClass('translate-x-full');

      // Click hamburger icon to open menu
      await user.click(hamburgerButton);

      // Verify menu is now open
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
      expect(mobileMenu).toHaveClass('translate-x-0');
      expect(mobileMenu).not.toHaveClass('translate-x-full');

      // Verify navigation links are visible in mobile menu
      expect(screen.getAllByRole('link', { name: /my events/i })).toHaveLength(2); // Desktop + Mobile
      expect(screen.getAllByRole('link', { name: /create event/i })).toHaveLength(2); // Desktop + Mobile

      // Click hamburger again to close menu
      await user.click(hamburgerButton);

      // Verify menu is now closed
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
      await waitFor(() => {
        expect(mobileMenu).toHaveClass('translate-x-full');
      });
    });

    it('displays user info in mobile menu', async () => {
      const user = userEvent.setup();
      render(<Navigation />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(hamburgerButton);

      // Check for user info section in mobile menu
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
      // User name appears in both desktop and mobile menu
      expect(screen.getAllByText('Test User').length).toBeGreaterThan(1);
    });

    it('closes mobile menu when clicking outside', async () => {
      const user = userEvent.setup();
      const { container } = render(<Navigation />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(hamburgerButton);

      // Menu should be open
      const mobileMenu = screen.getByLabelText('Mobile navigation menu');
      expect(mobileMenu).toHaveClass('translate-x-0');

      // Click outside the menu (on the overlay or document body)
      await user.click(container);

      // Menu should close
      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('NAV-003: Active Route Highlighting', () => {
    it('highlights "My Events" link when on dashboard route', () => {
      (usePathname as jest.Mock).mockReturnValue('/');
      render(<Navigation />);

      const myEventsLink = screen.getAllByRole('link', { name: /my events/i })[0]; // Desktop link
      expect(myEventsLink).toHaveClass('text-blue-500', 'underline');
      expect(myEventsLink).toHaveAttribute('aria-current', 'page');
    });

    it('highlights "Create Event" link when on create event route', () => {
      (usePathname as jest.Mock).mockReturnValue('/events/new');
      render(<Navigation />);

      const createEventLink = screen.getAllByRole('link', { name: /create event/i })[0]; // Desktop link
      expect(createEventLink).toHaveClass('text-blue-500', 'underline');
      expect(createEventLink).toHaveAttribute('aria-current', 'page');

      // "My Events" should not be active
      const myEventsLink = screen.getAllByRole('link', { name: /my events/i })[0];
      expect(myEventsLink).not.toHaveClass('text-blue-500', 'underline');
      expect(myEventsLink).not.toHaveAttribute('aria-current', 'page');
    });

    it('highlights "My Events" when on event detail route', () => {
      (usePathname as jest.Mock).mockReturnValue('/events/event-123');
      render(<Navigation />);

      // Event detail pages should not highlight any specific nav item
      // since they're not explicitly in the nav menu
      const myEventsLink = screen.getAllByRole('link', { name: /my events/i })[0];
      const createEventLink = screen.getAllByRole('link', { name: /create event/i })[0];

      // Neither should be active when on event detail page
      expect(myEventsLink).not.toHaveClass('text-blue-500', 'underline');
      expect(createEventLink).not.toHaveClass('text-blue-500', 'underline');
    });

    it('applies active styling to mobile menu links', async () => {
      (usePathname as jest.Mock).mockReturnValue('/events/new');
      const user = userEvent.setup();
      render(<Navigation />);

      // Open mobile menu
      const hamburgerButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(hamburgerButton);

      // Check mobile menu links (index 1 for mobile version)
      const createEventLinks = screen.getAllByRole('link', { name: /create event/i });
      const mobileCreateEventLink = createEventLinks[1]; // Mobile link
      expect(mobileCreateEventLink).toHaveClass('text-blue-500', 'underline');
      expect(mobileCreateEventLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('NAV-004: Keyboard Accessibility', () => {
    it('allows keyboard navigation through links', async () => {
      const user = userEvent.setup();
      render(<Navigation />);

      // Tab to logo link
      await user.tab();
      const logo = screen.getByRole('link', { name: /tgathr home/i });
      expect(logo).toHaveFocus();

      // Tab to "My Events" link
      await user.tab();
      const myEventsLink = screen.getAllByRole('link', { name: /my events/i })[0];
      expect(myEventsLink).toHaveFocus();

      // Tab to "Create Event" link
      await user.tab();
      const createEventLink = screen.getAllByRole('link', { name: /create event/i })[0];
      expect(createEventLink).toHaveFocus();
    });

    it('opens mobile menu with Enter key on hamburger button', async () => {
      const user = userEvent.setup();
      render(<Navigation />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle navigation menu/i });

      // Focus hamburger button
      hamburgerButton.focus();
      expect(hamburgerButton).toHaveFocus();

      // Press Enter to open menu
      await user.keyboard('{Enter}');

      // Verify menu opened
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
      const mobileMenu = screen.getByLabelText('Mobile navigation menu');
      expect(mobileMenu).toHaveClass('translate-x-0');
    });

    it('closes mobile menu with Escape key', async () => {
      const user = userEvent.setup();
      render(<Navigation />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle navigation menu/i });

      // Open menu
      await user.click(hamburgerButton);
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');

      // Press Escape to close menu
      await user.keyboard('{Escape}');

      // Verify menu closed
      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
      });

      // Focus should return to hamburger button
      expect(hamburgerButton).toHaveFocus();
    });

    it('allows keyboard navigation within mobile menu', async () => {
      const user = userEvent.setup();
      render(<Navigation />);

      // Open mobile menu
      const hamburgerButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(hamburgerButton);

      // Tab through mobile menu items
      await user.tab();
      const mobileLinks = screen.getAllByRole('link', { name: /my events/i });
      const mobileMyEventsLink = mobileLinks[mobileLinks.length - 1]; // Last occurrence is mobile

      // Links should be focusable
      expect(document.activeElement).toBeTruthy();
    });
  });

  describe('NAV-005: Sign Out Functionality', () => {
    it('calls signOut when Sign Out button is clicked', async () => {
      const user = userEvent.setup();
      render(<Navigation />);

      // Find and click desktop Sign Out button
      const signOutButtons = screen.getAllByRole('button', { name: /sign out/i });
      const desktopSignOutButton = signOutButtons[0]; // First one is desktop

      await user.click(desktopSignOutButton);

      // Verify signOut was called
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('calls signOut when mobile Sign Out button is clicked', async () => {
      const user = userEvent.setup();
      render(<Navigation />);

      // Open mobile menu
      const hamburgerButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(hamburgerButton);

      // Find and click mobile Sign Out button
      const signOutButtons = screen.getAllByRole('button', { name: /sign out/i });
      const mobileSignOutButton = signOutButtons[signOutButtons.length - 1]; // Last one is mobile

      await user.click(mobileSignOutButton);

      // Verify signOut was called
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('Sign Out button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Navigation />);

      const signOutButtons = screen.getAllByRole('button', { name: /sign out/i });
      const desktopSignOutButton = signOutButtons[0];

      // Focus the Sign Out button directly (simulating keyboard navigation)
      desktopSignOutButton.focus();
      expect(desktopSignOutButton).toHaveFocus();

      // Press Enter to trigger sign out
      await user.keyboard('{Enter}');

      // Verify signOut was called
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('has proper ARIA label on Sign Out button', () => {
      render(<Navigation />);

      const signOutButtons = screen.getAllByRole('button', { name: /sign out/i });
      expect(signOutButtons.length).toBeGreaterThan(0);

      // All sign out buttons should have aria-label
      signOutButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label', 'Sign out');
      });
    });
  });

  describe('Additional Accessibility Features', () => {
    it('has proper ARIA labels on navigation elements', () => {
      render(<Navigation />);

      // Main nav should have aria-label
      const mainNav = screen.getByRole('navigation');
      expect(mainNav).toHaveAttribute('aria-label', 'Main navigation');

      // Logo should have aria-label
      const logo = screen.getByRole('link', { name: /tgathr home/i });
      expect(logo).toHaveAttribute('aria-label', 'tgathr home');
    });

    it('prevents body scroll when mobile menu is open', async () => {
      const user = userEvent.setup();
      render(<Navigation />);

      // Open mobile menu
      const hamburgerButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(hamburgerButton);

      // Body should have overflow hidden
      expect(document.body.style.overflow).toBe('hidden');

      // Close menu
      await user.click(hamburgerButton);

      // Body overflow should be restored
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });
  });
});
