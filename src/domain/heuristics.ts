const SUSPICIOUS_PATTERNS = [
  /\b(let|any|throw|catch|switch|export\s+default|console\.log|Date\.now|Math\.random|fetch|def|class|global|import\s+\*)\b/,
  /\.(push|splice|sort)\(/,
  /\w+\s*\([^)]*\w+\s*\(/ // Heuristic for nested calls
];

/**
 * Returns true if the code might contain a governance violation.
 * Returns false if the code is definitely clean according to our rules.
 */
export const isSuspicious = (code: string): boolean => {
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(code)) {
      return true;
    }
  }
  return false;
};
