import { validateElement, validateElements } from "../ui-elements";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PageValidationResult {
  valid: boolean;
  errors: Array<{
    page?: number;
    element?: number;
    errors: string[];
  }>;
}

/**
 * Validate a single page structure
 */
export function validatePage(page: any): ValidationResult {
  const errors: string[] = [];

  // Check page has required fields
  if (!page || typeof page !== "object") {
    return {
      valid: false,
      errors: ["Page must be an object"],
    };
  }

  // Validate page name
  if (!page.name || typeof page.name !== "string" || page.name.trim() === "") {
    errors.push("Page must have a non-empty name");
  }

  // Validate elements array
  if (!Array.isArray(page.elements)) {
    errors.push("Page must have an elements array");
  } else {
    // Validate each element
    const elementsValidation = validateElements(page.elements);
    if (!elementsValidation.valid) {
      elementsValidation.errors.forEach(({ index, errors: elementErrors }) => {
        errors.push(`Element ${index + 1}: ${elementErrors.join(", ")}`);
      });
    }
  }

  // Validate optional fields
  if (page.type && !["PAGE", "RESULT"].includes(page.type)) {
    errors.push("Page type must be either PAGE or RESULT");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete funnel structure
 */
export function validateFunnel(funnel: any): PageValidationResult {
  const allErrors: Array<{
    page?: number;
    element?: number;
    errors: string[];
  }> = [];

  // Check funnel structure
  if (!funnel || typeof funnel !== "object") {
    return {
      valid: false,
      errors: [{ errors: ["Funnel must be an object"] }],
    };
  }

  // Validate funnel name
  if (
    !funnel.funnelName ||
    typeof funnel.funnelName !== "string" ||
    funnel.funnelName.trim() === ""
  ) {
    allErrors.push({
      errors: ["Funnel must have a non-empty funnelName"],
    });
  }

  // Validate pages array
  if (!Array.isArray(funnel.pages)) {
    allErrors.push({
      errors: ["Funnel must have a pages array"],
    });
    return {
      valid: false,
      errors: allErrors,
    };
  }

  if (funnel.pages.length === 0) {
    allErrors.push({
      errors: ["Funnel must have at least one page"],
    });
    return {
      valid: false,
      errors: allErrors,
    };
  }

  // Validate each page
  funnel.pages.forEach((page: any, pageIndex: number) => {
    const pageValidation = validatePage(page);
    if (!pageValidation.valid) {
      allErrors.push({
        page: pageIndex + 1,
        errors: pageValidation.errors,
      });
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Filter out invalid faq-item elements from top-level
 * FAQ items should only exist as children of FAQ elements
 */
export function filterStandaloneFAQItems(elements: any[]): any[] {
  return elements.filter((element) => element.type !== "faq-item");
}

/**
 * Sanitize and fix common AI generation issues
 */
export function sanitizeElements(elements: any[]): any[] {
  // Filter out standalone faq-items
  let sanitized = filterStandaloneFAQItems(elements);

  // Ensure all elements have IDs
  sanitized = sanitized.map((element) => {
    if (!element.id) {
      element.id = `${element.type}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 7)}`;
    }
    return element;
  });

  // Recursively sanitize children
  sanitized = sanitized.map((element) => {
    if (element.children && Array.isArray(element.children)) {
      element.children = sanitizeElements(element.children);
    }
    return element;
  });

  return sanitized;
}

// Export validation functions from ui-elements
export { validateElement, validateElements };
