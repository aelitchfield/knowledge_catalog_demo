# Agent Persistent Memory (`STATE.md`)

## Current Phase
- **Phase**: P0 Complete — Stopped at **🛑 GATE 1** awaiting user approval.
- **Branch**: `main` (will checkout `-b retail-refactor` as first action of P1).
- **Modified existing files**: 0 (created `RECON.md`, `RETAIL_REFACTOR_PLAN.md`, `tools/retail_mapping.json`, `STATE.md`).

## Summarized Files (DO NOT RE-READ)
1. `deploy-bq.sh` (97 lines): Creates 9 `fsi_*` datasets (`fsi_bronze`, `fsi_silver`, `fsi_gold`, `fsi_scan_results`, `fsi_staging`, `fsi_snapshots`, `fsi_audit`, `fsi_reference`, `fsi_dashboards`) in `us`, runs 128 SQL files from `modules/bigquery-{medallion,reference,dashboards}/sql/*.sql` via `bq query` after substituting `${project_id}`. Supports `--refresh`.
2. `deploy-bq-nokc.sh` (76 lines): Creates 8 `fsi_*_nokc` shadow datasets (`fsi_bronze_nokc`..`fsi_audit_nokc`, no `scan_results`) and runs the 128 SQL files rewriting `fsi_<tier>` to `fsi_<tier>_nokc`.
3. `post_deploy.sh` (80 lines): Runs 15 governance steps in `scripts/` (`00`..`05`, `07`..`13`, `15`, `16`) after checking `common.get_access_token()`.
4. `modules/bigquery-medallion/sql/bronze_customers.sql`: Generates deterministic rows via `UNNEST(GENERATE_ARRAY(...))` with `CUST-00000001` IDs and `MOD(n, ...)` intentional defects (e.g. `MOD(n, 50)=0` NULL DOB, `MOD(n, 80)=0` unformatted SSN).
5. `scripts/common.py`: Encodes tri-region model (`location="us-central1"`, `multi_region="us"`, `entry_type_location="global"`), `GLOSSARY_ID`, `SCAN_TABLES` (100 tables), `SCAN_DATASETS` (8 datasets), `BRONZE_TABLES` (40), `SILVER_TABLES` (40), `GOLD_TABLES` (20), `ALL_TABLES` (128), `scan_id()`.
6. `scripts/00_create_dataplex_infra.py`: Creates 9 entry types (`db2-*`, `temenos-*`, `sap-*`), 7 marker aspects, 7 custom aspects (`fsi-*`), and 3 entry groups (`atlas-core-banking`, `fortuna-wealth-mgmt`, `argus-finance-risk`).
7. `scripts/01_create_glossary.py`: Creates glossary, 10 L1 + 18 L2 = 28 categories, 10 contacts, 84 terms (72 core + 12 `-abbr`), 14 synonym links, 67 related links, 181 column definition links.
8. `scripts/12_enrich_glossary.py`: Patches HTML `dataplex-types.global.overview` onto 83 glossary terms (`OVERVIEWS` dict).
9. `scripts/02_create_scans.py`..`16_create_policy_tags.py`:
   - `02`: 100 profile + 100 table insights + 100 quality + 8 dataset insights = 308 DataScans.
   - `03`: 3 source systems (`SYSTEMS`) with 5+4+4=13 detailed custom table entries.
   - `04`: Applies custom aspects to all 128 tables + column-level PII aspects (`PII_TERMS`, 16 terms).
   - `05`: 5 data products (`PRODUCTS`).
   - `07`: 5 lineage processes (`atlas_src`=14, `fortuna_src`=13, `argus_src`=13, `l4`=40 bronze→silver, `l5`=45 silver→gold across 17 gold tables = 125 links total).
   - `09`: 5 personas, 24 SQL queries.
   - `10`: `RULE_LIBRARY_ID="fsi-rule-library-global"`, 10 `TEMPLATES`.
   - `15`: 6 dirty data `INJECTIONS` into `bronze_loans`, `bronze_accounts`, `bronze_customers`, `bronze_securities`, `bronze_credit_cards`, `bronze_wire_transfers`.
   - `16`: Reads `FSI_TAXONOMY_DISPLAY_NAME` (will become `RETAIL_TAXONOMY_DISPLAY_NAME`), creates 4 policy tags (`highly-sensitive`, `sensitive`, `confidential`, `internal`) and tags 32 columns.
10. `agents/agent_basic/agent.py`: ADK agent (`gemini-2.5-flash`) with `run_sql` tool and hardcoded 5 `_nokc` gold tables; logs to `BigQueryAgentAnalyticsPlugin`.
11. `website-live/app.py`: Flask + WebSocket backend reading `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `BASIC_AGENT_ID`, `SCALED_AGENT_ID`, `KC_AGENT_ID`, `OAUTH_CLIENT_ID`.

## Target GCP Environment Findings (`alitch-ca-demo`)
- Project Number: `98236392654` | Billing: `billingAccounts/018FA4-AF46D9-9DE300` (Enabled) | Active user: `admin@aelitchfield.altostrat.com` (`roles/owner`).
- All 11 required APIs are already enabled.
- Both Org Policies (`iam.allowedPolicyMemberDomains` → `allowAll: true`, `run.managed.requireInvokerIam` → `enforce: false`) are already overridden at the project level.
- **Workaround Required for `bq` CLI**: Export `GOOGLE_API_USE_CLIENT_CERTIFICATE=false` and `CLOUDSDK_CONTEXT_AWARE_USE_CLIENT_CERTIFICATE=false` in all shell scripts calling `bq` to avoid Python 3.14 mTLS helper segfault (`-11`).
- Existing resources in `alitch-ca-demo`: `fsi_*` and `insurance_*` datasets, `db2-*`/`temenos-*`/`sap-*`/`fsi-*` entry & aspect types, `meridian-national-bank-glossary-us`. Zero `retail_*` / `retail-` collisions.
