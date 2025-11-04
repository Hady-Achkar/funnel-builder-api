/**
 * Style Sanitization Utility
 * Sanitize element styles to prevent layout issues
 */

/**
 * Sanitize element styles to prevent layout issues
 * Removes animation, margin, width, height, and other potentially problematic CSS properties
 */
export function sanitizeElementStyles(elements: any[]): any[] {
  const UNSAFE_STYLE_PROPERTIES = [
    "animation",
    "animationName",
    "animationDuration",
    "animationDelay",
    "animationTimingFunction",
    "transform",
    "transition",
    "margin",
    "marginTop",
    "marginBottom",
    "marginLeft",
    "marginRight",
    "width",
    "height",
    "maxWidth",
    "maxHeight",
    "minWidth",
    "minHeight",
    "position",
    "top",
    "left",
    "right",
    "bottom",
    "zIndex",
    "overflow",
    "overflowX",
    "overflowY",
  ];

  return elements.map((element) => {
    const sanitizedElement = { ...element };

    // Remove unsafe style properties
    if (
      sanitizedElement.styles &&
      typeof sanitizedElement.styles === "object"
    ) {
      const cleanedStyles: any = {};
      Object.keys(sanitizedElement.styles).forEach((key) => {
        if (!UNSAFE_STYLE_PROPERTIES.includes(key)) {
          cleanedStyles[key] = sanitizedElement.styles[key];
        }
      });
      sanitizedElement.styles = cleanedStyles;
    }

    // Recursively sanitize children
    if (sanitizedElement.children && Array.isArray(sanitizedElement.children)) {
      sanitizedElement.children = sanitizeElementStyles(
        sanitizedElement.children
      );
    }

    return sanitizedElement;
  });
}
