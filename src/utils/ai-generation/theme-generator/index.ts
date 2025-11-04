/**
 * Theme Generation Utility
 * Generates theme colors with AI or uses user-provided colors
 */

import {
  generateContent,
  parseJSONFromResponse,
  GEMINI_MODELS,
} from "../gemini-client";

export interface ThemeColors {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderColor: string;
  optionColor: string;
}

export interface GenerateThemeOptions {
  primaryColor?: string;
  secondaryColor?: string;
  preferDarkBackground?: boolean;
  businessDescription: string;
  industry?: string;
}

/**
 * Generate a complete theme color palette
 * If primaryColor and secondaryColor are provided, derive other colors from them
 * Otherwise, use AI to generate niche-appropriate colors
 */
export async function generateTheme(
  options: GenerateThemeOptions
): Promise<ThemeColors> {
  const {
    primaryColor,
    secondaryColor,
    preferDarkBackground,
    businessDescription,
    industry,
  } = options;

  // Determine if background should be dark
  // Priority: 1) explicit preference, 2) infer from primary color, 3) default to dark
  let useDarkBackground =
    preferDarkBackground !== undefined
      ? preferDarkBackground
      : primaryColor
      ? shouldUseDarkBackground(primaryColor)
      : true;

  // If user provided both colors, derive theme from them
  if (primaryColor && secondaryColor) {
    return deriveThemeFromColors(
      primaryColor,
      secondaryColor,
      useDarkBackground
    );
  }

  // If only one color provided, use AI to generate complementary palette
  if (primaryColor || secondaryColor) {
    return await generateComplementaryTheme({
      baseColor: primaryColor || secondaryColor!,
      useDarkBackground,
      businessDescription,
      industry,
    });
  }

  // No colors provided - generate complete niche-appropriate theme with AI
  return await generateNicheTheme({
    businessDescription,
    industry,
    useDarkBackground,
  });
}

/**
 * Derive full theme palette from two user-provided colors
 */
function deriveThemeFromColors(
  primaryColor: string,
  secondaryColor: string,
  useDarkBackground: boolean
): ThemeColors {
  // Primary color as button color
  // Secondary color as border/accent color
  // Derive other colors using color theory

  if (useDarkBackground) {
    const backgroundColor = darkenColor(secondaryColor, 80);
    const textColor = lightenColor(primaryColor, 70);

    // Force good contrast if needed
    const ensuredTextColor = ensureTextContrast(backgroundColor, textColor);

    return {
      backgroundColor,
      textColor: ensuredTextColor,
      buttonColor: primaryColor,
      buttonTextColor: getContrastingColor(primaryColor),
      borderColor: secondaryColor,
      optionColor: darkenColor(secondaryColor, 30), // Darker version for options
    };
  } else {
    const backgroundColor = lightenColor(secondaryColor, 80);
    const textColor = darkenColor(primaryColor, 70);

    // Force good contrast if needed
    const ensuredTextColor = ensureTextContrast(backgroundColor, textColor);

    return {
      backgroundColor,
      textColor: ensuredTextColor,
      buttonColor: primaryColor,
      buttonTextColor: getContrastingColor(primaryColor),
      borderColor: secondaryColor,
      optionColor: lightenColor(secondaryColor, 30), // Lighter version for options
    };
  }
}

/**
 * Generate complementary theme using AI based on single color
 */
async function generateComplementaryTheme(options: {
  baseColor: string;
  useDarkBackground: boolean;
  businessDescription: string;
  industry?: string;
}): Promise<ThemeColors> {
  const backgroundPreference = options.useDarkBackground ? "dark" : "light";

  const prompt = `Given a base color ${
    options.baseColor
  }, generate a complementary color palette for a ${
    options.industry || "business"
  }: ${options.businessDescription}

Create a professional, conversion-optimized color scheme that:
1. Works well with the base color
2. Uses a ${backgroundPreference} background
3. Ensures EXCELLENT contrast and readability (WCAG AA compliant minimum 4.5:1 ratio)
4. Matches the business niche and industry
5. Follows modern design principles

CRITICAL CONTRAST RULES (MUST FOLLOW):
- If background is dark, text MUST be light (white, cream, light gray)
- If background is light, text MUST be dark (black, dark gray, navy)
- Button text MUST contrast strongly with button background
- NEVER use similar colors for background and text (e.g., black bg with dark gray text)
- Prioritize readability over aesthetics - ensure text is always clearly visible

Return ONLY a JSON object with these exact fields:
{
  "backgroundColor": "#RRGGBB",
  "textColor": "#RRGGBB",
  "buttonColor": "#RRGGBB",
  "buttonTextColor": "#RRGGBB",
  "borderColor": "#RRGGBB",
  "optionColor": "#RRGGBB"
}

The base color ${
    options.baseColor
  } should be used as either the button color or border color.
The background should be ${backgroundPreference}.
Ensure backgroundColor and textColor have strong contrast.`;

  try {
    const response = await generateContent(GEMINI_MODELS.PRO.name, prompt);

    const jsonString = parseJSONFromResponse(response.text);
    const colors = JSON.parse(jsonString);
    return validateAndNormalizeColors(colors);
  } catch (error) {
    // Fallback to algorithmic generation
    console.warn("AI theme generation failed, using fallback:", error);
    return deriveThemeFromColors(
      options.baseColor,
      options.baseColor,
      options.useDarkBackground
    );
  }
}

/**
 * Generate complete niche-appropriate theme using AI
 */
async function generateNicheTheme(options: {
  businessDescription: string;
  industry?: string;
  useDarkBackground: boolean;
}): Promise<ThemeColors> {
  const backgroundPreference = options.useDarkBackground ? "dark" : "light";

  const prompt = `Generate a professional, conversion-optimized color palette for: ${
    options.businessDescription
  }${options.industry ? `\nIndustry: ${options.industry}` : ""}

Create colors that:
1. Match the business niche and evoke the right emotions
2. Use a ${backgroundPreference} background
3. Ensure EXCELLENT contrast and accessibility (WCAG AA compliant minimum 4.5:1 ratio)
4. Follow modern design principles
5. Optimize for conversions

CRITICAL CONTRAST RULES (MUST FOLLOW):
- If background is dark, text MUST be light (white, cream, light gray, #FFFFFF, #F0F0F0, etc.)
- If background is light, text MUST be dark (black, dark gray, navy, #000000, #2C2C2C, etc.)
- Button text MUST contrast strongly with button background
- NEVER use similar colors for background and text
- Prioritize readability over aesthetics - ensure text is always clearly visible
- If generating a dark background (e.g., #1A1A1A), text MUST be light (e.g., #FFFFFF or #F5F5F5)
- If generating a light background (e.g., #FAFAFA), text MUST be dark (e.g., #000000 or #2C2C2C)

Return ONLY a JSON object with these exact fields:
{
  "backgroundColor": "#RRGGBB",
  "textColor": "#RRGGBB",
  "buttonColor": "#RRGGBB",
  "buttonTextColor": "#RRGGBB",
  "borderColor": "#RRGGBB",
  "optionColor": "#RRGGBB"
}

Examples of industry-appropriate colors:
- Health/Wellness: Greens, blues, natural tones
- Finance: Blues, grays, professional tones
- Tech: Blues, purples, modern tones
- Food: Reds, oranges, appetizing tones
- Luxury: Blacks, golds, elegant tones

The background should be ${backgroundPreference}.
Double-check: backgroundColor and textColor MUST have strong contrast.`;

  try {
    const response = await generateContent(GEMINI_MODELS.PRO.name, prompt);

    const jsonString = parseJSONFromResponse(response.text);
    const colors = JSON.parse(jsonString);
    return validateAndNormalizeColors(colors);
  } catch (error) {
    // Fallback to default theme
    console.warn("AI theme generation failed, using default theme:", error);
    return getDefaultTheme(options.useDarkBackground);
  }
}

/**
 * Validate and normalize AI-generated colors
 */
function validateAndNormalizeColors(colors: any): ThemeColors {
  const requiredFields: (keyof ThemeColors)[] = [
    "backgroundColor",
    "textColor",
    "buttonColor",
    "buttonTextColor",
    "borderColor",
    "optionColor",
  ];

  const normalized: any = {};

  for (const field of requiredFields) {
    const color = colors[field];
    if (!color || !isValidHexColor(color)) {
      // Fallback to default if invalid
      const defaults = getDefaultTheme();
      normalized[field] = defaults[field];
    } else {
      normalized[field] = normalizeHexColor(color);
    }
  }

  // Force contrast correction between background and text
  if (normalized.backgroundColor && normalized.textColor) {
    normalized.textColor = ensureTextContrast(
      normalized.backgroundColor,
      normalized.textColor
    );
  }

  // Force contrast for button text
  if (normalized.buttonColor && normalized.buttonTextColor) {
    normalized.buttonTextColor = getContrastingColor(normalized.buttonColor);
  }

  return normalized as ThemeColors;
}

/**
 * Check if valid hex color
 */
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Normalize hex color to uppercase with #
 */
function normalizeHexColor(color: string): string {
  if (!color.startsWith("#")) {
    color = "#" + color;
  }
  return color.toUpperCase();
}

/**
 * Default theme (green/professional)
 */
function getDefaultTheme(useDarkBackground: boolean = true): ThemeColors {
  if (useDarkBackground) {
    return {
      backgroundColor: "#0e1e12",
      textColor: "#d4ecd0",
      buttonColor: "#387e3d",
      buttonTextColor: "#e8f5e9",
      borderColor: "#214228",
      optionColor: "#16331b",
    };
  } else {
    return {
      backgroundColor: "#f5f9f5",
      textColor: "#1a3a1e",
      buttonColor: "#387e3d",
      buttonTextColor: "#ffffff",
      borderColor: "#c8e6c9",
      optionColor: "#e8f5e9",
    };
  }
}

/**
 * Determine if background should be dark based on primary color luminance
 */
function shouldUseDarkBackground(primaryColor: string): boolean {
  const num = parseInt(primaryColor.replace("#", ""), 16);
  const R = (num >> 16) & 0xff;
  const G = (num >> 8) & 0xff;
  const B = num & 0xff;

  // Calculate relative luminance
  const luminance = 0.299 * R + 0.587 * G + 0.114 * B;

  // If primary color is bright/light, use dark background for contrast
  // If primary color is dark, use light background
  return luminance > 128;
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return (
    "#" +
    (0x1000000 + R * 0x10000 + G * 0x100 + B)
      .toString(16)
      .slice(1)
      .toUpperCase()
  );
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min((num >> 16) + amt, 255);
  const G = Math.min(((num >> 8) & 0x00ff) + amt, 255);
  const B = Math.min((num & 0x0000ff) + amt, 255);
  return (
    "#" +
    (0x1000000 + R * 0x10000 + G * 0x100 + B)
      .toString(16)
      .slice(1)
      .toUpperCase()
  );
}

/**
 * Get contrasting color (white or black) based on background
 */
function getContrastingColor(hex: string): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const R = (num >> 16) & 0xff;
  const G = (num >> 8) & 0xff;
  const B = num & 0xff;

  // Calculate relative luminance
  const luminance = 0.299 * R + 0.587 * G + 0.114 * B;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 128 ? "#000000" : "#FFFFFF";
}

/**
 * Ensure text has proper contrast against background
 * If contrast is poor, force white or black text depending on background
 */
function ensureTextContrast(
  backgroundColor: string,
  textColor: string
): string {
  const bgLuminance = getColorLuminance(backgroundColor);
  const textLuminance = getColorLuminance(textColor);

  // Calculate contrast ratio
  const contrastRatio =
    bgLuminance > textLuminance
      ? (bgLuminance + 0.05) / (textLuminance + 0.05)
      : (textLuminance + 0.05) / (bgLuminance + 0.05);

  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  // We'll use 4.5:1 as minimum
  if (contrastRatio < 4.5) {
    // Poor contrast - force contrasting color
    return getContrastingColor(backgroundColor);
  }

  return textColor;
}

/**
 * Calculate relative luminance of a color (for WCAG contrast calculations)
 */
function getColorLuminance(hex: string): number {
  const num = parseInt(hex.replace("#", ""), 16);
  let R = (num >> 16) & 0xff;
  let G = (num >> 8) & 0xff;
  let B = num & 0xff;

  // Convert to sRGB
  R = R / 255;
  G = G / 255;
  B = B / 255;

  // Apply gamma correction
  R = R <= 0.03928 ? R / 12.92 : Math.pow((R + 0.055) / 1.055, 2.4);
  G = G <= 0.03928 ? G / 12.92 : Math.pow((G + 0.055) / 1.055, 2.4);
  B = B <= 0.03928 ? B / 12.92 : Math.pow((B + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
