export type ThemeDevice = "desktop" | "tablet" | "mobile";
export type ThemeNiche =
  | "news"
  | "finance"
  | "technology"
  | "ai"
  | "business"
  | "education"
  | "health"
  | "science"
  | "fashion"
  | "beauty"
  | "cars"
  | "sports"
  | "travel"
  | "food"
  | "gaming"
  | "entertainment"
  | "real-estate"
  | "agriculture"
  | "lifestyle"
  | "general";
export type ThemeLayout =
  "editorial" | "magazine" | "grid" | "minimal" | "business" | "visual";
export type ThemeSectionType =
  "hero" | "featured" | "latest" | "trending" | "categories" | "newsletter" | "custom";
export type ThemeColourPalette = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;
};
export type ThemeTypography = {
  headingFont: string;
  bodyFont: string;
  headingWeight: number;
  bodyWeight: number;
};
export type ThemeSection = {
  id: string;
  type: ThemeSectionType;
  title: string;
  enabled: boolean;
  position: number;
  articleLimit: number;
};
export type ThemeConfiguration = {
  id: string;
  name: string;
  niche: ThemeNiche;
  layout: ThemeLayout;
  version: number;
  isActive: boolean;
  colours: ThemeColourPalette;
  typography: ThemeTypography;
  sections: ThemeSection[];
  navigation: string[];
  createdAt: string;
  updatedAt: string;
};
export type ThemeStore = {
  activeThemeId: string;
  themes: ThemeConfiguration[];
  backups: ThemeBackup[];
};
export type ThemeBackup = {
  id: string;
  name: string;
  createdAt: string;
  theme: ThemeConfiguration;
};
