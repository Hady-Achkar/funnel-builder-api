import { TextElementDefinition } from "./essentials/text.element";
import { ButtonElementDefinition } from "./essentials/button.element";
import { DividerElementDefinition } from "./essentials/divider.element";

import { ImageElementDefinition } from "./visuals/image.element";
import { VideoElementDefinition } from "./visuals/video.element";
import { IconElementDefinition } from "./visuals/icon.element";
import { MediaElementDefinition } from "./visuals/media.element";
import { MediaWithTextElementDefinition } from "./visuals/media-with-text.element";

import { FormElementDefinition } from "./interactive/form.element";
import { FormInputElementDefinition } from "./interactive/form-input.element";
import { FormMessageElementDefinition } from "./interactive/form-message.element";
import { FormPhoneNumberElementDefinition } from "./interactive/form-phonenumber.element";
import { FormCheckboxElementDefinition } from "./interactive/form-checkbox.element";
import { FormSelectElementDefinition } from "./interactive/form-select.element";
import { FormDatePickerElementDefinition } from "./interactive/form-datepicker.element";
import { FormNumberInputElementDefinition } from "./interactive/form-number.element";
import { QuizElementDefinition } from "./interactive/quiz.element";
import { AnswerElementDefinition } from "./interactive/answer.element";
import { WebinarElementDefinition } from "./interactive/webinar.element";

import { FAQElementDefinition } from "./informative/faq.element";
import { FAQItemElementDefinition } from "./informative/faq-item.element";
import { ComparisonChartElementDefinition } from "./informative/comparison-chart.element";

import { EmbedElementDefinition } from "./embed/embed.element";

import { ElementDefinition } from "./types";

/**
 * Element Registry - Maps element type to definition
 */
export const ELEMENT_REGISTRY: Record<string, ElementDefinition> = {
  // Essentials
  text: TextElementDefinition,
  button: ButtonElementDefinition,
  divider: DividerElementDefinition,

  // Visuals
  image: ImageElementDefinition,
  video: VideoElementDefinition,
  icon: IconElementDefinition,
  media: MediaElementDefinition,
  "media-with-text": MediaWithTextElementDefinition,

  // Interactive / Forms
  form: FormElementDefinition,
  "form-input": FormInputElementDefinition,
  "form-message": FormMessageElementDefinition,
  "form-phonenumber": FormPhoneNumberElementDefinition,
  "form-checkbox": FormCheckboxElementDefinition,
  "form-select": FormSelectElementDefinition,
  "form-datepicker": FormDatePickerElementDefinition,
  "form-number": FormNumberInputElementDefinition,

  // Quizzes
  quiz: QuizElementDefinition,
  answer: AnswerElementDefinition,

  // Webinar
  webinar: WebinarElementDefinition,

  // Informative
  faq: FAQElementDefinition,
  "faq-item": FAQItemElementDefinition,
  "comparison-chart": ComparisonChartElementDefinition,

  // Embed
  embed: EmbedElementDefinition,
};

/**
 * Get all element definitions as an array
 */
export function getAllElementDefinitions(): ElementDefinition[] {
  return Object.values(ELEMENT_REGISTRY);
}

/**
 * Get a specific element definition by type
 */
export function getElementDefinition(
  type: string
): ElementDefinition | undefined {
  return ELEMENT_REGISTRY[type];
}

/**
 * Validate an element against its schema
 */
export function validateElement(element: any): {
  valid: boolean;
  errors: string[];
} {
  if (!element || typeof element !== "object") {
    return {
      valid: false,
      errors: ["Element must be an object"],
    };
  }

  const { type } = element;
  if (!type || typeof type !== "string") {
    return {
      valid: false,
      errors: ["Element must have a type field"],
    };
  }

  const definition = getElementDefinition(type);
  if (!definition) {
    return {
      valid: false,
      errors: [`Unknown element type: ${type}`],
    };
  }

  const result = definition.zodSchema.safeParse(element);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      }),
    };
  }

  return {
    valid: true,
    errors: [],
  };
}

/**
 * Validate an array of elements
 */
export function validateElements(elements: any[]): {
  valid: boolean;
  errors: Array<{ index: number; errors: string[] }>;
} {
  if (!Array.isArray(elements)) {
    return {
      valid: false,
      errors: [{ index: -1, errors: ["Elements must be an array"] }],
    };
  }

  const allErrors: Array<{ index: number; errors: string[] }> = [];

  elements.forEach((element, index) => {
    const validation = validateElement(element);
    if (!validation.valid) {
      allErrors.push({
        index,
        errors: validation.errors,
      });
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Check if an element type exists in the registry
 */
export function isValidElementType(type: string): boolean {
  return type in ELEMENT_REGISTRY;
}

/**
 * Get element types by category
 */
export function getElementsByCategory(
  category: ElementDefinition["category"]
): ElementDefinition[] {
  return getAllElementDefinitions().filter((def) => def.category === category);
}

/**
 * Get all element types (just the type strings)
 */
export function getAllElementTypes(): string[] {
  return Object.keys(ELEMENT_REGISTRY);
}

// Export types and schemas
export * from "./types";
