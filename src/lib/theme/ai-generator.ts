import type {
  ThemeColourPalette,
  ThemeConfiguration,
  ThemeLayout,
  ThemeSection,
  ThemeSectionType,
  ThemeTypography,
} from "@/lib/theme/types";
const allowedLayouts: ThemeLayout[] = [
  "editorial",
  "magazine",
  "grid",
  "minimal",
  "business",
  "visual",
];
const allowedSectionTypes: ThemeSectionType[] = [
  "hero",
  "featured",
  "latest",
  "trending",
  "categories",
  "newsletter",
  "custom",
];
const hexColourPattern = /^#[0-9a-f]{6}$/i;
type GeneratedThemeResult = {
  name: string;
  layout: ThemeLayout;
  colours: ThemeColourPalette;
  typography: ThemeTypography;
  sections: Array<{
    type: ThemeSectionType;
    title: string;
    enabled: boolean;
    articleLimit: number;
  }>;
  navigation: string[];
};
type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};
function extractOutputText(response: OpenAiResponse): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }
  for (const outputItem of response.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string" &&
        contentItem.text.trim()
      ) {
        return contentItem.text;
      }
    }
  }
  throw new Error("AI provider ne valid theme response return nahi kiya.");
}
function validateHexColour(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !hexColourPattern.test(value)) {
    throw new Error(`AI theme mein ${fieldName} colour invalid hai.`);
  }
  return value.toLowerCase();
}
function validateWeight(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(900, Math.max(300, Math.round(value / 100) * 100));
}
function createSectionId(
  type: ThemeSectionType,
  index: number,
  generatedAt: number,
): string {
  return `${type}-${generatedAt}-${index + 1}`;
}
function validateGeneratedTheme(
  value: unknown,
  baseTheme: ThemeConfiguration,
): GeneratedThemeResult {
  if (!value || typeof value !== "object") {
    throw new Error("AI theme response invalid hai.");
  }
  const generated = value as Partial<GeneratedThemeResult>;
  if (
    typeof generated.name !== "string" ||
    generated.name.trim().length < 3
  ) {
    throw new Error("AI theme name invalid hai.");
  }
  if (
    typeof generated.layout !== "string" ||
    !allowedLayouts.includes(generated.layout as ThemeLayout)
  ) {
    throw new Error("AI theme layout invalid hai.");
  }
  if (!generated.colours || typeof generated.colours !== "object") {
    throw new Error("AI colour palette invalid hai.");
  }
  if (!generated.typography || typeof generated.typography !== "object") {
    throw new Error("AI typography invalid hai.");
  }
  const typography = generated.typography as Partial<ThemeTypography>;
  const headingFont =
    typeof typography.headingFont === "string" &&
    typography.headingFont.trim()
      ? typography.headingFont.trim()
      : baseTheme.typography.headingFont;
  const bodyFont =
    typeof typography.bodyFont === "string" &&
    typography.bodyFont.trim()
      ? typography.bodyFont.trim()
      : baseTheme.typography.bodyFont;
  const rawSections = Array.isArray(generated.sections)
    ? generated.sections
    : [];
  if (rawSections.length < 3) {
    throw new Error("AI theme mein kam az kam 3 sections honay chahiye.");
  }
  const sections = rawSections.slice(0, 8).map((section) => {
    if (!section || typeof section !== "object") {
      throw new Error("AI theme section invalid hai.");
    }
    const candidate = section as Partial<GeneratedThemeResult["sections"][number]>;
    if (
      typeof candidate.type !== "string" ||
      !allowedSectionTypes.includes(candidate.type as ThemeSectionType)
    ) {
      throw new Error("AI theme section type invalid hai.");
    }
    return {
      type: candidate.type as ThemeSectionType,
      title:
        typeof candidate.title === "string" && candidate.title.trim()
          ? candidate.title.trim().slice(0, 80)
          : "Untitled Section",
      enabled: candidate.enabled !== false,
      articleLimit:
        typeof candidate.articleLimit === "number"
          ? Math.min(24, Math.max(1, Math.round(candidate.articleLimit)))
          : 6,
    };
  });
  const navigation = Array.isArray(generated.navigation)
    ? Array.from(
        new Set(
          generated.navigation
            .filter(
              (item): item is string =>
                typeof item === "string" && Boolean(item.trim()),
            )
            .map((item) => item.trim().slice(0, 40)),
        ),
      ).slice(0, 10)
    : baseTheme.navigation;
  return {
    name: generated.name.trim().slice(0, 80),
    layout: generated.layout as ThemeLayout,
    colours: {
      background: validateHexColour(
        generated.colours.background,
        "background",
      ),
      foreground: validateHexColour(
        generated.colours.foreground,
        "foreground",
      ),
      primary: validateHexColour(generated.colours.primary, "primary"),
      secondary: validateHexColour(
        generated.colours.secondary,
        "secondary",
      ),
      accent: validateHexColour(generated.colours.accent, "accent"),
      muted: validateHexColour(generated.colours.muted, "muted"),
      border: validateHexColour(generated.colours.border, "border"),
    },
    typography: {
      headingFont,
      bodyFont,
      headingWeight: validateWeight(
        typography.headingWeight,
        baseTheme.typography.headingWeight,
      ),
      bodyWeight: validateWeight(
        typography.bodyWeight,
        baseTheme.typography.bodyWeight,
      ),
    },
    sections,
    navigation,
  };
}
export async function generateThemeConfiguration(
  baseTheme: ThemeConfiguration,
  prompt: string,
): Promise<ThemeConfiguration> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY .env.local file mein configure nahi hai.",
    );
  }
  const cleanPrompt = prompt.trim();
  if (cleanPrompt.length < 10) {
    throw new Error("AI theme prompt kam az kam 10 characters ka hona chahiye.");
  }
  if (cleanPrompt.length > 2_000) {
    throw new Error("AI theme prompt 2000 characters se zyada nahi ho sakta.");
  }
  const model = process.env.OPENAI_THEME_MODEL?.trim() || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions:
        "You are a senior publication website designer. Create a unique, accessible, production-ready theme. Return only data matching the supplied JSON schema. Use valid six-digit hexadecimal colours with strong contrast. Do not copy brand names or existing websites.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Publication niche: ${baseTheme.niche}`,
                `Current layout: ${baseTheme.layout}`,
                `Current theme name: ${baseTheme.name}`,
                `Requested design: ${cleanPrompt}`,
                "Create a distinct theme name, balanced colour palette, typography, homepage section plan, and navigation labels.",
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "knowledge_nest_theme",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "name",
              "layout",
              "colours",
              "typography",
              "sections",
              "navigation",
            ],
            properties: {
              name: {
                type: "string",
              },
              layout: {
                type: "string",
                enum: allowedLayouts,
              },
              colours: {
                type: "object",
                additionalProperties: false,
                required: [
                  "background",
                  "foreground",
                  "primary",
                  "secondary",
                  "accent",
                  "muted",
                  "border",
                ],
                properties: {
                  background: {
                    type: "string",
                  },
                  foreground: {
                    type: "string",
                  },
                  primary: {
                    type: "string",
                  },
                  secondary: {
                    type: "string",
                  },
                  accent: {
                    type: "string",
                  },
                  muted: {
                    type: "string",
                  },
                  border: {
                    type: "string",
                  },
                },
              },
              typography: {
                type: "object",
                additionalProperties: false,
                required: [
                  "headingFont",
                  "bodyFont",
                  "headingWeight",
                  "bodyWeight",
                ],
                properties: {
                  headingFont: {
                    type: "string",
                  },
                  bodyFont: {
                    type: "string",
                  },
                  headingWeight: {
                    type: "number",
                  },
                  bodyWeight: {
                    type: "number",
                  },
                },
              },
              sections: {
                type: "array",
                minItems: 3,
                maxItems: 8,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "type",
                    "title",
                    "enabled",
                    "articleLimit",
                  ],
                  properties: {
                    type: {
                      type: "string",
                      enum: allowedSectionTypes,
                    },
                    title: {
                      type: "string",
                    },
                    enabled: {
                      type: "boolean",
                    },
                    articleLimit: {
                      type: "number",
                    },
                  },
                },
              },
              navigation: {
                type: "array",
                minItems: 3,
                maxItems: 10,
                items: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    }),
    cache: "no-store",
  });
  const responseData = (await response.json()) as OpenAiResponse;
  if (!response.ok) {
    throw new Error(
      responseData.error?.message ||
        `AI provider request fail ho gayi. Status: ${response.status}`,
    );
  }
  const outputText = extractOutputText(responseData);
  let parsedOutput: unknown;
  try {
    parsedOutput = JSON.parse(outputText);
  } catch {
    throw new Error("AI provider ne invalid JSON return kiya.");
  }
  const generated = validateGeneratedTheme(parsedOutput, baseTheme);
  const generatedTimestamp = Date.now();
  const generatedAt = new Date(generatedTimestamp).toISOString();
  const sections: ThemeSection[] = generated.sections.map(
    (section, index) => ({
      id: createSectionId(section.type, index, generatedTimestamp),
      type: section.type,
      title: section.title,
      enabled: section.enabled,
      position: index + 1,
      articleLimit: section.articleLimit,
    }),
  );
  return {
    ...structuredClone(baseTheme),
    id: `${baseTheme.niche}-ai-${generatedTimestamp}`,
    name: generated.name,
    layout: generated.layout,
    colours: generated.colours,
    typography: generated.typography,
    sections,
    navigation: generated.navigation,
    version: Math.max(baseTheme.version + 1, 1),
    isActive: false,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };
}