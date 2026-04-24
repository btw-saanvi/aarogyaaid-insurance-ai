const policies = [
  {
    id: "policy_1",
    name: "SafeGuard Silver Plan",
    coverage: "Covers standard hospitalization, ambulance charges up to ₹2,500, and 30 days pre-hospitalization. Includes maternity benefits after 2 years.",
    waiting_period: "24 months for pre-existing diseases like Diabetes and Hypertension. 12 months for specific ailments like Cataract.",
    premium: "₹6,500 per annum (for 25-35 age group, sum insured ₹5 Lakhs)",
    exclusions: "Non-medical expenses (consumables), cosmetic surgery, dental treatment (unless due to accident), and self-inflicted injuries.",
    keywords: ["silver", "maternity", "affordable", "standard", "diabetes", "hypertension"]
  },
  {
    id: "policy_2",
    name: "Elite Wellness Gold",
    coverage: "Comprehensive coverage including OPD (up to ₹5,000), Annual Health Checkup, Organ Donor expenses, and Ayush Treatment. Sum insured up to ₹1 Crore.",
    waiting_period: "12 months for pre-existing diseases. No waiting period for lifestyle-related illnesses for active individuals.",
    premium: "₹18,000 per annum (for 25-35 age group, sum insured ₹25 Lakhs)",
    exclusions: "War-related injuries, experimental treatments, and obesity treatment (unless clinically indicated).",
    keywords: ["gold", "elite", "opd", "organ donor", "ayush", "comprehensive", "wellness", "lifestyle"]
  },
  {
    id: "policy_3",
    name: "CareFree Prime Max",
    coverage: "Instant coverage for pre-existing conditions (only 30 days waiting). Includes air ambulance, home hospitalization, and global coverage for critical illnesses.",
    waiting_period: "30 days for most pre-existing conditions. Zero waiting period for accidental injuries.",
    premium: "₹32,000 per annum (for 25-35 age group, sum insured ₹50 Lakhs)",
    exclusions: "Infertility treatment, psychiatric disorders, and intentional violation of law.",
    keywords: ["prime", "max", "instant", "global", "air ambulance", "short waiting", "critical illness"]
  }
];

module.exports = policies;
