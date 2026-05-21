import type { ComplianceRule } from "../../../types";

export const OWASP_003: ComplianceRule = {
  id: "OWASP-003",
  framework: "owasp",
  version: "1.0.0",
  article: "OWASP Top 10:2021 — A03 Injection",
  legalText:
    "An application is vulnerable to injection when user-supplied data is concatenated into an interpreter (SQL, OS shell, etc.) without parameterization or escaping. The hostile data tricks the interpreter into executing unintended commands or accessing data without authorization. SQL injection via string concatenation or template-literal interpolation, and OS command injection via shell exec, are the canonical cases.",
  legalSource: "https://owasp.org/Top10/A03_2021-Injection/",
  legalRisk:
    "Full database read/write, authentication bypass, and in the OS-command case remote code execution. A03 consolidates injection and XSS and remains among the highest-impact categories.",
  severity: "CRITICAL",
  title: "User input concatenated into a SQL query or shell command",
  description:
    "Detects dynamic SQL built by string concatenation or template-literal interpolation passed to a query/execute/raw call, and OS command execution (`exec`/`execSync`) built with interpolated input — both classic injection sinks. Parameterized queries and argument arrays are the safe alternative.",
  codePatterns: [
    "\\.(query|execute|raw|unsafe)\\s*\\(\\s*[`'\"][^`'\"]*\\$\\{",
    "(SELECT|INSERT|INTO|UPDATE|DELETE|WHERE)\\b[^;`]*['\"]\\s*\\+\\s*[A-Za-z_$]",
    "\\b(exec|execSync|spawn)\\s*\\(\\s*[`'\"][^`'\"]*\\$\\{",
  ],
  keywords: [
    "query",
    "execute",
    "raw",
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "exec",
    "parameterized",
    "prepared",
    "placeholder",
    "sanitize",
    "$1",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php", ".sql"],
  violationExamples: [
    "const rows = await db.query(`SELECT * FROM users WHERE email = '${email}'`);",
    "const result = await pool.query('SELECT * FROM orders WHERE id = ' + req.params.id);",
    "exec(`convert ${req.query.file} out.png`);",
  ],
  complianceExamples: [
    "const rows = await db.query('SELECT * FROM users WHERE email = $1', [email]);",
    "const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);",
    "execFile('convert', [userFile, 'out.png']);",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} concatenates untrusted input directly into an interpreter (SQL or OS shell). An attacker can break out of the intended statement and read/modify arbitrary data or execute commands — a textbook injection vulnerability.",
    fixDescription:
      "Never build queries or commands by concatenation. Use parameterized/prepared statements with bound placeholders for SQL, and pass arguments as an array (e.g. `execFile`) instead of a shell string for OS commands. Where an ORM is available, use its query builder.",
    fixCodeTemplate:
      "// SQL: bind parameters instead of interpolating\nconst rows = await db.query('SELECT * FROM users WHERE email = $1', [email]);\n\n// OS command: pass args as an array, no shell string\nimport { execFile } from 'node:child_process';\nexecFile('convert', [userFile, 'out.png']);",
    estimatedFixTime: "~45 minutes",
    references: [
      "https://owasp.org/Top10/A03_2021-Injection/",
      "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
      "https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html",
    ],
  },
};
