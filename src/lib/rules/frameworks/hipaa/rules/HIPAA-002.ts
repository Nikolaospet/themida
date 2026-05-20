import type { ComplianceRule } from "../../../types";

export const HIPAA_002: ComplianceRule = {
  id: "HIPAA-002",
  framework: "hipaa",
  version: "1.0.0",
  article: "45 CFR §164.312(e)(1), §164.312(e)(2)(ii) — Transmission security (PHI in transit)",
  legalText:
    "A covered entity must implement technical security measures to guard against unauthorized access to ePHI that is being transmitted over an electronic communications network, including, where appropriate, encryption of ePHI in transit. Transmitting PHI to an `http://` (non-TLS) endpoint exposes it to interception.",
  legalSource:
    "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312",
  legalRisk:
    "Interception of PHI on the wire is a reportable breach; civil money penalties up to ~$2.1M per violation category per year plus corrective-action plans.",
  severity: "HIGH",
  title: "PHI transmitted over an unencrypted (http://) channel",
  description:
    "Detects PHI-bearing requests sent to a plaintext `http://` URL via fetch/axios/request, or a configured base URL using `http://` for a patient/records/EHR service — bypassing the TLS encryption HIPAA requires for ePHI in transit.",
  codePatterns: [
    "(fetch|axios\\.[a-z]+|request|got\\.[a-z]+)\\s*\\(\\s*[`'\"]http://",
    "(baseURL|endpoint|url|host)\\s*[:=]\\s*[`'\"]http://[^`'\"]*(patient|phi|medical|record|ehr|fhir)",
    "http://[^\\s'\"]*(patient|phi|medical|record|ehr|fhir)",
  ],
  keywords: [
    "http://",
    "https",
    "fetch",
    "axios",
    "tls",
    "transmit",
    "patient",
    "phi",
    "fhir",
    "ehr",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php"],
  violationExamples: [
    "await fetch('http://ehr.internal/api/patients', { method: 'POST', body: JSON.stringify(patient) });",
    "const client = axios.create({ baseURL: 'http://records.example.com/fhir' });",
  ],
  complianceExamples: [
    "await fetch('https://ehr.internal/api/patients', { method: 'POST', body: JSON.stringify(patient) });",
    "const client = axios.create({ baseURL: 'https://records.example.com/fhir' });",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} sends protected health information over an unencrypted http:// channel. HIPAA §164.312(e) requires guarding ePHI in transit, including encryption where appropriate; plaintext transport allows on-path interception and is a reportable breach.",
    fixDescription:
      "Use https:// for every endpoint that carries PHI and enforce TLS (reject downgrade). For internal service-to-service traffic, terminate TLS at the service or use mutual TLS; never disable certificate verification to make http:// work.",
    fixCodeTemplate:
      "const client = axios.create({ baseURL: 'https://records.example.com/fhir' });\nawait client.post('/patients', patient);",
    estimatedFixTime: "~30 minutes",
    references: [
      "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312",
      "https://www.hhs.gov/hipaa/for-professionals/security/guidance/cybersecurity/index.html",
    ],
  },
};
