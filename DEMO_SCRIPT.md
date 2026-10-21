# [Retail] Northwind Retail Group — Knowledge Catalog Demo Script

## 1. Live Environment & Canonical URLs

| Component | Resource / Canonical URL |
|---|---|
| **Live Demo UI (Canonical URL)** | `https://retail-kc-demo-ui-live-98236392654.us-central1.run.app` |
| **Live Demo UI (Regional Alias)** | `https://retail-kc-demo-ui-live-esoohbbsma-uc.a.run.app` |
| **GCP Project** | `alitch-ca-demo` (`98236392654`) |
| **Basic Agent (`[Retail] retail-agent-basic`)** | `projects/98236392654/locations/us-central1/reasoningEngines/2946493525224587264` |
| **Scaled Agent (`[Retail] retail-agent-scaled`)** | `projects/98236392654/locations/us-central1/reasoningEngines/1975967805526245376` |
| **KC-Guided Agent (`[Retail] retail-agent-kc`)** | `projects/98236392654/locations/us-central1/reasoningEngines/8060330902103785472` |
| **Business Glossary (`us`)** | `retail-northwind-glossary-us` (15 categories, 84 terms, 165 term relationships, 219 entry links) |
| **Policy Tag Taxonomy (`us`)** | `Retail Demo Sensitivity Taxonomy (alitch)` (`projects/alitch-ca-demo/locations/us/taxonomies/7913457216278085263`) |
| **BigQuery Datasets (`US`)** | 10 governed `retail_*` datasets (`128` tables/views) + 8 shadow `retail_*_nokc` datasets (`120` tables/views) |

### Pre-Demo Health Check

```bash
curl -s https://retail-kc-demo-ui-live-98236392654.us-central1.run.app/api/config | python3 -m json.tool | head -n 30
```

Confirm:
- `"live_mode": true`
- `"agents": {"basic": true, "kc": true, "scaled": true}`
- `len(all_table_names) == 128` (`40` bronze, `40` silver, `20` gold, `28` reference/views/staging/snapshots/audit)
- `"dataset_map"` maps `staging_ → retail_staging`, `snapshot_ → retail_snapshots`, `audit_ → retail_audit`

---

## 2. Narrative Arc (20-Minute Walkthrough)

> **Core Thesis:** *"Every retailer wants AI agents. When an agent only has 5 tables, it looks great in a prototype. When you expose that same agent to 128 tables across POS, E-Commerce, and ERP systems without metadata, it drowns in ambiguity. Google Cloud Knowledge Catalog gives the agent the semantic map, business glossary, lineage, and data quality context to reason accurately at enterprise scale."*

### Act 1 — The Prototype Promise (Tier 1: Baseline, ~4 min)
1. Open **`https://retail-kc-demo-ui-live-98236392654.us-central1.run.app`** and sign in with Google.
2. Select the **Basic Agent** tab (`5` curated Gold tables hardcoded in prompt).
   - Point out the 3D visualization: only 5 bright Gold nodes are illuminated.
3. Click or ask **Q1 (Tier 1.1)**:
   > *"What are our top 5 customers by total relationship value?"*
   - **Result:** Basic Agent queries `retail_gold_nokc.gold_customer_360` in ~7 seconds and returns the top 5 customers (`CUST-00016000`, `CUST-00010000`, etc.) with exact loyalty, BNPL, store card, and VIP balances.
4. Click or ask **Q2 (Tier 1.2)**:
   > *"Give me a breakdown of our bnpl_plan assortment by product type and risk rating."*
   - **Result:** Basic, Scaled, and KC-Guided agents all answer accurately from `gold_bnpl_plan_summary`.
   - **Takeaway:** *"This is not a model intelligence problem. All three agents use Gemini 2.5 Pro. When the table is obvious, all three succeed."*

---

### Act 2 — The Enterprise Scale Problem (Tier 2: Disambiguation, DQ Trust & Governance, ~8 min)
1. Switch to the **Scaled Agent** tab (`128` `_nokc` table names across ORION POS, LUMEN SFCC, and HELIOS SAP S/4HANA — zero descriptions, zero glossary definitions, zero DQ scans).
   - Point out the 3D visualization: 128 unlabelled table nodes across Bronze, Silver, Gold, and Reference rings.
2. Ask **Q6 (Tier 2.1 — Table Disambiguation: Return Fraud vs. Promo Abuse)**:
   > *"Show me return fraud and promo abuse trends over the past year, including both monthly fraud alert trends and promo abuse risk scoring by customer segment."*
   - **Basic Agent:** Fails immediately — its 5 Gold tables contain no fraud or promo-abuse data.
   - **Scaled Agent:** Sees `bronze_fraud_alerts`, `silver_fraud_alerts`, `gold_return_fraud_analytics`, `silver_promo_abuse_cases`, `gold_promo_fraud_scoring` with no descriptions. It burns multiple `INFORMATION_SCHEMA` / `run_sql` calls guessing schemas, queries only one dimension or misses PAIR (`Promo & Return Abuse Incident Report`) and `Restricted` governance context.
   - **KC-Guided Agent:** Calls `search_entries` + `lookup_context`, discovers both `gold_return_fraud_analytics` (monthly fraud alert trends) and `gold_promo_fraud_scoring` (segment-level promo abuse risk & PAIR filings), queries both, and cites the **PAIR** glossary definition and **Restricted** classification.
3. Ask **Q8 (Tier 2.3 — Data Quality Trust: Return-Risk Score)**:
   > *"What's the average Return-Risk score across our bnpl_plan assortment, and should we trust this number?"*
   - **Basic & Scaled Agents:** Compute the raw numeric average (`~12–78` depending on risk tier) from `gold_bnpl_plan_summary` (or `_nokc` tables) and blindly tell the user to trust it (or admit they have no way to verify data quality).
   - **KC-Guided Agent:** Computes the average **and** inspects Knowledge Catalog DQ rules and scan results (`vw_dq_scorecard` / `vw_dq_failed_rules` / `Loyalty & Return-Risk Score` glossary rule requiring scores in the `1–100` range), flagging that raw `bronze_bnpl_plans` contains dirty out-of-range scores (`0`, `150`, `999`, `1200`, and `NULL`) filtered during Silver curation.
4. Ask **Q10 (Tier 2.5 — Regulatory & Working Capital Thresholds)**:
   > *"Are we meeting our working capital adequacy requirements? What's our buffer above the minimum?"*
   - **Basic Agent:** Fails — no access to `gold_working_capital_adequacy`.
   - **Scaled Agent:** Queries `gold_working_capital_adequacy` (`10.0%` CWCR) but has no idea what Northwind's minimum requirement (`4.5%` base + `2.5%` seasonal buffer = `7.0%` fully loaded minimum) is because that threshold lives in the Knowledge Catalog Business Glossary (`[Retail] Core Working Capital Ratio (CWCR)`), not in the SQL table columns.
   - **KC-Guided Agent:** Calls `search_entries` and `lookup_context` on both `gold_working_capital_adequacy` and the **CWCR** glossary term, calculating the exact **+3.0 percentage point buffer** above the `7.0%` minimum and citing the `Annual Omnichannel Retail Filing` aspect.

---

### Act 3 — Cross-Domain Discovery & Lineage (Tier 3: Multi-System Synthesis, ~8 min)
1. Ask **Q11 (Tier 3.1 — VIP Member Cross-Domain Exposure + Lineage)**:
   > *"For our VIP loyalty members, what's their total exposure including loyalty_balances, bnpl_plans, and investments, and which upstream source systems feed this data?"*
   - **Basic Agent:** Can query `gold_customer_360` balances, but has **zero lineage visibility** — it cannot identify that retail POS/BNPL originates in **ORION** (NCR POS on IBM i) and VIP assortment AUM originates in **LUMEN** (Salesforce Commerce Cloud).
   - **Scaled Agent:** Either queries only `silver_vip_members` (missing ORION POS/BNPL balances) or cannot trace upstream source systems (`ORION` + `LUMEN` → `bronze_*` → `silver_*` → `gold_customer_360`) because `_nokc` has no Dataplex lineage.
   - **KC-Guided Agent:** Discovers `gold_customer_360` and `gold_vip_member_revenue`, calls `get_lineage` to trace the 2-hop pipeline (`ORION` `bronze_customers`/`bronze_loyalty_accounts`/`bronze_bnpl_plans` + `LUMEN` `bronze_vip_members` → `silver_*` → `gold_customer_360`), and cites Sensitive PII policy tags.
2. Ask **Q12 (Tier 3.2 — Store Omnichannel Revenue across POS + Loyalty)**:
   > *"Which stores generate the most revenue when you include both retail POS and loyalty management?"*
   - **Basic Agent:** Fails — lacks `gold_store_performance`, `gold_promo_margin_impact`, and `vw_store_omnichannel_performance`.
   - **Scaled Agent:** Queries only `gold_store_performance` (in-store POS only) or guesses joins across raw tables, missing the governed omnichannel view/join with `gold_promo_margin_impact` / `gold_vip_member_revenue`.
   - **KC-Guided Agent:** Searches Knowledge Catalog, discovers `vw_store_omnichannel_performance` alongside `gold_store_performance` and `gold_promo_margin_impact`, and presents unified store + digital loyalty revenue with full source attribution.
3. Ask **Q14 (Tier 3.4 — Multi-Table Seasonal Markdown & Delinquency Stress Test)**:
   > *"If seasonal apparel markdowns and BNPL defaults increased 5%, what would happen to our working capital ratios?"*
   - **Basic Agent:** Fails — lacks `gold_working_capital_adequacy`, `gold_bnpl_delinquency_analysis`, and `gold_markdown_risk_var`.
   - **Scaled Agent:** Overwhelmed by multi-table synthesis across 3 source domains (HELIOS `gold_working_capital_adequacy`, ORION `gold_bnpl_delinquency_analysis`, LUMEN `gold_markdown_risk_var`) and lacks risk-weight/loss-absorption definitions.
   - **KC-Guided Agent:** Searches across all three domains, retrieves glossary formulas (`CWCR`, `RAIA`, `MVaR`, `BNPL Bad-Debt Write-Off`), queries all three Gold tables, and computes the post-shock working capital ratio impact.

---

## 3. What to Highlight in the UI After Every KC Agent Response

1. **Tool Call Chips (`search_entries`, `lookup_context`, `get_lineage`, `run_sql`)**:
   - Show that the KC agent **searches semantically and reads catalog context before writing SQL**, resulting in fewer wasted SQL retries than the Scaled agent.
2. **Clickable Entity & Glossary Links**:
   - Every table name (`gold_customer_360`, `gold_working_capital_adequacy`, etc.) and glossary badge (`CWCR`, `MVaR`, `PAIR`, `SIV`, `GTIN-13`) in the chat response links directly to the live **Dataplex Knowledge Catalog entry** in `alitch-ca-demo`.
3. **3D Point-Cloud Animation**:
   - Watch the amber/blue discovery pulses connect the Business Glossary and Lineage rings to the exact Gold/Silver tables used in the query.
