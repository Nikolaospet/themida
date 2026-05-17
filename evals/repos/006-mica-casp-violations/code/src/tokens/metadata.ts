// Token metadata module.
// VIOLATION (MICA-002): the whitepaper is referenced only by URL — no
// version, no integrity hash. A silent edit of the hosted PDF would
// diverge from the document filed with the competent authority.

export const TOKEN_METADATA = {
  name: "ACME",
  ticker: "ACM",
  whitepaperUrl: "https://acme.example/whitepaper.pdf",
  network: "ethereum",
  decimals: 18,
};
