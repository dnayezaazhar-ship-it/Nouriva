import Link from "next/link";

export default function Home() {
  return (
    <main>
      <nav className="site-nav">
        <Link href="/" className="brand"><span className="brand-mark">N</span> nouriva</Link>
        <div className="nav-links"><a href="#how-it-works">How it works</a><a href="#features">Features</a><Link href="/pricing">Pricing</Link></div>
        <div className="nav-actions"><Link className="button button-ghost" href="/sign-in">Sign in</Link><Link className="button button-primary" href="/sign-up">Get started <span>→</span></Link></div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">✦ Nutrition that fits your life</div>
          <h1>Feel good in your <em>everyday.</em></h1>
          <p className="hero-lede">Nouriva turns small, sustainable choices into a nourishing rhythm. Plan meals, understand your food, and build momentum—without the noise.</p>
          <div className="hero-actions"><Link href="/sign-up" className="button button-primary button-large">Start for free <span>→</span></Link><a href="#how-it-works" className="text-link">See how it works <span>↓</span></a></div>
          <div className="trust-row"><span>✓ No calorie obsession</span><span>✓ Built for real life</span><span>✓ Free to start</span></div>
        </div>
        <div className="hero-art" aria-label="Nouriva nutrition dashboard preview">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="dash-card dash-main"><div className="dash-header"><span>Tuesday, October 8</span><span className="status-dot">● On track</span></div><h3>Your nourishment today</h3><div className="progress-ring"><svg className="progress-ring-svg" viewBox="0 0 142 142" aria-hidden="true"><circle className="progress-ring-track" cx="71" cy="71" r="55" pathLength="100" /><circle className="progress-ring-fill" cx="71" cy="71" r="55" pathLength="100" strokeDasharray="100" strokeDashoffset="28" /></svg><div><strong>72</strong><small>%</small><span>balanced</span></div></div><div className="macro-row"><div><span className="macro-bar green" /><b>Protein</b><small>86g / 110g</small></div><div><span className="macro-bar coral" /><b>Fiber</b><small>19g / 28g</small></div><div><span className="macro-bar gold" /><b>Water</b><small>5 / 8 cups</small></div></div></div>
          <div className="dash-card floating-card meal-card"><span className="meal-icon">🥗</span><div><small>Up next · Lunch</small><b>Rainbow grain bowl</b><span>24g protein · 18 min</span></div><span>→</span></div>
          <div className="dash-card floating-card coach-card"><span className="coach-avatar">✦</span><div><small>Your coach says</small><b>“You’re building a<br />great rhythm.”</b></div></div>
        </div>
      </section>
      <section className="logo-strip"><span>Made for your whole self</span><div>◒ gentle by design</div><div>✦ science-informed</div><div>○ progress, not perfection</div></section>
      <section id="how-it-works" className="section centered"><div className="eyebrow">A better way to nourish yourself</div><h2>Simple enough for Monday.<br /><em>Supportive enough for every day.</em></h2><p className="section-lede">Nouriva brings your meals, movement, and mindset into one calm, clear space.</p><div className="steps"><div><span>01</span><h3>Make it yours</h3><p>Tell us what matters to you—your goals, preferences, and the foods you love.</p></div><div><span>02</span><h3>Find your rhythm</h3><p>Get practical meal ideas and gentle guidance that adapts to your real routine.</p></div><div><span>03</span><h3>Keep going</h3><p>Notice your patterns, celebrate your wins, and make progress that lasts.</p></div></div></section>
      <section id="features" className="feature-band"><div><div className="eyebrow">Everything in one place</div><h2>Less tracking.<br /><em>More living.</em></h2></div><div className="feature-list"><div><b>01</b><div><h3>Your daily picture</h3><p>See the full story of your nutrition at a glance—not just a number.</p></div></div><div><b>02</b><div><h3>A coach in your corner</h3><p>Thoughtful, AI-powered support when you need a little clarity.</p></div></div><div><b>03</b><div><h3>Progress you can feel</h3><p>Track what matters to you, from energy to consistency and beyond.</p></div></div></div></section>
      <section className="final-cta"><div className="eyebrow">Your next chapter starts here</div><h2>Good food. <em>Good energy.</em><br />A life that feels like yours.</h2><Link href="/sign-up" className="button button-light button-large">Begin your journey <span>→</span></Link></section>
      <footer className="footer"><Link href="/" className="brand"><span className="brand-mark">N</span> nouriva</Link><span>© 2025 Nouriva. Gentle guidance for everyday wellbeing.</span><div><Link href="/pricing">Pricing</Link><Link href="/sign-in">Sign in</Link></div></footer>
    </main>
  );
}
