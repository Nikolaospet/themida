import type { ComplianceRule } from "../../../types";

export const PCI_002: ComplianceRule = {
  id: "PCI-002",
  framework: "pci-dss",
  version: "1.0.0",
  article:
    "PCI DSS v4.0 Requirement 4.2.1 — Strong cryptography for PAN transmitted over open, public networks",
  legalText:
    "Strong cryptography and security protocols are implemented to safeguard PAN during transmission over open, public networks. This includes accepting only trusted keys and certificates and using secure versions and configurations of the protocol. Transmitting cardholder data to an `http://` (non-TLS) endpoint, or disabling certificate verification, exposes the PAN to interception.",
  legalSource: "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0.pdf",
  legalRisk:
    "Cardholder data intercepted in transit is a reportable breach to the acquirer and card brands, leading to fines, mandatory forensic review, and remediation costs.",
  severity: "HIGH",
  title: "Cardholder data transmitted without strong cryptography",
  description:
    "Detects card/payment data sent to a plaintext `http://` URL via fetch/axios/request, a payment base URL configured with `http://`, or TLS certificate verification disabled (`rejectUnauthorized: false`, `verify=False`) on a path carrying cardholder data — bypassing the strong cryptography PCI DSS Req 4.2.1 requires in transit.",
  codePatterns: [
    "(fetch|axios\\.[a-z]+|request|got\\.[a-z]+)\\s*\\(\\s*[`'\"]http://[^`'\"]*(card|payment|charge|pan|checkout)",
    "(baseURL|endpoint|url|host)\\s*[:=]\\s*[`'\"]http://[^`'\"]*(card|payment|charge|pan|checkout|gateway)",
    "(rejectUnauthorized\\s*:\\s*false|verify\\s*=\\s*False)",
  ],
  keywords: [
    "http://",
    "https",
    "tls",
    "fetch",
    "axios",
    "rejectUnauthorized",
    "card",
    "payment",
    "gateway",
    "pan",
    "transmit",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php"],
  violationExamples: [
    "await fetch('http://gateway.internal/charge', { method: 'POST', body: JSON.stringify({ pan, amount }) });",
    "const psp = axios.create({ baseURL: 'http://payments.example.com/api' });",
  ],
  complianceExamples: [
    "await fetch('https://gateway.internal/charge', { method: 'POST', body: JSON.stringify({ token, amount }) });",
    "const psp = axios.create({ baseURL: 'https://payments.example.com/api' });",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} sends cardholder data over a channel without strong cryptography (plaintext http:// or with certificate verification disabled). PCI DSS Req 4.2.1 requires strong cryptography and trusted certificates whenever PAN crosses open, public networks; otherwise the data can be intercepted on-path.",
    fixDescription:
      "Use https:// with a modern TLS version for every endpoint that carries cardholder data, and never disable certificate verification. For service-to-service traffic, use TLS (or mutual TLS) and pin to trusted CAs; reject protocol downgrades.",
    fixCodeTemplate:
      "const psp = axios.create({ baseURL: 'https://payments.example.com/api' });\nawait psp.post('/charge', { token, amount });",
    estimatedFixTime: "~30 minutes",
    references: [
      "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0.pdf",
      "https://www.pcisecuritystandards.org/document_library/",
    ],
  },
};
