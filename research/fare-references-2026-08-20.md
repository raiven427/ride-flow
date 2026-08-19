# RideFlow fare research notes (20 Aug 2026)

## Scope
These are public reference points for a Nairobi/Kenya demo pricing model. They are not official provider rate cards and should not be treated as legal or commercial confirmation. RideFlow should use server-side configurable pricing and review local transport/payment requirements before launch.

## Sources

1. Citizen Digital, “Bolt announces 6% fare increase after fuel price hike,” 12 May 2026: https://citizen.digital/article/bolt-announces-6-fare-increase-after-fuel-price-hike-n382522
   - Reports a 6% Bolt fare increase in Kenya following fuel-price increases.
   - Reports Nairobi maximum retail fuel prices at KSh 197.60 petrol and KSh 196.63 diesel for the cited pricing period.
   - Reports an industry-discussed minimum fare of KSh 450 for trips up to 3 km, noting it was not ratified by platforms at that time.

2. Technext, “Kenyan authorities order Uber and Bolt to raise fares by 50% following drivers’ protest,” 2025: https://technext24.com/news/uber-bolt-ordered-to-raise-fares-kenya/
   - Reports AAK/authority guidance of approximately KSh 33.10 per km for small engines, up from KSh 22, and KSh 36.80 per km for medium engines, up from KSh 26.
   - Reports Bolt’s Economy base fare changing from KSh 200 to KSh 220 in an earlier 2024 adjustment.
   - Reports driver concerns about commissions and a KSh 300 minimum fare discussion; these claims need legal/provider verification before product policy decisions.

3. EliteMotion Luxury, “Uber vs Car Hire in Nairobi: Complete Cost Comparison for 2025,” 4 Nov 2025: https://elitemotionluxury.com/blog/uber-vs-car-hire-in-nairobi-complete-cost-comparison-for-2025
   - Publishes an unofficial 2025 comparison table: Uber X base KSh 100, KSh 38/km, KSh 4/min, minimum KSh 200; Comfort base KSh 150, KSh 48/km, KSh 5/min, minimum KSh 300; Black base KSh 300, KSh 65/km, KSh 8/min, minimum KSh 500.
   - Notes these are third-party estimates and surge/minimum/cancellation behavior can vary.

## Proposed RideFlow demo pricing assumption
Use a transparent, configurable Nairobi Economy model rather than “all apps minus KSh 50”:

- Base fare: KSh 100
- Distance rate: KSh 30/km
- Time rate: KSh 3/min
- Minimum fare: KSh 200
- Safety/support fee: KSh 20
- Platform commission: 5% of eligible pre-tip fare, shown separately
- No surge in the demo; if dynamic pricing is added later, show the multiplier before confirmation

Illustrative 8.4 km / 24 min quote:
- Distance: KSh 252
- Time: KSh 72
- Base: KSh 100
- Safety/support: KSh 20
- Subtotal before commission: KSh 444
- Platform commission at 5%: KSh 22.20
- Rider total before tip: KSh 466.20 (round display to KSh 466)
- Driver share before other permitted deductions: KSh 421.80

This is a product assumption for testing, not a recommended final public price. It should be validated with driver economics, local rules, fuel/insurance costs, and real route samples.
