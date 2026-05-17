// Marketing landing page for a fictional crypto staking product.
// VIOLATION (MICA-001): promotes a yield without the MiCA-required risk
// disclaimer (volatility / may-lose-funds language).

export function StakingHero() {
  return (
    <section>
      <h1>ACME Yield</h1>
      <h2>Earn 12% APY on USDT — guaranteed returns, no lockup</h2>
      <p>Passive income from staking, settled daily. Start with one click.</p>
      <button>Stake now</button>
    </section>
  );
}
