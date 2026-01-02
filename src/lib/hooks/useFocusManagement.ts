import { useCallback, useRef, useEffect } from "react";

/**
 * Configuration for focus trap
 */
interface FocusTrapConfig {
  // Whether the focus trap is active
  active?: boolean;
  
  // Initial element to focus when trap activates
  initialFocus?: HTMLElement | (() => HTMLElement | null);
  
  // Element to return focus to when trap deactivates  
  restoreFocus?: HTMLElement | (() => HTMLElement | null);
  
  // Whether to cycle focus when reaching boundaries
  loop?: boolean;
  
  // Custom focusable selector
  focusableSelector?: string;
}

/**
 * Default selector for focusable elements
 */
const DEFAULT_FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  'details > summary',
].join(',');

/**
 * Hook for managing focus within a container (focus trap)
 */
export function useFocusTrap(config: FocusTrapConfig = {}) {
  const {
    active = false,
    initialFocus,
    restoreFocus,
    loop = true,
    focusableSelector = DEFAULT_FOCUSABLE_SELECTOR,
  } = config;

  const containerRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const elements = containerRef.current.querySelectorAll(focusableSelector);
    return Array.from(elements) as HTMLElement[];
  }, [focusableSelector]);

  /**
   * Focus the first focusable element
   */
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    
    if (initialFocus) {
      const element = typeof initialFocus === 'function' ? initialFocus() : initialFocus;
      if (element) {
        element.focus();
        return;
      }
    }
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements, initialFocus]);

  /**
   * Focus the last focusable element
   */
  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  /**
   * Handle Tab key to trap focus
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!active || event.key !== 'Tab') return;
    
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;
    
    if (event.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement) {
        event.preventDefault();
        if (loop) {
          lastElement.focus();
        }
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        event.preventDefault();
        if (loop) {
          firstElement.focus();
        }
      }
    }
  }, [active, getFocusableElements, loop]);

  /**
   * Handle Escape key
   */
  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (active && event.key === 'Escape') {
      // Let parent components handle escape if they need to
      const escapeEvent = new CustomEvent('focustrap:escape', {
        detail: { originalEvent: event },
        bubbles: true,
      });
      containerRef.current?.dispatchEvent(escapeEvent);
    }
  }, [active]);

  // Effect to set up and tear down focus trap
  useEffect(() => {
    if (!active) return;

    // Store previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Focus the initial element
    focusFirst();

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      // Remove event listeners
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscape);

      // Restore focus if specified
      if (restoreFocus) {
        const element = typeof restoreFocus === 'function' ? restoreFocus() : restoreFocus;
        element?.focus();
      } else if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [active, focusFirst, handleKeyDown, handleEscape, restoreFocus]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    getFocusableElements,
  };
}

/**
 * Hook for managing focus announcements for screen readers
 */
export function useFocusAnnouncement() {
  const announcementRef = useRef<HTMLDivElement>(null);

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) return;

    // Clear previous message
    announcementRef.current.textContent = '';
    announcementRef.current.setAttribute('aria-live', priority);

    // Set new message with a small delay to ensure screen readers pick it up
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message;
      }
    }, 100);

    // Clear message after a delay
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  /**
   * Render the announcement region (should be included in component)
   */
  const AnnouncementRegion = useCallback(() => (
    <div
      ref={announcementRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  ), []);

  return {
    announce,
    AnnouncementRegion,
  };
}

/**
 * Hook for keyboard navigation in lists/grids
 */
export function useKeyboardNavigation<T extends HTMLElement = HTMLElement>(
  itemsCount: number,
  options: {
    orientation?: 'vertical' | 'horizontal' | 'grid';
    loop?: boolean;
    pageSize?: number; // For grid navigation
    onSelect?: (index: number) => void;
  } = {}
) {
  const {
    orientation = 'vertical',
    loop = true,
    pageSize = 1,
    onSelect,
  } = options;

  const containerRef = useRef<T>(null);
  const currentIndexRef = useRef(0);

  /**
   * Move focus to item at index
   */
  const focusItem = useCallback((index: number) => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll('[data-keyboard-nav-item]');
    const item = items[index] as HTMLElement;
    
    if (item) {
      item.focus();
      currentIndexRef.current = index;
    }
  }, []);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (itemsCount === 0) return;

    const { key } = event;
    let newIndex = currentIndexRef.current;

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          newIndex = loop 
            ? (currentIndexRef.current + 1) % itemsCount
            : Math.min(currentIndexRef.current + 1, itemsCount - 1);
          event.preventDefault();
        } else if (orientation === 'grid') {
          newIndex = loop
            ? (currentIndexRef.current + pageSize) % itemsCount
            : Math.min(currentIndexRef.current + pageSize, itemsCount - 1);
          event.preventDefault();
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical') {
          newIndex = loop
            ? (currentIndexRef.current - 1 + itemsCount) % itemsCount
            : Math.max(currentIndexRef.current - 1, 0);
          event.preventDefault();
        } else if (orientation === 'grid') {
          newIndex = loop
            ? (currentIndexRef.current - pageSize + itemsCount) % itemsCount
            : Math.max(currentIndexRef.current - pageSize, 0);
          event.preventDefault();
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          newIndex = loop
            ? (currentIndexRef.current + 1) % itemsCount
            : Math.min(currentIndexRef.current + 1, itemsCount - 1);
          event.preventDefault();
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          newIndex = loop
            ? (currentIndexRef.current - 1 + itemsCount) % itemsCount
            : Math.max(currentIndexRef.current - 1, 0);
          event.preventDefault();
        }
        break;

      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;

      case 'End':
        newIndex = itemsCount - 1;
        event.preventDefault();
        break;

      case 'Enter':
      case ' ':
        if (onSelect) {
          onSelect(currentIndexRef.current);
          event.preventDefault();
        }
        break;

      default:
        return;
    }

    if (newIndex !== currentIndexRef.current) {
      focusItem(newIndex);
    }
  }, [itemsCount, orientation, loop, pageSize, onSelect, focusItem]);

  return {
    containerRef,
    currentIndex: currentIndexRef.current,
    focusItem,
    handleKeyDown,
  };
}

/**
 * Hook for managing skip links
 */
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement>(null);

  /**
   * Create a skip link
   */
  const createSkipLink = useCallback((targetId: string, label: string) => ({
    href: `#${targetId}`,
    label,
    onClick: (event: React.MouseEvent) => {
      event.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
  }), []);

  /**
   * Render skip links (should be first element on page)
   */
  const SkipLinks = useCallback(({ links }: { 
    links: Array<{ href: string; label: string; onClick: (event: React.MouseEvent) => void }> 
  }) => (
    <div ref={skipLinksRef} className="sr-only focus-within:not-sr-only">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={link.onClick}
          className="absolute top-0 left-0 z-50 p-4 bg-primary text-primary-foreground font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {link.label}
        </a>
      ))}
    </div>
  ), []);

  return {
    createSkipLink,
    SkipLinks,
  };
}

/**
 * Hook for managing ARIA live regions
 */
export function useAriaLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Announce message to assistive technologies
   */
  const announce = useCallback((
    message: string,
    priority: 'off' | 'polite' | 'assertive' = 'polite',
    clearDelay = 1000
  ) => {
    if (!liveRegionRef.current) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the message and priority
    liveRegionRef.current.setAttribute('aria-live', priority);
    liveRegionRef.current.textContent = message;

    // Clear the message after delay
    if (clearDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, clearDelay);
    }
  }, []);

  /**
   * Clear current announcement
   */
  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }
  }, []);

  /**
   * Render the live region
   */
  const LiveRegion = useCallback(() => (
    <div
      ref={liveRegionRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  ), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    announce,
    clear,
    LiveRegion,
  };
}