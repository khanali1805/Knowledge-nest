import { getActiveTheme } from "@/lib/theme/theme-store";
export async function ActiveThemeStyle() {
  const theme = await getActiveTheme();
  const css = `
    :root {
      --theme-background: ${theme.colours.background};
      --theme-foreground: ${theme.colours.foreground};
      --theme-primary: ${theme.colours.primary};
      --theme-secondary: ${theme.colours.secondary};
      --theme-accent: ${theme.colours.accent};
      --theme-muted: ${theme.colours.muted};
      --theme-border: ${theme.colours.border};
      --theme-heading-font: "${theme.typography.headingFont}";
      --theme-body-font: "${theme.typography.bodyFont}";
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
