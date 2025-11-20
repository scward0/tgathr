'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { useState, useEffect, useRef } from 'react';

/**
 * Global Navigation Component
 *
 * Features:
 * - Desktop: Horizontal navigation with logo, links, user info, and sign out
 * - Mobile: Hamburger menu with slide-out navigation
 * - Active route highlighting
 * - Keyboard accessible (Tab, Enter, Escape)
 * - ARIA labels for screen readers
 */
export function Navigation() {
  const user = useUser();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        // Return focus to hamburger button when closing with Escape
        hamburgerButtonRef.current?.focus();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        hamburgerButtonRef.current &&
        !hamburgerButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Determine if a link is active
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') {
      return true;
    }
    if (path !== '/' && pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  // Navigation link class with active state styling
  const getLinkClass = (path: string) => {
    const baseClass = 'px-4 py-2 rounded-md transition-colors font-medium';
    const activeClass = 'text-blue-500 underline';
    const inactiveClass = 'text-white hover:text-gray-300';

    return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
  };

  // Don't render navigation if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      <nav
        className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800"
        aria-label="Main navigation"
      >
        <div className="flex justify-between items-center p-6">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-white hover:text-gray-300 transition-colors"
            aria-label="tgathr home"
          >
            tgathr
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={getLinkClass('/')}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              My Events
            </Link>
            <Link
              href="/events/new"
              className={getLinkClass('/events/new')}
              aria-current={isActive('/events/new') ? 'page' : undefined}
            >
              Create Event
            </Link>

            {/* User info and sign out */}
            <span className="text-gray-300 ml-4">
              {user.displayName || user.primaryEmail}
            </span>
            <button
              onClick={() => user.signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile Hamburger Button - Visible only on mobile */}
          <button
            ref={hamburgerButtonRef}
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {/* Hamburger Icon */}
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              {isMobileMenuOpen ? (
                // X icon when menu is open
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                // Hamburger icon when menu is closed
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Slide-out */}
      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-64 bg-gray-900 border-l border-gray-800 z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Mobile navigation menu"
      >
        <div className="flex flex-col p-6 space-y-6">
          {/* User info at top of mobile menu */}
          <div className="pb-4 border-b border-gray-800">
            <p className="text-gray-300 text-sm">Signed in as</p>
            <p className="text-white font-medium truncate">
              {user.displayName || user.primaryEmail}
            </p>
          </div>

          {/* Mobile Navigation Links */}
          <Link
            href="/"
            className={`${getLinkClass('/')} block text-center`}
            aria-current={isActive('/') ? 'page' : undefined}
          >
            My Events
          </Link>
          <Link
            href="/events/new"
            className={`${getLinkClass('/events/new')} block text-center`}
            aria-current={isActive('/events/new') ? 'page' : undefined}
          >
            Create Event
          </Link>

          {/* Sign Out button at bottom */}
          <button
            onClick={() => user.signOut()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium mt-auto"
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
