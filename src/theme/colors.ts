/**
 * Mirrors the web app's exact CSS custom properties (src/index.css,
 * :root block) converted to hex -- same brand colors, not an
 * approximation, so the mobile app and the website genuinely look like
 * one product rather than two different apps that happen to share a
 * name.
 */
export const colors = {
  green950: "#08251C",
  green900: "#0B3D2E",
  green800: "#0F4D3A",
  green700: "#146349",

  gold100: "#F6ECD4",
  gold400: "#E0B657",
  gold500: "#CF9D3F",
  gold600: "#B9862F",

  cream: "#FAF6EC",
  cream2: "#F3ECDB",

  surface: "#FFFFFF",
  surface2: "#F7F3E8",

  line: "#E7DED0",

  ink: "#173225",
  inkSoft: "#4D6157",

  white: "#FFFFFF",
  red600: "#DC2626",
  emerald600: "#059669",
} as const;

export const fonts = {
  display: "CormorantGaramond_700Bold",
  displayRegular: "CormorantGaramond_400Regular",
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodyBold: "Manrope_700Bold",
  bodyExtraBold: "Manrope_800ExtraBold",
} as const;
