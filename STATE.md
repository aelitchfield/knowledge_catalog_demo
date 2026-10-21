# STATE.md — Retail KC Demo Refactor Memory

## RESUME HERE — 2026-10-21 (F1–F5 Local Complete + Verified; Cloud Deploy Ready on Auth Refresh)

### DONE
- **P0–P6 + Phases A–E Audit**: 18 BigQuery datasets (`10` governed `retail_*` + `8` `retail_*_nokc` shadow), 128 tables/views, 9 Dataplex governance pillars, 6 NEXUS cross-cloud catalog entries + 14 lineage links, 3 Vertex AI Agent Engine instances (`basic=2946493525224587264`, `scaled=1975967805526245376`, `kc=8060330902103785472`), and Cloud Run UI (`https://retail-kc-demo-ui-live-98236392654.us-central1.run.app`).
- **Keyring & Canonical URL Directives**:
  - Enforced `--password-store=basic --use-mock-keychain` on every headless Chrome invocation (zero GNOME Keyring / Secret Service prompts).
  - Verified via `grep -rn "762777230453"` that `762777230453` does **not** exist in any file in the repo (it was a one-off terminal typo). All files (`STATE.md`, `tools/validate.sh`, `tools/verify_p6.py`, `tools/run_bcd_tier_matrix.py`, `tools/run_live_f1_to_f5.sh`, `scripts/config.json`) use the canonical URL `https://retail-kc-demo-ui-live-98236392654.us-central1.run.app`.
- **F1 (Blocker — Tier chips produce no output) — FIXED & VERIFIED (`3a48c29`)**:
  - **Root cause**: `sendPreset(q)` in `index.html` set `document.getElementById('chatInput').value = q` and called `chatManager.send()`, but `chatManager.send()` in `website-live/static/chat.js` unconditionally ran `this.inputEl.value = '';` **before** `const question = text.trim();`, wiping the input before reading it. Additionally, `.hidden { display: none !important; }` was missing from `styles.css`.
  - **Fix**: `chatManager.send(presetText)` now accepts `presetText` directly (`const raw = (typeof presetText === 'string' && presetText.length > 0) ? presetText : (this.inputEl ? this.inputEl.value : '');`) before clearing the input, immediately renders the working bubble, closes any prior WebSocket, and awaits `_checkLiveMode()` if needed. Added delegated click handler on `#presetQuestions` and `.preset-num { pointer-events: none; }`.
  - **Headless Chrome Verification**: Clicked all **16/16** preset chips across all 4 tabs (`merchandising` `#1-#4`, `customer` `#1-#4`, `privacy` `#1-#4`, `multicloud` `#1-#4`) in headless Chrome (`--password-store=basic --use-mock-keychain`) and verified streamed WebSocket tool calls + markdown responses + active graph nodes for every chip (`logs/ui_f1_f3_f4_verification.json`).
- **F2 (Phase E Option 1 — Purge FSI semantics from SQL data) — CODE COMPLETE & COMMITTED (`d07e042`)**:
  - Wrote and executed [`tools/apply_phase_e_option1.py`](file:///home/aelitchfield/knowledge_catalog_demo/tools/apply_phase_e_option1.py) across **34 SQL files** (`33` base generator/gold SQL files + `gold_inventory_turnover_coverage.sql`) and updated [`scripts/02_create_scans.py`](file:///home/aelitchfield/knowledge_catalog_demo/scripts/02_create_scans.py), [`scripts/10_create_rule_library.py`](file:///home/aelitchfield/knowledge_catalog_demo/scripts/10_create_rule_library.py), and [`scripts/15_inject_dirty_data.py`](file:///home/aelitchfield/knowledge_catalog_demo/scripts/15_inject_dirty_data.py).
  - Eliminated all FSI strings (`Pass`/`Special Mention`/`Substandard`/`Doubtful` → `Low`/`Watch`/`Elevated`/`High Risk`; `HELOC`/`SBA`/`EXTENDED_FINANCING` → `PAY_IN_4`/`MONTHLY_3M`/`MONTHLY_6M`/`SEASONAL_PROMO_12M`/`APPLIANCE_FINANCING_18M`/`VIP_FLEX_PAY`; `ROTH_IRA`/`401K` → `POINTS_REWARDS`/`VIP_CASHBACK`/`STORE_CREDIT`/`GIFT_WALLET`/`EMPLOYEE_PERKS`; `CET1` → `Core Working Capital`; `US Large Cap Equity` → `Apparel & Outerwear`, etc.).
  - Replaced FICO `567–580` (`300–850`) with `1–100` `return_risk_score` correlated by risk tier (`Low ~12`, `Watch ~35`, `Elevated ~58`, `High Risk ~82`), BNPL balances `$35–$1,900` (avg `~$280`), overdue review rates varying by tier (`Low ~1%`, `Watch ~4%`, `Elevated ~9%`, `High Risk ~18%`), and realistic retail loyalty balances (`$15–$600`).
  - Preserved all intentional DQ defects (`MOD(n, 50)=0` NULL DOBs, `MOD(n, 80)=0` unformatted TINs, `MOD(n, 500)=0` customer dupes, `MOD(n, 67)=0` bad GTINs in `bronze_product_skus`, plus all 6 dirty data injections in `15_inject_dirty_data.py`).
- **F3 (NEXUS graph — too many edges & label collisions) — FIXED & VERIFIED (`4ca6d2a`)**:
  - Removed the `activeBQ × activeSF` cartesian-product loop and radial center beams for `snowflake` nodes in [`website-live/static/visualization.js`](file:///home/aelitchfield/knowledge_catalog_demo/website-live/static/visualization.js).
  - Cross-cloud chips now draw **10** cyan dashed edges; stress test with 40 BQ + 6 NEXUS nodes active reduced cyan edges from **246** to **11** (strictly registered `NEXUS_TARGETS` lineage links).
  - Added bounding-box label collision de-confliction + viewport bounds clamping so active node labels never overlap or clip off-screen.
- **F4 (NEXUS fully absent from Basic & Scaled) — FIXED & VERIFIED (`7512a68`)**:
  - Removed NEXUS nodes (`visibleSfNodes: 0`), cyan edges (`crossEdges: 0`), NEXUS cluster boundary, `"NEXUS · Snowflake (External)"` legend entry (`4` legend items: `Gold (20)`, `Silver (40)`, `Bronze (40)`, `Other (28)`), and the `CROSS-CLOUD` tab (`3` tabs only) on `basic` and `scaled` views. `kc` view retains all 4 tabs, 5 legend items, and 6 NEXUS diamonds.
- **F5 (Harden Tier 2 questions `M_T2` & `C_T2`) — CODE COMPLETE & COMMITTED (`8f9eefb`)**:
  - Updated `M_T2` and `C_T2` in [`website-live/static/index.html`](file:///home/aelitchfield/knowledge_catalog_demo/website-live/static/index.html), [`tools/run_bcd_tier_matrix.py`](file:///home/aelitchfield/knowledge_catalog_demo/tools/run_bcd_tier_matrix.py), and [`demo/demo_questions.md`](file:///home/aelitchfield/knowledge_catalog_demo/demo/demo_questions.md) to require Bronze/Silver/Gold disambiguation, 4–5 table cross-domain joins on non-obvious keys, and glossary-mapped business terms.

### CURRENT BLOCKER (AGENTS.md Rule 7)
- **GCP / ADC Auth Expired**: Both `gcloud auth print-access-token` and Application Default Credentials (`~/.config/gcloud/application_default_credentials.json`) return `Reauthentication is needed. Please run gcloud auth login`.
- **Single Resumable Command Ready**: Created [`tools/run_live_f1_to_f5.sh`](file:///home/aelitchfield/knowledge_catalog_demo/tools/run_live_f1_to_f5.sh) which immediately executes:
  1. F2 backgrounded (`deploy-bq.sh --refresh`, `deploy-bq-nokc.sh --refresh`, `10_create_rule_library.py`, `02_create_scans.py`, `15_inject_dirty_data.py` → `logs/f2_phase_e.log`).
  2. One Cloud Run redeploy (`retail-kc-demo-ui-live`) covering F1 + F3 + F4 + F5, followed by live `/api/config` smoke test (with automatic rollback to `retail-kc-demo-ui-live-00004-fbd` if anything fails).
  3. Post-F2 3-agent run on `"Give me an overview of customer risk across the retailer"`.
  4. F5 6/9-cell Tier 2 matrix re-run (`python3 tools/run_bcd_tier_matrix.py --only-t2`).

### ENVIRONMENT FACTS to reload
- **Project**: `alitch-ca-demo` / project number `98236392654` (`us-central1` region, `us` multi-region)
- **Agents (`us-central1` ReasoningEngines)**:
  - `basic`: `2946493525224587264` (`[Retail] retail-agent-basic`, secret `retail-basic-agent-id`)
  - `scaled`: `1975967805526245376` (`[Retail] retail-agent-scaled`, secret `retail-scaled-agent-id`)
  - `kc`: `8060330902103785472` (`[Retail] retail-agent-kc`, secret `retail-kc-agent-id`)
- **Cloud Run URL**: `https://retail-kc-demo-ui-live-98236392654.us-central1.run.app` (rollback revision: `retail-kc-demo-ui-live-00004-fbd`)
- **Chrome Headless Flags (Mandatory)**: `--password-store=basic --use-mock-keychain`
- **`bq` CLI mTLS workaround**: Requires `GOOGLE_API_USE_CLIENT_CERTIFICATE=false` and `CLOUDSDK_CONTEXT_AWARE_USE_CLIENT_CERTIFICATE=false`

### NEXT ACTION ON RESUME
Run `gcloud auth login && gcloud auth application-default login`, then execute `bash tools/run_live_f1_to_f5.sh`.

---

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
- **Phase D (Dark Theme & NEXUS Diamond Canvas Visualization)**: COMPLETE & COMMITTED (`ee44de3`).
  - Defined CSS custom properties in `website-live/static/styles.css` (`--bg: #0d1117`, `--surface: #161b22`, `--border: #30363d`, `--text: #e6edf3`, `--text-muted: #8b949e`, `--accent: #3fb950`, `--node-gold: #ffd33d`, `--node-silver: #a5b4fc`, `--node-bronze: #ff9f43`, `--node-other: #8b949e`, `--node-nexus: #00e5ff`) with WCAG AA/AAA body contrast (`15.8:1` `#e6edf3` on `#0d1117`, `14.3:1` `#e6edf3` on `#161b22`, `6.0:1` `#8b949e` on `#0d1117`).
  - Updated `website-live/static/visualization.js`: rendered NEXUS Snowflake nodes as cyan `#00e5ff` diamonds in a separated `NEXUS · Snowflake (External)` boundary, wired 14 cross-cloud lineage links in `NEXUS_TARGETS`, and themed canvas rings, lineage lines, glossary arcs, labels, and tooltips for dark mode.
- **Batched Cloud Run Redeploy & Smoke Test (`retail-kc-demo-ui-live-00004-fbd`)**: COMPLETE & VERIFIED.
  - Deployed single batched Cloud Run revision `retail-kc-demo-ui-live-00004-fbd` (rollback revision `retail-kc-demo-ui-live-00003-vtx` preserved).
  - Verified `GET /api/config` returns `200 OK`, `environment="demo"`, `all_table_names == 128` (`40` bronze, `40` silver, `20` gold, `28` ref), `snowflake_enabled=True`, `snowflake_live=False`, `snowflake_tables` (6 `nexus_*` tables), and `dataset_map` (`retail_audit`, `retail_snapshots`, `retail_staging`).
  - Verified all 40 live queries in `logs/bcd_tier_matrix.json` (`12 retail questions × 3 agents = 36` + `4 Cross-Cloud questions × KC = 4`):
    - **Tier 1 (`M_T1`, `C_T1`, `P_T1`)**: Basic `3/3 PASS`, Scaled `3/3 PASS`, KC `3/3 PASS`.
    - **Tier 2 (`M_T2`, `C_T2`, `P_T2`)**: Basic `0/3 PASS` (tables outside 10-table prompt); Scaled `2/3 PASS` (heavy 7–10 tool-call exploration on `M_T2`/`C_T2`, timed out on `P_T2` scanning unenriched tables); KC `3/3 PASS`.
    - **Tier 3 (`M_T3`, `C_T3`, `P_T3`)**: Basic `0/3 PASS`; Scaled `0/3 PASS` (lacks Dataplex certification, lineage, stewards, PCI/CCPA tags); KC `3/3 PASS`.
    - **Tier 4 (`M_T4`, `C_T4`, `P_T4`)**: Basic `0/3 PASS` (partial single-table on `M_T4`, fails `C_T4`/`P_T4`); Scaled `1/3 PASS` (fails `M_T4`/`P_T4`, partial uncertified SQL on `C_T4`); KC `3/3 PASS`.
    - **Cross-Cloud (`X_T1`–`X_T4`, KC only)**: KC `4/4 PASS` (discovers 6 `nexus_*` Snowflake tables, governance aspects, cross-cloud lineage, and joins catalog metadata with `retail_gold` SQL).
- **Phase E (Data Semantics Audit ONLY — `PHASE_E_DATA_AUDIT.md`)**: COMPLETE & COMMITTED.
  - Audited all 128 SQL files and documented every surviving FSI literal string, uncorrelated random generator, and mortgage/wealth numeric distribution in [`PHASE_E_DATA_AUDIT.md`](file:///home/aelitchfield/knowledge_catalog_demo/PHASE_E_DATA_AUDIT.md) (no data or deploy scripts modified).
  - **STOPPED at Phase C2 / Post-Phase-E per autonomy rules** — awaiting user review of `PHASE_E_DATA_AUDIT.md` and Snowflake credentials if Phase C2 is desired.

## Summarized Files (Do NOT Re-Read)
- `deploy-bq.sh`, `deploy-bq-nokc.sh`, `deploy-full.sh`, `post_deploy.sh`, `clean_up.sh`: Updated with mTLS client-cert disable exports (`GOOGLE_API_USE_CLIENT_CERTIFICATE=false`, `CLOUDSDK_CONTEXT_AWARE_USE_CLIENT_CERTIFICATE=false`), `RETAIL_TAXONOMY_DISPLAY_NAME="Retail Demo Sensitivity Taxonomy (alitch)"`, `[Retail] ` dataset descriptions, and 4 required dataset labels (`use-case=retail`, `demo=retail-knowledge-catalog`, `owner=alitch`, `env=demo`).
- `modules/bigquery-{medallion,reference,dashboards}/main.tf`: Updated dataset IDs, table lists, `[Retail] ` descriptions, and 4 dataset labels.
- `modules/bigquery-medallion/sql/*.sql`, `modules/bigquery-reference/sql/*.sql`, `modules/bigquery-dashboards/sql/*.sql`: All 128 SQL files renamed and refactored with consistent retail string literals.
- `scripts/common.py` & `scripts/00_create_dataplex_infra.py` .. `scripts/16_create_policy_tags.py`: Refactored to `retail_` / `retail-` IDs and `[Retail] ` display names/descriptions.
- `agents/agent_{basic,scaled,kc}/agent.py` & `agents/deploy_agents.sh`: Fixed `BigQueryAgentAnalyticsPlugin` import, updated `_BASE_SUFFIXES` and `_OTHER_TABLES` in `agent_scaled` (128 tables), set `[Retail] ` display names and `retail-*-agent-id` secrets.
- `website-live/app.py`, `website-live/deploy.sh`, `website-live/static/index.html`, `website-live/static/static-responses.json`: Updated to Northwind Retail Group branding, retail narratives, and `[Retail] ` glossary link matching.
- `demo/demo_questions.md`, `demo/demo_script.md`, `eval/metrics.py`, `eval/run_eval.py`, `eval/test_cases.yaml`: Refactored to retail scenarios and metrics.
