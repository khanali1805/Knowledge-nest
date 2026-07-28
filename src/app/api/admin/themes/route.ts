import { NextResponse } from "next/server";
import { createThemeFromNiche } from "@/lib/theme/presets";
import {
  activateTheme,
  createThemeBackup,
  deleteTheme,
  readThemeStore,
  restoreThemeBackup,
  saveTheme,
} from "@/lib/theme/theme-store";
import type { ThemeConfiguration, ThemeNiche } from "@/lib/theme/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type ThemeRequest =
  | {
      action: "create";
      niche: ThemeNiche;
      name?: string;
    }
  | {
      action: "save";
      theme: ThemeConfiguration;
    }
  | {
      action: "activate";
      themeId: string;
    }
  | {
      action: "delete";
      themeId: string;
    }
  | {
      action: "backup";
      themeId: string;
      name?: string;
    }
  | {
      action: "restore";
      backupId: string;
    }
  | {
      action: "import";
      theme: ThemeConfiguration;
    };
export async function GET() {
  try {
    const store = await readThemeStore();
    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to load theme settings.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ThemeRequest;
    switch (body.action) {
      case "create": {
        const theme = createThemeFromNiche(body.niche, body.name);
        const savedTheme = await saveTheme(theme);
        return NextResponse.json(
          {
            theme: savedTheme,
          },
          {
            status: 201,
          },
        );
      }
      case "save": {
        const theme = await saveTheme(body.theme);
        return NextResponse.json({
          theme,
        });
      }
      case "activate": {
        const theme = await activateTheme(body.themeId);
        return NextResponse.json({
          theme,
        });
      }
      case "delete": {
        await deleteTheme(body.themeId);
        return NextResponse.json({
          message: "Theme deleted successfully.",
        });
      }
      case "backup": {
        const backup = await createThemeBackup(body.themeId, body.name);
        return NextResponse.json(
          {
            backup,
          },
          {
            status: 201,
          },
        );
      }
      case "restore": {
        const theme = await restoreThemeBackup(body.backupId);
        return NextResponse.json(
          {
            theme,
          },
          {
            status: 201,
          },
        );
      }
      case "import": {
        const importedTheme: ThemeConfiguration = {
          ...body.theme,
          id: `${body.theme.niche}-imported-${Date.now()}`,
          name: `${body.theme.name} Imported`,
          isActive: false,
          version: Math.max(body.theme.version ?? 1, 1),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const theme = await saveTheme(importedTheme);
        return NextResponse.json(
          {
            theme,
          },
          {
            status: 201,
          },
        );
      }
      default:
        return NextResponse.json(
          {
            message: "Unsupported theme action.",
          },
          {
            status: 400,
          },
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to update theme settings.",
      },
      {
        status: 400,
      },
    );
  }
}
