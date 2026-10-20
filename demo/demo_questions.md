# [Retail] Northwind Retail Knowledge Catalog Demo — Scenario Playbook

Run the same question against all three agents and observe the divergence.
Each scenario targets a specific failure mode that Knowledge Catalog solves.

---

## Category 1: Foundational (all 3 agents succeed)

Establishes credibility — proves all agents work when the task is simple.

### Scenario 1.1
> "What are our top 5 customers by total relationship value?"

- All succeed: `gold_customer_360` is known to all agents, simple aggregation
- **Demo point:** "All three agents work when the task is simple."

### Scenario 1.2
> "Show me our bnpl_plan assortment by product type and risk rating"

- All succeed: `gold_bnpl_plan_summary` is well-known, single table
- **Demo point:** "This isn't a model intelligence issue — it's a data discovery issue."

---

## Category 2: Table Disambiguation (Scaled agent picks wrong table)

The scaled agent sees 128 table names but can't tell which one to use.

### Scenario 2.1 — Return Fraud & Promo Abuse
> "Show me return fraud and promo abuse trends over the past year"

- **Scaled failure:** Sees `bronze_fraud_alerts`, `silver_fraud_alerts`, `gold_return_fraud_analytics`, `silver_promo_abuse_cases`, `gold_promo_fraud_scoring` — picks one arbitrarily or hallucinates a `suspicious_activity` table
- **KC advantage:** Searches "return fraud and promo abuse" → discovers `gold_return_fraud_analytics` for fraud trends AND `gold_promo_fraud_scoring` for BSA/Promo-Fraud → reads metadata to understand which is the monthly trend table → queries the right one → cites the BSA glossary term and data classification
- **Key talking point:** *"128 tables means 128 chances to pick the wrong one. The KC agent doesn't guess — it searches semantically and reads metadata to understand what each table actually contains."*

### Scenario 2.2 — Markdown & Gross Margin Risk
> "What's our markdown and margin exposure?"

- **Scaled failure:** Sees `bronze_markdown_rates`, `silver_markdown_rates`, `gold_gross_margin_analysis`, `gold_markdown_risk_var`, `gold_working_capital_adequacy` — confused about which dimension of "interest rate" to answer
- **KC advantage:** Searches "markdown and margin risk" → finds `gold_gross_margin_analysis` for NIM analysis and `gold_markdown_risk_var` for VaR → reads glossary definitions of NIM and VaR → presents both dimensions with proper business context
- **Key talking point:** *"Markdown and margin exposure means different things to a treasurer vs. a risk officer. Knowledge Catalog's glossary gives the agent the business context to answer comprehensively."*

---

## Category 3: Cross-Domain Discovery (Scaled agent misses entire domains)

Questions that span ORION (retail) and LUMEN (loyalty) — two separate source systems.

### Scenario 3.1 — VIP Member Total Relationship
> "For our VIP loyalty members, what's their total exposure including loyalty_balances, bnpl_plans, and investments?"

- **Scaled failure:** Queries only `silver_vip_members` (loyalty) OR `silver_customers` (retail), misses the pre-built `gold_customer_360` that joins both source systems
- **KC advantage:** Searches "high net worth total relationship" → discovers `gold_customer_360` which joins ORION + LUMEN → reads lineage showing it aggregates across both source systems → filters to Premier/Private Retail segments → presents unified view
- **Key talking point:** *"A real retailer has retail customers in one system and loyalty clients in another. The KC agent discovers the gold table that already joins them — the scaled agent doesn't even know it exists."*

### Scenario 3.2 — Store Revenue (Retail + Omnichannel Loyalty)
> "Which stores generate the most revenue when you include both retail retail and loyalty management?"

- **Scaled failure:** Finds `gold_store_performance` but it only covers retail. Misses that loyalty revenue needs to come from `gold_promo_margin_impact` or `gold_vip_member_revenue`
- **KC advantage:** Searches "store revenue" → finds both `gold_store_performance` AND `gold_promo_margin_impact` → reads aspects showing different source systems → constructs a join → explains the cross-domain data lineage
- **Key talking point:** *"No store manager sees their full P&L because the data lives in two separate systems. The KC agent discovers both and combines them."*

---

## Category 4: Regulatory & Compliance (KC agent cites governance metadata)

Questions where the answer requires not just data but regulatory context.

### Scenario 4.1 — Working Capital & PCI-DSS Compliance
> "Are we meeting our working capital adequacy requirements? What's our buffer above the minimum?"

- **Scaled failure:** Might find `gold_working_capital_adequacy` but doesn't understand CET1 minimums, conservation buffers, or countercyclical buffers — presents raw numbers without regulatory context
- **KC advantage:** Searches "working capital adequacy" → finds `gold_working_capital_adequacy` → reads glossary definitions of CET1, working capital & PCI-DSS, risk-weighted assets → reads regulatory reporting aspect (Annual Omnichannel Retail Filing) → presents ratios WITH regulatory context and buffer calculations → cites glossary definitions
- **Key talking point:** *"The KC agent reads the glossary to understand that CET1 minimum is 4.5% plus a 2.5% conservation buffer. That business knowledge comes from Knowledge Catalog, not the model's training data."*

### Scenario 4.2 — KYC Compliance Gaps
> "Do we have any KYC compliance gaps? Show me overdue reviews and high-risk customers."

- **Scaled failure:** May query `bronze_privacy_consents` (raw data with duplicates) or miss `gold_promo_fraud_scoring` entirely
- **KC advantage:** Searches "KYC compliance overdue" → discovers `gold_promo_fraud_scoring` → reads glossary definitions of KYC, CDD, EDD, PEP → reads data classification (Restricted) → presents with compliance context
- **Key talking point:** *"Compliance data has to be right. The KC agent checks data quality and sensitivity classifications before answering. It tells you the data is Restricted and sourced from the ORION core retail system — that's governance context a compliance officer needs."*

---

## Category 5: Data Quality & Trust (KC agent assesses trustworthiness)

Questions where knowing the answer isn't enough — you need to know if you can trust it.

### Scenario 5.1 — Return-Risk Score Trust
> "What's the average Return-Risk score across our bnpl_plan assortment, and should we trust this number?"

- **Scaled failure:** Calculates the average but has no way to assess data quality
- **KC advantage:** Searches "Return-Risk score bnpl_plans" → finds the right tables → reads DQ rules attached to the Return-Risk glossary term ("validated in 300-850 range") → presents the average WITH a data quality assessment
- **Key talking point:** *"Any agent can calculate an average. Only the KC agent can tell you whether to trust it. It reads the data quality rules from Knowledge Catalog and cites them in the answer."*

### Scenario 5.2 — GTIN Data Quality
> "Show me our GTIN-level holdings across all assortments. Are there any data issues?"

- **Scaled failure:** Might query `silver_inventory_positions` but can't assess quality
- **KC advantage:** Searches "GTIN holdings" → reads GTIN glossary term with DQ rules ("9-character alphanumeric format") → flags format validation status → presents holdings with governance notes
- **Key talking point:** *"The DQ rule attached to the GTIN glossary term is centrally governed in Knowledge Catalog. Every agent that touches GTIN data automatically knows the quality standard."*

---

## Category 6: The "Impossible" Question (Scaled agent completely fails)

Multi-table, multi-domain questions that require discovering relationships between data assets.

### Scenario 6.1 — CRE Stress Test
> "If commercial real estate defaults increased 5%, what would happen to our capital ratios?"

- **Scaled failure:** Has no idea which tables to combine. Requires `gold_bnpl_plan_summary` (CRE exposure) + `gold_working_capital_adequacy` (current ratios) + `gold_bnpl_delinquency_analysis` (default rates). Agent likely hallucinates or gives up.
- **KC advantage:** Multiple searches → discovers all three tables → reads lineage to understand relationships → constructs multi-table scenario analysis → cites all sources and glossary terms
- **Key talking point:** *"This is a question a CFO asks every quarter. The scaled agent can't even figure out where to start. The KC agent discovers three tables, understands their relationships through lineage, and constructs the analysis. That's the difference between a toy agent and an enterprise agent."*

### Scenario 6.2 — Cross-Sell Opportunity
> "Which of our loyalty management clients should we cross-sell a extended_financing to?"

- **Scaled failure:** Requires joining loyalty client data (LUMEN) with lending data (ORION). Scaled agent can't reason about cross-system joins.
- **KC advantage:** Discovers `gold_customer_360` bridges both systems → queries VIP members with high AUM but no active extended_financing → presents as a cross-sell opportunity list with relationship context
- **Key talking point:** *"Cross-selling requires data from two completely separate core systems. The KC agent discovers the gold table that bridges them. Without Knowledge Catalog, you'd need a developer to hardcode that join for every use case."*

---

## Recommended Demo Flow

### Without Snowflake (~20 minutes)

| Step | Scenario | What to show | Time |
|---|---|---|---|
| 1 | 1.1 — Top customers | All 3 agents succeed → foundational | 2 min |
| 2 | 1.2 — BNPL Plan assortment | All 3 succeed → "not a model issue" | 1 min |
| 3 | 2.1 — Suspicious activity | Scaled picks wrong table → KC finds right one | 3 min |
| 4 | 3.1 — VIP member total relationship | Scaled misses cross-domain → KC discovers gold table | 3 min |
| 5 | 4.1 — working capital adequacy | KC cites glossary definitions & regulatory context | 3 min |
| 6 | 5.1 — Return-Risk trust | KC cites data quality rules & trust assessment | 3 min |
| 7 | 6.1 — Seasonal Markdown Stress Test | Scaled fails completely → KC multi-table reasoning | 3 min |
| 8 | Knowledge Catalog UI | Walk through glossary, lineage, DQ in the console | 2 min |

### With Snowflake (~28 minutes)

Run steps 1-8 above, then switch to the **Multi-Cloud** narrative tab:

| Step | Scenario | What to show | Time |
|---|---|---|---|
| 9 | Visualization | Point out the Snowflake cluster (cyan, bottom-right) | 1 min |
| 10 | 7.2 — Benchmark comparison | KC queries BQ + Snowflake, calculates over/under-performance | 3 min |
| 11 | 7.3 — Competitor pricing + Gross Margin | KC combines competitor markdown curves (Snowflake) with NIM (BQ) | 3 min |
| 12 | 7.5 — FX rate comparison | KC reconciles internal vs external FX rates across platforms | 1 min |

> **Note:** If Snowflake is not configured (`SNOWFLAKE_ACCOUNT` not set), the Multi-Cloud
> narrative tab is hidden, the Snowflake cluster is invisible, and the demo works exactly
> as before with Categories 1-6 only. No changes needed — the app handles this automatically.

## After Each KC Agent Answer, Highlight:

1. **"It searched before it queried"** — show the `search_entries` tool call
2. **"It chose the right table and explained why"** — table selection rationale citing metadata
3. **"It cited the glossary"** — business term definitions in the response
4. **"It checked data quality"** — DQ rules and trust assessment
5. **"It traced the lineage"** — source system attribution (ORION / LUMEN / HELIOS)
6. **"It flagged sensitivity"** — data classification level in the response

---

## Category 7: Multi-Cloud Discovery (Multi-cloud KC agent with Snowflake enabled)

Demonstrates that the Multi-cloud KC agent discovers and queries data across BigQuery and Snowflake.
Requires Snowflake integration to be configured (`SNOWFLAKE_ACCOUNT` set).
Basic, Scaled, and BQ-only KC agents cannot answer these questions — they lack the `query_snowflake` tool.

### Scenario 7.1 — Current Security Pricing
> "What are the latest closing prices from NEXUS for the product_skus in our top loyalty assortments?"

- **Other agents fail:** No access to NEXUS pricing data in Snowflake
- **Multi-cloud KC:** Searches KC → discovers `gold_assortment_performance` (BQ) + `security_prices` (Snowflake) → queries both → combines on GTIN
- **Key talking point:** *"The agent discovered that current pricing lives in an external vendor's Snowflake database. No hardcoded connections — Knowledge Catalog told it where to look."*

### Scenario 7.2 — Benchmark Comparison
> "How do our assortments compare to their benchmark indices this year? Use the external benchmark returns data."

- **Other agents fail:** Can only see internal BQ data, not external benchmark returns
- **Multi-cloud KC:** Finds `gold_assortment_performance` (BQ) + `benchmark_returns` (Snowflake) → calculates over/under-performance
- **Key talking point:** *"Assortment returns from our internal system, benchmark returns from an external vendor in Snowflake — the Multi-cloud KC agent bridges both seamlessly."*

### Scenario 7.3 — Yield Curve + NIM
> "Show me the current SOFR and Treasury yield curve alongside our net interest margin. How sensitive is our NIM to rate changes?"

- **Other agents fail:** No access to real-time yield curve data
- **Multi-cloud KC:** Finds `gold_gross_margin_analysis` (BQ) + `interest_rate_curves` (Snowflake with SOFR, Fed Funds, Treasury 2Y/5Y/10Y/30Y) → presents NIM with rate context
- **Key talking point:** *"The yield curve comes from NEXUS in Snowflake, NIM from our internal analytics in BigQuery. Knowledge Catalog connects them."*

### Scenario 7.4 — Credit Spread Exposure
> "What's our credit spread exposure by sector? Show current market spreads alongside our assortment risk."

- **Other agents fail:** Can see internal risk metrics but not current market spreads
- **Multi-cloud KC:** Finds `gold_markdown_risk_var` (BQ) + `credit_spreads` (Snowflake) → combines risk metrics with live market spreads
- **Key talking point:** *"Risk models in BigQuery, market spreads in Snowflake — the agent discovers the right data regardless of where it lives."*

### Scenario 7.5 — FX Rate Discrepancy
> "Compare our internal FX rates with the NEXUS spot rates. Are there any significant discrepancies?"

- **Other agents fail:** Only see internal FX rates
- **Multi-cloud KC:** Finds `bronze_fx_rates` (BQ) + `fx_spot_rates` (Snowflake) → compares internal vs external rates
- **Key talking point:** *"Reconciling internal and external data sources is a common retail workflow. The agent finds both through KC without being told where they are."*

### Scenario 7.6 — Security Fundamentals
> "What are the P/E ratios and dividend yields for the product_skus in our largest assortments? Use NEXUS fundamentals data."

- **Other agents fail:** No access to NEXUS fundamentals in Snowflake
- **Multi-cloud KC:** Finds `security_fundamentals` (Snowflake) → queries P/E, EPS, dividend yield, market cap
- **Key talking point:** *"External market data enriches internal assortment analysis. The agent finds it through catalog metadata, not hardcoded table lists."*
