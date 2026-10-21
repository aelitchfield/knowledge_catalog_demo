# STATE.md — Retail KC Demo Refactor Memory

## Current Phase
- **Phase P0 (Recon & Plan)**: COMPLETE & APPROVED (🛑 GATE 1 passed).
- **Phase P1 (Local Refactor)**: COMPLETE & COMMITTED on branch `retail-refactor`.
  - `tools/transform.py` renamed 102 `.sql` files and updated 189 files (4,308 replacements).
  - `tools/author_retail_glossary.py` generated `scripts/01_create_glossary.py` (28 categories prefixed `Retail — `, 84 terms prefixed `[Retail] `, 14 synonyms, 67 related links, 181 validated `DEFINITION_LINKS`) and `scripts/12_enrich_glossary.py` (84 HTML overviews).
  - `tools/update_governance_scripts.py` and `tools/finalize_retail_refactor.py` updated `scripts/00`..`16`, `deploy-bq*.sh`, `modules/bigquery-*/main.tf`, `agents/`, `demo/`, `eval/`, and `website-live/`.
  - Wrote [`RETAIL_MAPPING.md`](file:///home/aelitchfield/knowledge_catalog_demo/RETAIL_MAPPING.md).
  - Banking-term purge gate verified: **Tier A = 0 hits** (excluding English substring `merchandising`/`exercising`/`arising`), **Tier B = 7 hits** (all legitimate Git `branch` references).
  - All `.sh` (`bash -n`) and `.py` (`py_compile`) syntax checks passed.
- **Phase P2 (GCP Pre-Flight)**: COMPLETE & APPROVED (🛑 GATE 2 passed).
  - Enabled & verified all 13 required APIs on `alitch-ca-demo` (`98236392654`).
  - Wrote `scripts/config.json` (`project_id=alitch-ca-demo`, `project_number=98236392654`, `region=us-central1`, `multi_region=us`, `gcp_account_name=admin@aelitchfield.altostrat.com`).
  - Both org-policy overrides succeeded on `projects/98236392654`:
    - `iam.allowedPolicyMemberDomains` -> `allowAll: true`
    - `run.managed.requireInvokerIam` -> `enforce: false`
  - Vertex AI Agent Engine API (`us-central1`) returned HTTP 200.
  - Confirmed **0 `retail_*` / `retail-*` collisions** across BigQuery datasets, Dataplex glossaries, data products, ReasoningEngines, and Cloud Run services.
- **Phase P3 (Data Layer)**: COMPLETE, VERIFIED & COMMITTED (`753668c` on `retail-refactor`).
  - Executed `deploy-bq.sh` and `deploy-bq-nokc.sh` with 0 errors.
  - Verified via `tools/verify_p3.py`:
    - **18/18 datasets** (`10` governed `retail_*` + `8` `retail_*_nokc` shadow datasets) carry `[Retail] ` descriptions and all 4 required labels (`use-case=retail`, `demo=retail-knowledge-catalog`, `owner=alitch`, `env=demo`).
    - **128/128 governed tables & views** populated with **0 empty tables**.
    - **128/128 `_nokc` shadow tables** copied cleanly.
- **Phase P4 (Governance Layer)**: COMPLETE, VERIFIED & COMMITTED on `retail-refactor`.
  - Executed `post_deploy.sh` and verified all 9 governance pillars via `tools/verify_p4.py`:
    1. **Custom Entry Types (`global`)**: 9 (`retail-ibmi-*`, `retail-sfcc-*`, `retail-sap-*`).
    2. **Aspect Types (`global`)**: 14 (7 custom `retail-*` + 7 marker aspect types); applied 490+ aspect instances to tables and glossary terms.
    3. **Custom Source Entry Groups (`us`)**: 3 groups (`retail-orion-store-pos`, `retail-lumen-commerce-loyalty`, `retail-helios-merch-supply`), 3 instances, 3 schemas, 13 source tables.
    4. **Business Glossary (`us`, `retail-northwind-glossary-us` — `[Retail] Northwind Retail Business Glossary`)**: 28 categories (prefixed `Retail — `), 84 terms (prefixed `[Retail] `), 84 enriched HTML overviews, 81 term links (`synonym`/`related`), 180+ BQ `definition` links.
    5. **Data Products (`us`)**: 5 (`retail-customer-loyalty-360`, `retail-pricing-promo-margin`, `retail-merch-inventory`, `retail-privacy-consent-pci`, `retail-store-channel-performance`).
    6. **Lineage (`us`)**: 5 processes, 125 links.
    7. **Reusable Rule Library (`global`, `retail-rule-library-global`)**: 10 rule templates + 1 index entry.
    8. **DataScans (`us-central1`)**: 360 total (`128` profile, `132` insights, `100` quality) + published labels applied via `08_publish_scans.py` + dirty data injected via `15_inject_dirty_data.py`.
    9. **Policy Tag Taxonomy (`us`)**: `Retail Demo Sensitivity Taxonomy - alitch` (`projects/alitch-ca-demo/locations/us/taxonomies/6328323030724665961`), 4 policy tags, 32 columns tagged, `roles/datacatalog.categoryFineGrainedReader` granted to Agent Engine SA, Dataplex SA, Compute SA, and `admin@aelitchfield.altostrat.com`.
- **Phase P5 (Agents + Website)**: COMPLETE & COMMITTED on `retail-refactor`.
  - Deployed all 3 Vertex AI Agent Engine instances in `us-central1` and persisted IDs in Secret Manager:
    - `[Retail] retail-agent-basic`: `2946493525224587264` (`retail-basic-agent-id`)
    - `[Retail] retail-agent-scaled`: `1975967805526245376` (`retail-scaled-agent-id`)
    - `[Retail] retail-agent-kc`: `8060330902103785472` (`retail-kc-agent-id`)
  - Granted dataset access (`_nokc` datasets to basic & scaled; governed `retail_*` datasets + Dataplex/Lineage/MCP roles to KC; `WRITER` on `retail_agent_analytics` to all 3; `roles/datacatalog.categoryFineGrainedReader` on taxonomy `6328323030724665961` to all 3 per-agent `principal://` identities; `--condition=None` on project IAM bindings).
  - Stored OAuth 2.0 Web Client ID in Secret Manager (`retail-oauth-client-id`) and deployed Cloud Run service `retail-kc-demo-ui-live` in `us-central1` (revision `retail-kc-demo-ui-live-00002-fgn`):
    - Canonical URL: `https://retail-kc-demo-ui-live-98236392654.us-central1.run.app`
    - Regional Alias URL: `https://retail-kc-demo-ui-live-esoohbbsma-uc.a.run.app`
    - Verified `allUsers` bound to `roles/run.invoker`.
    - Fixed `DATASET_MAP`, `_RETAIL_DATASETS`, and `_DATASET_TO_TIER` in `website-live/app.py` (`retail_staging`, `retail_snapshots`, `retail_audit` replacing nonexistent `retail_supplementary`), bringing `/api/config` `all_table_names` to **128/128** (`40` bronze, `40` silver, `20` gold, `28` ref/staging/snapshots/audit).
- **Phase P6 (End-to-End Validation & Live 15×3 Tier Matrix)**: COMPLETE & VERIFIED via `tools/validate.sh`, `tools/verify_p6.py` (`logs/verify_p6.json`), and `tools/run_p6_tier_matrix.py` (`logs/p6_tier_matrix.json`).
  - Canonical Cloud Run URL (`https://retail-kc-demo-ui-live-98236392654.us-central1.run.app`) updated across `DEMO_SCRIPT.md`, `demo/demo_script.md`, `README.md`, `website-live/deploy.sh`, `tools/verify_p6.py`, and `tools/validate.sh`.
  - `clean_up.sh` syntax and retail resource safety verified (`bash -n clean_up.sh`).
  - Live 45-Query Tier Matrix (`15 questions × 3 agents`, zero prompt tuning):
    - **Tier 1 (Q01–Q05)**: Basic `5/5 PASS`; Scaled `4/5 PASS` (failed Q04 after 17 SQL queries across 14 tables due to "returns" vs "product returns" ambiguity); KC `5/5 PASS`.
    - **Tier 2 (Q06–Q10)**: Basic `0/5 PASS` (lacks Silver/Bronze/Supplementary tables and governance metadata); Scaled `0/5 PASS` (wrong table on Q07, false DQ trust on Q08/Q09, zero glossary/PAIR/CWCR/PCI-DSS context on Q06/Q10); KC `3/5 PASS` (passed Q06, Q08, Q10 with full glossary/DQ/lineage metadata; partial/failed Q07 by querying `silver_inventory_positions` instead of `gold_markdown_risk_var`; failed Q09 because `search_entries` returned custom source entry `custom:lumen-prod.DIGITAL_COMMERCE.PRODUCT_SKUS` first and KC tried querying it in BigQuery).
    - **Tier 3 (Q11–Q15)**: Basic `0/5 PASS` (lacks cross-domain tables, lineage, and PII policy tags); Scaled `0/5 PASS` (listed `_nokc` bronze tables as upstream systems on Q11, missed loyalty domain on Q12, zero SIV/EFR/HCRL governance on Q13, refused stress test on Q14, false join key `account_id = customer_id` across 15 SQLs on Q15); KC `3/5 PASS` (passed Q11 with LUMEN/ORION lineage, Q12 omnichannel POS+Loyalty, Q15 cross-sell with PII/PCI-DSS/CCPA governance; failed Q13 when 4-table LEFT JOIN returned 0 rows and stream ended without text summary; failed Q14 due to querying custom source entry `FINANCE_RISK.GL_ENTRIES` in BigQuery).
- **Phase A (Fix Agent 400 Blocker)**: COMPLETE, DEPLOYED (`retail-kc-demo-ui-live-00003-vtx`) & VERIFIED (`logs/phase_a_three_agents.json`).
  - Root cause: `website-live/app.py` and `eval/run_eval.py` omitted `"class_method"` in the `:streamQuery` payload; with `google-adk==2.8.0` and `google-cloud-aiplatform==2.6.0` registering 3 streaming methods (`stream_query`, `async_stream_query`, `streaming_agent_run_with_events`), Vertex AI Reasoning Engine returned `400 INVALID_ARGUMENT`.
  - Verified `"class_method": "async_create_session"` returns `200 OK` on all 3 ReasoningEngines before streaming.
  - Updated `website-live/app.py` and `eval/run_eval.py` to use `async_create_session` and `async_stream_query`, and added permanent `logger.error("streamQuery failed: agent=%s status=%d body=%s", ...)` in `website-live/app.py`.
  - Pinned `google-adk==2.8.0` and `google-cloud-aiplatform==2.6.0` across `agents/agent_{basic,scaled,kc}/requirements.txt` (and `mcp==1.30.0` in `agent_kc/requirements.txt`).
  - Redeployed `retail-kc-demo-ui-live` (revision `00003-vtx`) and verified all 3 agents return HTTP 200 and full answers on `"Give me an overview of customer risk across the retailer."`.
- **Phase B (Retail-ify Question Categories & API Fixes)**: COMPLETE.
  - Known-good rollback revision recorded before B+C1+D deploy: `retail-kc-demo-ui-live-00003-vtx`.
  - Replaced FSI tabs (`Executive Briefing | Risk & Compliance | Data Governance`) with 3 persona-mapped retail tabs (`MERCHANDISING & INVENTORY`, `CUSTOMER & LOYALTY`, `PRIVACY & COMPLIANCE`) × 4 difficulty tiers = 12 retail questions synchronized across `website-live/static/index.html` and `demo/demo_questions.md`.
  - Verified `dataset_map` (`retail_audit`, `retail_snapshots`, `retail_staging`), `all_table_names` (`128`), and `ENVIRONMENT_LABEL="demo"` in `website-live/app.py` and `website-live/deploy.sh`.
  - Deferred `gold_financial_summary → gold_store_channel_performance` rename per scope instructions (blast radius touches 18 repo files + deployed BQ tables, shadow `_nokc` tables, Dataplex DataProducts/Lineage/Scans, and deployed agent prompts).
- **Phase C1 (Cross-Cloud / NEXUS Catalog + Visual Layer)**: COMPLETE.
  - Created and executed `scripts/17_create_nexus_c1.py`: registered `us` entry group `retail-nexus-market-intel` (`[Retail] NEXUS — Syndicated Retail Market Intelligence (Snowflake)`), global entry/aspect types `retail-snowflake-{instance,schema,table}`, 6 retail NEXUS tables (`nexus_competitor_prices`, `nexus_category_market_share`, `nexus_consumer_panel`, `nexus_regional_demand_index`, `nexus_promo_calendar_benchmark`, `nexus_basket_affinity`), 48 governance aspect attachments (`cloud_platform="Snowflake"`, `data_residency="External / Non-GCP"`, `classification_level="Third-Party Licensed"`, `access_level="External Vendor Agreement"`), and 14 cross-cloud Data Lineage links to `retail_gold` tables.
  - Synchronized `snowflake/common_snowflake.py`, `snowflake/00_setup_nexus_data.py`, `snowflake/01_create_dataplex_infra.py`, and `agents/agent_kc/agent.py` with the 6 retail `SYNDICATED_INTEL.nexus_*` tables.
  - Updated `website-live/app.py`, `website-live/static/index.html`, and `website-live/static/chat.js`: `CROSS-CLOUD` tab is active ONLY on the KC Agent tab (with badge `"Catalog-only — live Snowflake query not connected"`), and renders as a disabled/ghosted chip with tooltip `"Requires Knowledge Catalog — this agent cannot discover data outside BigQuery."` on Basic and Scaled Agent tabs.
- **Phase D (Dark Theme & NEXUS Diamond Canvas Visualization)**: COMPLETE.
  - Defined CSS custom properties in `website-live/static/styles.css` (`--bg: #0d1117`, `--surface: #161b22`, `--border: #30363d`, `--text: #e6edf3`, `--text-muted: #8b949e`, `--accent: #3fb950`, `--node-gold: #ffd33d`, `--node-silver: #a5b4fc`, `--node-bronze: #ff9f43`, `--node-other: #8b949e`, `--node-nexus: #00e5ff`) with WCAG AA/AAA body contrast (`15.8:1` `#e6edf3` on `#0d1117`, `14.3:1` `#e6edf3` on `#161b22`, `6.0:1` `#8b949e` on `#0d1117`).
  - Updated `website-live/static/visualization.js`: rendered NEXUS Snowflake nodes as cyan `#00e5ff` diamonds in a separated `NEXUS · Snowflake (External)` boundary, wired 14 cross-cloud lineage links in `NEXUS_TARGETS`, and themed canvas rings, lineage lines, glossary arcs, labels, and tooltips for dark mode.

## Summarized Files (Do NOT Re-Read)
- `deploy-bq.sh`, `deploy-bq-nokc.sh`, `deploy-full.sh`, `post_deploy.sh`, `clean_up.sh`: Updated with mTLS client-cert disable exports (`GOOGLE_API_USE_CLIENT_CERTIFICATE=false`, `CLOUDSDK_CONTEXT_AWARE_USE_CLIENT_CERTIFICATE=false`), `RETAIL_TAXONOMY_DISPLAY_NAME="Retail Demo Sensitivity Taxonomy (alitch)"`, `[Retail] ` dataset descriptions, and 4 required dataset labels (`use-case=retail`, `demo=retail-knowledge-catalog`, `owner=alitch`, `env=demo`).
- `modules/bigquery-{medallion,reference,dashboards}/main.tf`: Updated dataset IDs, table lists, `[Retail] ` descriptions, and 4 dataset labels.
- `modules/bigquery-medallion/sql/*.sql`, `modules/bigquery-reference/sql/*.sql`, `modules/bigquery-dashboards/sql/*.sql`: All 128 SQL files renamed and refactored with consistent retail string literals.
- `scripts/common.py` & `scripts/00_create_dataplex_infra.py` .. `scripts/16_create_policy_tags.py`: Refactored to `retail_` / `retail-` IDs and `[Retail] ` display names/descriptions.
- `agents/agent_{basic,scaled,kc}/agent.py` & `agents/deploy_agents.sh`: Fixed `BigQueryAgentAnalyticsPlugin` import, updated `_BASE_SUFFIXES` and `_OTHER_TABLES` in `agent_scaled` (128 tables), set `[Retail] ` display names and `retail-*-agent-id` secrets.
- `website-live/app.py`, `website-live/deploy.sh`, `website-live/static/index.html`, `website-live/static/static-responses.json`: Updated to Northwind Retail Group branding, retail narratives, and `[Retail] ` glossary link matching.
- `demo/demo_questions.md`, `demo/demo_script.md`, `eval/metrics.py`, `eval/run_eval.py`, `eval/test_cases.yaml`: Refactored to retail scenarios and metrics.
