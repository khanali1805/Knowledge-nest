import fs from "node:fs";
import path from "node:path";
import process from "node:process";
const projectRoot = process.cwd();
const failures = [];
const passes = [];
const warnings = [];
function normalisePath(value) {
  return value.split(path.sep).join("/");
}
function pass(message) {
  passes.push(message);
  console.log(`[PASS] ${message}`);
}
function fail(message) {
  failures.push(message);
  console.error(`[FAIL] ${message}`);
}
function warn(message) {
  warnings.push(message);
  console.warn(`[WARN] ${message}`);
}
function absolute(relativePath) {
  return path.join(projectRoot, relativePath);
}
function fileExists(relativePath) {
  return fs.existsSync(
    absolute(relativePath),
  );
}
function readText(relativePath) {
  return fs.readFileSync(
    absolute(relativePath),
    "utf8",
  );
}
function requireFile(relativePath) {
  if (!fileExists(relativePath)) {
    fail(`Required file missing: ${relativePath}`);
    return false;
  }
  const stats =
    fs.statSync(
      absolute(relativePath),
    );
  if (!stats.isFile()) {
    fail(`Required path file nahi hai: ${relativePath}`);
    return false;
  }
  if (stats.size === 0) {
    fail(`Required file empty hai: ${relativePath}`);
    return false;
  }
  pass(`Required file verified: ${relativePath}`);
  return true;
}
function requireDirectory(relativePath) {
  if (!fileExists(relativePath)) {
    fail(`Required directory missing: ${relativePath}`);
    return false;
  }
  if (
    !fs.statSync(
      absolute(relativePath),
    ).isDirectory()
  ) {
    fail(`Required directory invalid hai: ${relativePath}`);
    return false;
  }
  pass(`Required directory verified: ${relativePath}`);
  return true;
}
function requirePatterns(
  relativePath,
  patterns,
) {
  if (!requireFile(relativePath)) {
    return;
  }
  const content =
    readText(relativePath);
  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      fail(
        `${relativePath} mein required pattern missing: ${pattern}`,
      );
    } else {
      pass(
        `${relativePath} pattern verified: ${pattern}`,
      );
    }
  }
}
function walkFiles(
  directory,
  output = [],
) {
  if (!fs.existsSync(directory)) {
    return output;
  }
  for (
    const directoryEntry
    of fs.readdirSync(
      directory,
      {
        withFileTypes: true,
      },
    )
  ) {
    const fullPath =
      path.join(
        directory,
        directoryEntry.name,
      );
    if (
      directoryEntry.name ===
        "node_modules" ||
      directoryEntry.name ===
        ".next" ||
      directoryEntry.name ===
        ".git" ||
      directoryEntry.name ===
        "backups" ||
      directoryEntry.name ===
        "reports" ||
      directoryEntry.name ===
        "logs"
    ) {
      continue;
    }
    if (directoryEntry.isDirectory()) {
      walkFiles(
        fullPath,
        output,
      );
    } else {
      output.push(fullPath);
    }
  }
  return output;
}
const requiredFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "next.config.ts",
  "tsconfig.json",
  "eslint.config.mjs",
  "drizzle.config.ts",
  "src/proxy.ts",
  "src/db/index.ts",
  "src/db/schema/index.ts",
  "src/lib/admin-auth.ts",
  "src/lib/article-notification-store.ts",
  "src/lib/notification-delivery-store.ts",
  "src/lib/notification-scheduler.ts",
  "src/app/api/health/route.ts",
  "src/app/api/admin/notification-scheduler/route.ts",
  "src/app/api/admin/notification-deliveries/route.ts",
  "src/app/api/admin/notification-preferences/route.ts",
  "src/app/api/admin/notifications/route.ts",
  "src/app/api/admin/audit-retention/route.ts",
  "src/components/admin/admin-notification-center.tsx",
  "src/components/admin/notification-delivery-center.tsx",
  "src/app/admin/notifications/page.tsx",
];
for (const requiredFile of requiredFiles) {
  requireFile(requiredFile);
}
requireDirectory("drizzle");
requireDirectory("src/app");
requireDirectory("src/lib");
requireDirectory("src/db/schema");
requirePatterns(
  "next.config.ts",
  [
    "poweredByHeader: false",
    "compress: true",
    "reactStrictMode: true",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "X-Robots-Tag",
    "Cache-Control",
  ],
);
requirePatterns(
  "src/proxy.ts",
  [
    "/admin",
    "/api/admin",
  ],
);
requirePatterns(
  "src/lib/admin-auth.ts",
  [
    "ADMIN_SESSION_SECRET",
  ],
);
requirePatterns(
  "src/app/api/health/route.ts",
  [
    "export async function GET",
  ],
);
requirePatterns(
  "src/lib/article-notification-store.ts",
  [
    "generateCollaborationAlerts",
    "runAuditRetentionCleanup",
    "isNull",
  ],
);
requirePatterns(
  "src/lib/notification-delivery-store.ts",
  [
    "getNotificationPreferences",
    "updateNotificationPreferences",
    "queueNotificationDeliveries",
    "queueUndeliveredNotifications",
    "claimPendingDeliveries",
    "markDeliverySucceeded",
    "markDeliveryFailed",
    "createSchedulerRun",
    "completeSchedulerRun",
    "listSchedulerRuns",
  ],
);
requirePatterns(
  "src/lib/notification-scheduler.ts",
  [
    "runNotificationScheduler",
    "deliverInApp",
    "deliverEmail",
    "deliverWebhook",
    "recipientUsername",
    "NOTIFICATION_EMAIL_ENDPOINT",
  ],
);
requirePatterns(
  "src/app/api/admin/notification-scheduler/route.ts",
  [
    "NOTIFICATION_SCHEDULER_SECRET",
    "NOTIFICATION_SCHEDULER_RECIPIENT_USERNAME",
    "schedulerSecretValid",
    "getAdminSession",
    "runNotificationScheduler",
  ],
);
const packageJson =
  JSON.parse(
    readText("package.json"),
  );
const requiredScripts = [
  "dev",
  "build",
  "start",
  "lint",
  "typecheck",
  "db:generate",
  "db:migrate",
  "audit:phase10",
  "verify:production",
];
for (const scriptName of requiredScripts) {
  if (
    !packageJson.scripts ||
    typeof packageJson.scripts[scriptName] !==
      "string" ||
    !packageJson.scripts[scriptName].trim()
  ) {
    fail(
      `package.json script missing: ${scriptName}`,
    );
  } else {
    pass(
      `package.json script verified: ${scriptName}`,
    );
  }
}
const expectedDependencies = [
  "next",
  "react",
  "react-dom",
  "drizzle-orm",
  "postgres",
  "zod",
  "jose",
  "bcryptjs",
];
for (
  const dependencyName
  of expectedDependencies
) {
  if (
    !packageJson.dependencies?.[
      dependencyName
    ]
  ) {
    fail(
      `Production dependency missing: ${dependencyName}`,
    );
  } else {
    pass(
      `Production dependency verified: ${dependencyName}`,
    );
  }
}
const migrationFiles =
  fs.readdirSync(
    absolute("drizzle"),
  )
    .filter(
      (fileName) =>
        /^\d+_.+\.sql$/.test(
          fileName,
        ),
    )
    .sort();
if (migrationFiles.length < 6) {
  fail(
    `Database migrations incomplete hain: ${migrationFiles.length}`,
  );
} else {
  pass(
    `Database migration count verified: ${migrationFiles.length}`,
  );
}
const expectedMigrationNames = [
  "phase10_step4_server_revisions",
  "phase10_step5_article_edit_locks",
  "phase10_step6_collaboration_audit",
  "phase10_step8_notifications_retention",
  "phase10_step9_notification_delivery",
];
for (
  const migrationName
  of expectedMigrationNames
) {
  if (
    !migrationFiles.some(
      (fileName) =>
        fileName.includes(
          migrationName,
        ),
    )
  ) {
    fail(
      `Migration missing: ${migrationName}`,
    );
  } else {
    pass(
      `Migration verified: ${migrationName}`,
    );
  }
}
const schemaDirectory =
  absolute(
    "src/db/schema",
  );
const schemaSourceFiles =
  walkFiles(
    schemaDirectory,
  ).filter(
    (filePath) =>
      /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(
        filePath,
      ),
  );
const combinedSchemaSource =
  schemaSourceFiles
    .map(
      (filePath) =>
        fs.readFileSync(
          filePath,
          "utf8",
        ),
    )
    .join("\n");
const requiredSchemaExports = [
  "articleRevisions",
  "articleEditLocks",
  "articleActivityLogs",
  "articleEditorPresence",
  "adminNotifications",
  "auditRetentionPolicies",
  "adminNotificationPreferences",
  "adminNotificationDeliveries",
  "notificationSchedulerRuns",
];
for (
  const schemaExport
  of requiredSchemaExports
) {
  const schemaDeclarationPattern =
    new RegExp(
      `\\b(?:export\\s+)?const\\s+${schemaExport}\\b`,
    );
  const schemaReExportPattern =
    new RegExp(
      `\\b${schemaExport}\\b`,
    );
  if (
    !schemaDeclarationPattern.test(
      combinedSchemaSource,
    ) &&
    !schemaReExportPattern.test(
      combinedSchemaSource,
    )
  ) {
    fail(
      `Schema declaration missing: ${schemaExport}`,
    );
  } else {
    pass(
      `Schema declaration verified: ${schemaExport}`,
    );
  }
}
const requiredRoutes = [
  "src/app/api/admin/articles/[id]/revisions/route.ts",
  "src/app/api/admin/articles/[id]/revisions/[revisionId]/route.ts",
  "src/app/api/admin/articles/[id]/lock/route.ts",
  "src/app/api/admin/articles/[id]/presence/route.ts",
  "src/app/api/admin/articles/[id]/activity/route.ts",
  "src/app/api/admin/articles/[id]/activity/filter/route.ts",
  "src/app/api/admin/articles/[id]/activity/export/route.ts",
  "src/app/api/admin/articles/[id]/activity/dashboard/route.ts",
  "src/app/api/admin/collaboration/dashboard/route.ts",
  "src/app/api/admin/notifications/route.ts",
  "src/app/api/admin/notifications/scan/route.ts",
  "src/app/api/admin/audit-retention/route.ts",
  "src/app/api/admin/notification-preferences/route.ts",
  "src/app/api/admin/notification-deliveries/route.ts",
  "src/app/api/admin/notification-scheduler/route.ts",
];
for (
  const requiredRoute
  of requiredRoutes
) {
  requireFile(
    requiredRoute,
  );
}
const environmentExample =
  fileExists(".env.example")
    ? readText(".env.example")
    : "";
const expectedEnvironmentKeys = [
  "NEXT_PUBLIC_SITE_NAME",
  "NEXT_PUBLIC_SITE_URL",
  "DATABASE_URL",
  "ADMIN_SESSION_SECRET",
  "NOTIFICATION_SCHEDULER_SECRET",
  "NOTIFICATION_SCHEDULER_RECIPIENT_USERNAME",
  "NOTIFICATION_EMAIL_ENDPOINT",
  "NOTIFICATION_EMAIL_TOKEN",
];
for (
  const environmentKey
  of expectedEnvironmentKeys
) {
  const environmentPattern =
    new RegExp(
      `^${environmentKey}=`,
      "m",
    );
  if (
    !environmentPattern.test(
      environmentExample,
    )
  ) {
    warn(
      `.env.example key missing: ${environmentKey}`,
    );
  } else {
    pass(
      `.env.example key verified: ${environmentKey}`,
    );
  }
}
const sourceFiles =
  walkFiles(
    absolute("src"),
  ).filter(
    (filePath) =>
      /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(
        filePath,
      ),
  );
const dangerousSecretPatterns = [
  {
    label: "OpenAI secret",
    pattern:
      /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    label: "Private key",
    pattern:
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    label: "Postgres URL with password",
    pattern:
      /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/g,
  },
];
for (
  const sourceFile
  of sourceFiles
) {
  const content =
    fs.readFileSync(
      sourceFile,
      "utf8",
    );
  for (
    const secretPattern
    of dangerousSecretPatterns
  ) {
    if (
      secretPattern.pattern.test(
        content,
      )
    ) {
      fail(
        `${secretPattern.label} source mein detected: ${normalisePath(
          path.relative(
            projectRoot,
            sourceFile,
          ),
        )}`,
      );
    }
    secretPattern.pattern.lastIndex =
      0;
  }
}
if (
  !failures.some(
    (failure) =>
      failure.includes(
        "source mein detected",
      ),
  )
) {
  pass(
    "Hard-coded production secrets source mein detect nahi hue",
  );
}
const reportDirectory =
  absolute("reports");
fs.mkdirSync(
  reportDirectory,
  {
    recursive: true,
  },
);
const reportFile =
  path.join(
    reportDirectory,
    "phase-10-step-10-static-audit.json",
  );
const report = {
  generatedAt:
    new Date().toISOString(),
  project:
    packageJson.name,
  version:
    packageJson.version,
  migrationCount:
    migrationFiles.length,
  sourceFileCount:
    sourceFiles.length,
  passes,
  warnings,
  failures,
  status:
    failures.length === 0
      ? "PASS"
      : "FAIL",
};
fs.writeFileSync(
  reportFile,
  `${JSON.stringify(
    report,
    null,
    2,
  )}\n`,
  "utf8",
);
console.log("");
console.log(
  "============================================================",
);
console.log(
  "PHASE 10 STEP 10 STATIC AUDIT",
);
console.log(
  "============================================================",
);
console.log(
  `Passes: ${passes.length}`,
);
console.log(
  `Warnings: ${warnings.length}`,
);
console.log(
  `Failures: ${failures.length}`,
);
console.log(
  `Report: ${reportFile}`,
);
console.log(
  "============================================================",
);
if (failures.length > 0) {
  process.exitCode = 1;
}