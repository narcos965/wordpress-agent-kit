import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const TOOL_VERSION = "0.1.0";

const DEFAULT_IGNORES = new Set([
  ".git",
  "node_modules",
  "vendor",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
]);

function parseArgs(argv) {
  const args = {
    path: null,
    maxFiles: 6000,
    maxDepth: 12,
  };

  for (const a of argv) {
    if (a.startsWith("--path=")) args.path = a.slice("--path=".length);
    if (a.startsWith("--maxFiles=")) args.maxFiles = Number(a.slice("--maxFiles=".length));
    if (a.startsWith("--maxDepth=")) args.maxDepth = Number(a.slice("--maxDepth=".length));
  }

  if (!Number.isFinite(args.maxFiles) || args.maxFiles <= 0) args.maxFiles = 6000;
  if (!Number.isFinite(args.maxDepth) || args.maxDepth <= 0) args.maxDepth = 12;

  return args;
}

function statSafe(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function readFileSafe(p, maxBytes = 256 * 1024) {
  try {
    const buf = fs.readFileSync(p);
    if (buf.byteLength > maxBytes) return buf.subarray(0, maxBytes).toString("utf8");
    return buf.toString("utf8");
  } catch {
    return null;
  }
}

function findFilesRecursive(repoRoot, predicate, { maxFiles = 6000, maxDepth = 12 } = {}) {
  const results = [];
  const queue = [{ dir: repoRoot, depth: 0 }];
  let visited = 0;

  while (queue.length > 0) {
    const { dir, depth } = queue.shift();
    if (depth > maxDepth) continue;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);

      if (ent.isDirectory()) {
        if (DEFAULT_IGNORES.has(ent.name)) continue;
        queue.push({ dir: fullPath, depth: depth + 1 });
        continue;
      }

      if (!ent.isFile()) continue;

      visited += 1;
      if (visited > maxFiles) return { results, truncated: true };
      if (predicate(fullPath)) results.push(fullPath);
    }
  }

  return { results, truncated: false };
}

function normalizeExcerpt(line) {
  const trimmed = line.trim();
  if (trimmed.length <= 240) return trimmed;
  return `${trimmed.slice(0, 237)}...`;
}

function addOccurrence(bucket, { file, line, kind, excerpt }) {
  bucket.push({ file, line, kind, excerpt });
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(opts.path || process.cwd());

  const st = statSafe(repoRoot);
  if (!st || !st.isDirectory()) {
    process.stderr.write(`Invalid --path: ${repoRoot}\n`);
    process.exitCode = 2;
    return;
  }

  const { results: phpFiles, truncated } = findFilesRecursive(
    repoRoot,
    (p) => path.extname(p).toLowerCase() === ".php",
    { maxFiles: opts.maxFiles, maxDepth: opts.maxDepth }
  );

  const findings = {
    requestInput: [],
    outputMaybeUnescaped: [],
    escapeContextMismatch: [],
    wpdbUsage: [],
    fileLevel: [],
  };

  const fileSignals = new Map();

  const superglobals = ["$_POST", "$_GET", "$_REQUEST", "$_COOKIE", "$_FILES"];
  const nonceChecks = ["check_admin_referer(", "check_ajax_referer(", "wp_verify_nonce("];
  const capChecks = ["current_user_can(", "user_can("];

  for (const absPath of phpFiles) {
    const rel = path.relative(repoRoot, absPath);
    const contents = readFileSafe(absPath, 256 * 1024);
    if (!contents) continue;

    const signals = {
      hasRequestInput: false,
      hasNonceCheck: false,
      hasCapCheck: false,
      hasWpdbCall: false,
      hasPrepare: false,
    };

    const hay = contents;
    signals.hasNonceCheck = nonceChecks.some((t) => hay.includes(t));
    signals.hasCapCheck = capChecks.some((t) => hay.includes(t));
    signals.hasPrepare = hay.includes("$wpdb->prepare(");

    const lines = hay.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const lineNo = i + 1;
      const line = lines[i];

      if (superglobals.some((g) => line.includes(g))) {
        signals.hasRequestInput = true;
        addOccurrence(findings.requestInput, {
          file: rel,
          line: lineNo,
          kind: "superglobal",
          excerpt: normalizeExcerpt(line),
        });
      }

      const hasWpdbCall =
        line.includes("$wpdb->query(") ||
        line.includes("$wpdb->get_results(") ||
        line.includes("$wpdb->get_row(") ||
        line.includes("$wpdb->get_var(") ||
        line.includes("$wpdb->get_col(");

      if (hasWpdbCall) {
        signals.hasWpdbCall = true;
        addOccurrence(findings.wpdbUsage, {
          file: rel,
          line: lineNo,
          kind: "wpdb-call",
          excerpt: normalizeExcerpt(line),
        });
      }

      const looksLikeOutput = /(\becho\b|\bprint\b|\bprintf\b|\bwp_die\b)\s*\(/.test(line) || /\becho\b\s+/.test(line);
      const hasDollar = line.includes("$");
      const hasEscapeCall = /(esc_html\(|esc_attr\(|esc_url\(|esc_textarea\(|wp_kses\(|wp_kses_post\(|wp_json_encode\()/.test(line);

      if (looksLikeOutput && hasDollar && !hasEscapeCall) {
        addOccurrence(findings.outputMaybeUnescaped, {
          file: rel,
          line: lineNo,
          kind: "output",
          excerpt: normalizeExcerpt(line),
        });
      }

      const urlAttr = /(href\s*=|src\s*=|action\s*=)/i.test(line);
      const usesEscHtml = /esc_html\(/.test(line);
      const usesEscAttr = /esc_attr\(/.test(line);
      const usesEscUrl = /esc_url\(/.test(line);

      if (urlAttr && (usesEscHtml || usesEscAttr) && !usesEscUrl) {
        addOccurrence(findings.escapeContextMismatch, {
          file: rel,
          line: lineNo,
          kind: "url-attr-not-esc_url",
          excerpt: normalizeExcerpt(line),
        });
      }
    }

    fileSignals.set(rel, signals);
  }

  for (const [file, s] of fileSignals.entries()) {
    if (s.hasRequestInput && !s.hasNonceCheck) {
      findings.fileLevel.push({
        file,
        kind: "request-without-nonce-check",
        message: "File reads request input but no nonce verification call was detected (heuristic). Confirm handler type and add check_admin_referer()/check_ajax_referer() as appropriate.",
      });
    }

    if (s.hasRequestInput && !s.hasCapCheck) {
      findings.fileLevel.push({
        file,
        kind: "request-without-cap-check",
        message: "File reads request input but no capability check was detected (heuristic). Confirm the authorization model and add current_user_can() gating as appropriate.",
      });
    }

    if (s.hasWpdbCall && !s.hasPrepare) {
      findings.fileLevel.push({
        file,
        kind: "wpdb-without-prepare",
        message: "File uses $wpdb query methods but no $wpdb->prepare() call was detected. Ensure all dynamic values are safely prepared (or use $wpdb->insert()/update() with formats).",
      });
    }
  }

  const report = {
    tool: { name: "security_inspect", version: TOOL_VERSION },
    root: repoRoot,
    scanned: {
      phpFiles: phpFiles.length,
      truncated,
      maxFiles: opts.maxFiles,
      maxDepth: opts.maxDepth,
    },
    summary: {
      requestInput: findings.requestInput.length,
      outputMaybeUnescaped: findings.outputMaybeUnescaped.length,
      escapeContextMismatch: findings.escapeContextMismatch.length,
      wpdbUsage: findings.wpdbUsage.length,
      fileLevel: findings.fileLevel.length,
    },
    findings,
    notes: [
      "All findings are heuristics. Validate control-flow, handler type, and output context before changing behavior.",
      "This tool does not prove a vulnerability; it highlights common sources of regressions.",
    ],
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main();
