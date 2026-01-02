/**
 * Accessibility utilities for better screen reader support
 * and keyboard navigation
 */

/**
 * Generate unique IDs for accessibility attributes
 */
export function generateA11yId(prefix = "a11y"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an element is visible to assistive technologies
 */
export function isElementVisible(element: HTMLElement): boolean {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

/**
 * Check if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Check if high contrast mode is enabled
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia("(prefers-contrast: high)").matches;
}

/**
 * Check if the user is using a keyboard for navigation
 */
export function detectKeyboardNavigation(): void {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Tab") {
      document.documentElement.classList.add("keyboard-user");
      document.removeEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleMouseDown);
    }
  };

  const handleMouseDown = () => {
    document.documentElement.classList.remove("keyboard-user");
    document.removeEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
  };

  document.addEventListener("keydown", handleKeyDown);
}

/**
 * Format text for screen readers
 */
export const screenReaderText = {
  /**
   * Format numbers for better pronunciation
   */
  formatNumber: (num: number): string => {
    // Add commas for thousands
    return num.toLocaleString();
  },

  /**
   * Format dates for screen readers
   */
  formatDate: (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("pl-PL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  /**
   * Format time for screen readers
   */
  formatTime: (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  /**
   * Format duration in a human-readable way
   */
  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "godzina" : "godziny"}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minuta" : "minuty"}`);
    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? "sekunda" : "sekundy"}`);
    }

    return parts.join(", ");
  },

  /**
   * Format percentage for screen readers
   */
  formatPercentage: (value: number): string => {
    return `${value} procent`;
  },

  /**
   * Create descriptive text for UI states
   */
  describeState: (isActive: boolean, activeText: string, inactiveText: string): string => {
    return isActive ? activeText : inactiveText;
  },

  /**
   * Create loading announcement
   */
  loadingText: (operation?: string): string => {
    return operation ? `Ładowanie ${operation}` : "Ładowanie";
  },

  /**
   * Create success announcement
   */
  successText: (operation: string): string => {
    return `${operation} wykonane pomyślnie`;
  },

  /**
   * Create error announcement
   */
  errorText: (operation?: string): string => {
    return operation ? `Błąd podczas ${operation}` : "Wystąpił błąd";
  },
};

/**
 * ARIA attributes helpers
 */
export const ariaHelpers = {
  /**
   * Create describedby relationship
   */
  describedBy: (...ids: (string | undefined)[]): string | undefined => {
    const validIds = ids.filter((id): id is string => Boolean(id));
    return validIds.length > 0 ? validIds.join(" ") : undefined;
  },

  /**
   * Create labelledby relationship
   */
  labelledBy: (...ids: (string | undefined)[]): string | undefined => {
    const validIds = ids.filter((id): id is string => Boolean(id));
    return validIds.length > 0 ? validIds.join(" ") : undefined;
  },

  /**
   * Create expanded state
   */
  expanded: (isExpanded: boolean | undefined): boolean | undefined => {
    return typeof isExpanded === "boolean" ? isExpanded : undefined;
  },

  /**
   * Create pressed state
   */
  pressed: (isPressed: boolean | undefined): boolean | undefined => {
    return typeof isPressed === "boolean" ? isPressed : undefined;
  },

  /**
   * Create selected state
   */
  selected: (isSelected: boolean | undefined): boolean | undefined => {
    return typeof isSelected === "boolean" ? isSelected : undefined;
  },

  /**
   * Create live region attributes
   */
  live: (priority: "off" | "polite" | "assertive" = "polite") => ({
    "aria-live": priority,
    "aria-atomic": "true",
  }),

  /**
   * Create hidden state
   */
  hidden: (isHidden: boolean): { "aria-hidden": boolean } | Record<string, never> => {
    return isHidden ? { "aria-hidden": true } : {};
  },

  /**
   * Create busy state
   */
  busy: (isBusy: boolean): { "aria-busy": boolean } | Record<string, never> => {
    return isBusy ? { "aria-busy": true } : {};
  },
};

/**
 * Keyboard event utilities
 */
export const keyboardUtils = {
  /**
   * Check if event is an activation key (Enter or Space)
   */
  isActivationKey: (event: KeyboardEvent | React.KeyboardEvent): boolean => {
    return event.key === "Enter" || event.key === " ";
  },

  /**
   * Check if event is an escape key
   */
  isEscapeKey: (event: KeyboardEvent | React.KeyboardEvent): boolean => {
    return event.key === "Escape";
  },

  /**
   * Check if event is an arrow key
   */
  isArrowKey: (event: KeyboardEvent | React.KeyboardEvent): boolean => {
    return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key);
  },

  /**
   * Check if event is a tab key
   */
  isTabKey: (event: KeyboardEvent | React.KeyboardEvent): boolean => {
    return event.key === "Tab";
  },

  /**
   * Get navigation direction from arrow key
   */
  getNavigationDirection: (event: KeyboardEvent | React.KeyboardEvent): "up" | "down" | "left" | "right" | null => {
    switch (event.key) {
      case "ArrowUp":
        return "up";
      case "ArrowDown":
        return "down";
      case "ArrowLeft":
        return "left";
      case "ArrowRight":
        return "right";
      default:
        return null;
    }
  },
};

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Set focus to element with fallback
   */
  setFocus: (elementOrSelector: HTMLElement | string | null, fallback?: HTMLElement): void => {
    let element: HTMLElement | null = null;

    if (typeof elementOrSelector === "string") {
      element = document.querySelector(elementOrSelector);
    } else {
      element = elementOrSelector;
    }

    if (element && isElementVisible(element)) {
      element.focus();
    } else if (fallback && isElementVisible(fallback)) {
      fallback.focus();
    }
  },

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const selector = [
      'button:not([disabled]):not([aria-hidden="true"])',
      'input:not([disabled]):not([aria-hidden="true"])',
      'textarea:not([disabled]):not([aria-hidden="true"])',
      'select:not([disabled]):not([aria-hidden="true"])',
      'a[href]:not([aria-hidden="true"])',
      '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
      'audio[controls]:not([aria-hidden="true"])',
      'video[controls]:not([aria-hidden="true"])',
      '[contenteditable]:not([contenteditable="false"]):not([aria-hidden="true"])',
      'details > summary:not([aria-hidden="true"])',
    ].join(",");

    return Array.from(container.querySelectorAll(selector)).filter((element) =>
      isElementVisible(element as HTMLElement)
    ) as HTMLElement[];
  },

  /**
   * Get the next focusable element
   */
  getNextFocusableElement: (currentElement: HTMLElement, container?: HTMLElement): HTMLElement | null => {
    const focusableElements = focusUtils.getFocusableElements(container || document.body);
    const currentIndex = focusableElements.indexOf(currentElement);

    if (currentIndex === -1) return null;

    return focusableElements[currentIndex + 1] || null;
  },

  /**
   * Get the previous focusable element
   */
  getPreviousFocusableElement: (currentElement: HTMLElement, container?: HTMLElement): HTMLElement | null => {
    const focusableElements = focusUtils.getFocusableElements(container || document.body);
    const currentIndex = focusableElements.indexOf(currentElement);

    if (currentIndex === -1) return null;

    return focusableElements[currentIndex - 1] || null;
  },
};

/**
 * Color contrast utilities
 */
export const contrastUtils = {
  /**
   * Calculate luminance of a color
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
  ): number => {
    const lum1 = contrastUtils.getLuminance(color1.r, color1.g, color1.b);
    const lum2 = contrastUtils.getLuminance(color2.r, color2.g, color2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if contrast ratio meets WCAG standards
   */
  meetsWCAG: (ratio: number, level: "AA" | "AAA" = "AA", isLargeText = false): boolean => {
    if (level === "AA") {
      return isLargeText ? ratio >= 3 : ratio >= 4.5;
    } else {
      return isLargeText ? ratio >= 4.5 : ratio >= 7;
    }
  },
};

/**
 * Initialize accessibility features
 */
export function initializeAccessibility(): void {
  // Detect keyboard navigation
  detectKeyboardNavigation();

  // Add reduced motion class if user prefers it
  if (prefersReducedMotion()) {
    document.documentElement.classList.add("reduce-motion");
  }

  // Add high contrast class if user prefers it
  if (prefersHighContrast()) {
    document.documentElement.classList.add("high-contrast");
  }

  // Listen for preference changes
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
    document.documentElement.classList.toggle("reduce-motion", e.matches);
  });

  window.matchMedia("(prefers-contrast: high)").addEventListener("change", (e) => {
    document.documentElement.classList.toggle("high-contrast", e.matches);
  });
}

/**
 * Screen reader only CSS class
 */
export const srOnly = "sr-only";

/**
 * Screen reader only CSS that becomes visible when focused
 */
export const srOnlyFocusable = "sr-only focus:not-sr-only";

/**
 * Export all utilities as a single object
 */
export const a11y = {
  generateId: generateA11yId,
  isVisible: isElementVisible,
  prefersReducedMotion,
  prefersHighContrast,
  screenReader: screenReaderText,
  aria: ariaHelpers,
  keyboard: keyboardUtils,
  focus: focusUtils,
  contrast: contrastUtils,
  initialize: initializeAccessibility,
  classes: {
    srOnly,
    srOnlyFocusable,
  },
};
