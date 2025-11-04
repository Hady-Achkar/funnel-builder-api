export function autoFixEnumValues(elements: any[]): any[] {
  return elements.map((element) => {
    const fixedElement = { ...element };

    // Fix element type: MUST BE lowercase with hyphens (e.g., "media-with-text", "comparison-chart")
    if (fixedElement.type && typeof fixedElement.type === "string") {
      fixedElement.type = fixedElement.type.toLowerCase();
    }

    // Fix props enums - handle missing, null, invalid types with defaults
    if (fixedElement.props && typeof fixedElement.props === "object") {
      const props = { ...fixedElement.props };

      // Fix borderRadius: MUST BE UPPERCASE (NONE, SOFT, ROUNDED)
      // Default to SOFT if missing/invalid
      if (
        !props.borderRadius ||
        typeof props.borderRadius !== "string" ||
        props.borderRadius.trim() === ""
      ) {
        props.borderRadius = "SOFT";
      } else {
        const normalized = props.borderRadius.toUpperCase();
        // Validate it's a valid option, default if not
        if (!["NONE", "SOFT", "ROUNDED"].includes(normalized)) {
          props.borderRadius = "SOFT";
        } else {
          props.borderRadius = normalized;
        }
      }

      // Fix size: MUST BE lowercase (sm, md, lg, xl)
      // Default to md if missing/invalid
      if (
        !props.size ||
        typeof props.size !== "string" ||
        props.size.trim() === ""
      ) {
        props.size = "md";
      } else {
        const normalized = props.size.toLowerCase();
        // Validate it's a valid option, default if not
        if (!["sm", "md", "lg", "xl"].includes(normalized)) {
          props.size = "md";
        } else {
          props.size = normalized;
        }
      }

      // Fix align: MUST BE lowercase (left, center, right)
      // Default to left if missing/invalid
      if (
        !props.align ||
        typeof props.align !== "string" ||
        props.align.trim() === ""
      ) {
        props.align = "left";
      } else {
        const normalized = props.align.toLowerCase();
        // Validate it's a valid option, default if not
        if (!["left", "center", "right"].includes(normalized)) {
          props.align = "left";
        } else {
          props.align = normalized;
        }
      }

      // Fix borderStyle: MUST BE lowercase (none, solid, dashed, dotted)
      // Default to solid if missing/invalid
      if (
        !props.borderStyle ||
        typeof props.borderStyle !== "string" ||
        props.borderStyle.trim() === ""
      ) {
        props.borderStyle = "solid";
      } else {
        const normalized = props.borderStyle.toLowerCase();
        // Validate it's a valid option, default if not
        if (!["none", "solid", "dashed", "dotted"].includes(normalized)) {
          props.borderStyle = "solid";
        } else {
          props.borderStyle = normalized;
        }
      }

      // Fix mediaType: MUST BE lowercase (image, emoji, icon, video)
      // Default to image if missing/invalid
      if (
        !props.mediaType ||
        typeof props.mediaType !== "string" ||
        props.mediaType.trim() === ""
      ) {
        props.mediaType = "image";
      } else {
        const normalized = props.mediaType.toLowerCase();
        // Validate it's a valid option, default if not
        if (!["image", "emoji", "icon", "video"].includes(normalized)) {
          props.mediaType = "image";
        } else {
          props.mediaType = normalized;
        }
      }

      // Fix shape: MUST BE lowercase (landscape, portrait, round, auto)
      // Default to auto if missing/invalid
      if (
        !props.shape ||
        typeof props.shape !== "string" ||
        props.shape.trim() === ""
      ) {
        props.shape = "auto";
      } else {
        const normalized = props.shape.toLowerCase();
        // Validate it's a valid option, default if not
        if (!["landscape", "portrait", "round", "auto"].includes(normalized)) {
          props.shape = "auto";
        } else {
          props.shape = normalized;
        }
      }

      // Fix checkboxShape: MUST BE lowercase (square, circle)
      // Default to square if missing/invalid
      if (props.checkboxShape !== undefined) {
        if (
          !props.checkboxShape ||
          typeof props.checkboxShape !== "string" ||
          props.checkboxShape.trim() === ""
        ) {
          props.checkboxShape = "square";
        } else {
          const normalized = props.checkboxShape.toLowerCase();
          // Validate it's a valid option, default if not
          if (!["square", "circle"].includes(normalized)) {
            props.checkboxShape = "square";
          } else {
            props.checkboxShape = normalized;
          }
        }
      }

      // Fix format boolean values (ensure they are actual booleans, not strings)
      if (props.format && typeof props.format === "object") {
        const format = { ...props.format };
        if (typeof format.bold === "string")
          format.bold = format.bold === "true";
        if (typeof format.italic === "string")
          format.italic = format.italic === "true";
        if (typeof format.underline === "string")
          format.underline = format.underline === "true";
        if (typeof format.strikethrough === "string")
          format.strikethrough = format.strikethrough === "true";
        props.format = format;
      }

      fixedElement.props = props;
    }

    // Fix link object - add default if missing, fix enums if present
    if (!fixedElement.link) {
      // Add default link object if missing (required by schema)
      fixedElement.link = {
        enabled: false,
        href: "",
        target: "_self",
        type: "internal",
      };
    } else if (typeof fixedElement.link === "object") {
      const link = { ...fixedElement.link };

      // Fix target: MUST BE lowercase (_self, _blank)
      // Default to _self if missing/invalid
      if (
        !link.target ||
        typeof link.target !== "string" ||
        link.target.trim() === ""
      ) {
        link.target = "_self";
      } else {
        const normalized = link.target.toLowerCase();
        // Validate it's a valid option, default if not
        if (!["_self", "_blank"].includes(normalized)) {
          link.target = "_self";
        } else {
          link.target = normalized;
        }
      }

      // Fix type: MUST BE lowercase (internal, external)
      // Default to internal if missing/invalid
      if (
        !link.type ||
        typeof link.type !== "string" ||
        link.type.trim() === ""
      ) {
        link.type = "internal";
      } else {
        const normalized = link.type.toLowerCase();
        // Validate it's a valid option, default if not
        if (!["internal", "external"].includes(normalized)) {
          link.type = "internal";
        } else {
          link.type = normalized;
        }
      }

      // Ensure enabled is boolean
      if (typeof link.enabled === "string") {
        link.enabled = link.enabled === "true";
      } else if (typeof link.enabled !== "boolean") {
        link.enabled = false;
      }

      // Ensure href exists
      if (!link.href || typeof link.href !== "string") {
        link.href = "";
      }

      fixedElement.link = link;
    }

    // Fix badge enums
    if (fixedElement.badge && typeof fixedElement.badge === "object") {
      const badge = { ...fixedElement.badge };

      // Ensure enabled is boolean
      if (typeof badge.enabled === "string") {
        badge.enabled = badge.enabled === "true";
      }

      fixedElement.badge = badge;
    }

    // Fix content object booleans
    if (fixedElement.content && typeof fixedElement.content === "object") {
      const content = { ...fixedElement.content };

      // For quiz elements
      if (typeof content.allowMultiple === "string") {
        content.allowMultiple = content.allowMultiple === "true";
      }
      if (typeof content.showResults === "string") {
        content.showResults = content.showResults === "true";
      }

      // For form elements
      if (typeof content.required === "string") {
        content.required = content.required === "true";
      }

      fixedElement.content = content;
    }

    // Fix integration object booleans (for forms)
    if (
      fixedElement.integration &&
      typeof fixedElement.integration === "object"
    ) {
      const integration = { ...fixedElement.integration };

      if (typeof integration.webhookEnabled === "string") {
        integration.webhookEnabled = integration.webhookEnabled === "true";
      }

      fixedElement.integration = integration;
    }

    // Recursively fix children
    if (fixedElement.children && Array.isArray(fixedElement.children)) {
      fixedElement.children = autoFixEnumValues(fixedElement.children);
    }

    return fixedElement;
  });
}
