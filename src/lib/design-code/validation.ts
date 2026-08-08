import "server-only";
import { createHash } from "node:crypto";
import type { DesignCodeValidationResult } from "@/lib/design-code/types";
const MAXIMUM_CODE_LENGTH = 100_000;
const FORBIDDEN_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  message: string;
}> = [
  {
    pattern:
      /<\/?(?:script|style|iframe|object|embed|form|input|button|textarea|link|meta|base)\b/i,
    message: "HTML and executable elements are not allowed.",
  },
  {
    pattern: /@import\b/i,
    message: "@import is not allowed.",
  },
  {
    pattern: /@charset\b/i,
    message: "@charset is not allowed.",
  },
  {
    pattern: /@namespace\b/i,
    message: "@namespace is not allowed.",
  },
  {
    pattern: /url\s*\(/i,
    message: "External and embedded URL loading is not allowed.",
  },
  {
    pattern: /javascript\s*:/i,
    message: "JavaScript URLs are not allowed.",
  },
  {
    pattern: /vbscript\s*:/i,
    message: "VBScript URLs are not allowed.",
  },
  {
    pattern: /expression\s*\(/i,
    message: "CSS expressions are not allowed.",
  },
  {
    pattern: /(?:^|[;{\s])behavior\s*:/i,
    message: "CSS behavior execution is not allowed.",
  },
  {
    pattern: /-moz-binding\s*:/i,
    message: "Browser binding execution is not allowed.",
  },
  {
    pattern: /(?:document|window|globalThis|process)\s*\./i,
    message: "Browser and server runtime references are not allowed.",
  },
  {
    pattern: /(?:require|eval|Function|setTimeout|setInterval)\s*\(/i,
    message: "JavaScript execution references are not allowed.",
  },
  {
    pattern: /(?:child_process|node:|powershell|cmd\.exe|bash|wscript|cscript|sh\s+-c)/i,
    message: "Server and shell execution references are not allowed.",
  },
];
function removeComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "");
}
function validateBalancedSyntax(code: string): string[] {
  const errors: string[] = [];
  let braceDepth = 0;
  let parenthesisDepth = 0;
  let quote: "'" | '"' | null = null;
  let escaped = false;
  for (const character of code) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character === "{") {
      braceDepth += 1;
    } else if (character === "}") {
      braceDepth -= 1;
    } else if (character === "(") {
      parenthesisDepth += 1;
    } else if (character === ")") {
      parenthesisDepth -= 1;
    }
    if (braceDepth < 0) {
      errors.push("A closing brace appears before its opening brace.");
      break;
    }
    if (parenthesisDepth < 0) {
      errors.push("A closing parenthesis appears before its opening parenthesis.");
      break;
    }
  }
  if (quote) {
    errors.push("A quoted CSS value is not closed.");
  }
  if (braceDepth !== 0) {
    errors.push("CSS braces are not balanced.");
  }
  if (parenthesisDepth !== 0) {
    errors.push("CSS parentheses are not balanced.");
  }
  return errors;
}
export function validateDesignCode(input: unknown): DesignCodeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (typeof input !== "string") {
    return {
      valid: false,
      errors: ["Design code must be a CSS string."],
      warnings,
      checksum: null,
    };
  }
  const code = input.trim();
  if (!code) {
    errors.push("Design code cannot be empty.");
  }
  if (code.length > MAXIMUM_CODE_LENGTH) {
    errors.push(
      `Design code cannot exceed ${MAXIMUM_CODE_LENGTH.toLocaleString()} characters.`,
    );
  }
  const codeWithoutComments = removeComments(code);
  for (const forbiddenPattern of FORBIDDEN_PATTERNS) {
    if (forbiddenPattern.pattern.test(codeWithoutComments)) {
      errors.push(forbiddenPattern.message);
    }
  }
  errors.push(...validateBalancedSyntax(codeWithoutComments));
  if (code && !codeWithoutComments.includes("{")) {
    warnings.push("No CSS rule block was detected.");
  }
  return {
    valid: errors.length === 0,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    checksum:
      errors.length === 0
        ? createHash("sha256").update(code, "utf8").digest("hex")
        : null,
  };
}
