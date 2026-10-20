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
- **Phase P2 (GCP Pre-Flight)**: COMPLETE — STOPPED AT 🛑 GATE 2 awaiting user approval before P3.
  - Enabled & verified all 13 required APIs on `alitch-ca-demo` (`98236392654`).
  - Wrote `scripts/config.json` (`project_id=alitch-ca-demo`, `project_number=98236392654`, `region=us-central1`, `multi_region=us`, `gcp_account_name=admin@aelitchfield.altostrat.com`).
  - Both org-policy overrides succeeded on `projects/98236392654`:
    - `iam.allowedPolicyMemberDomains` -> `allowAll: true`
    - `run.managed.requireInvokerIam` -> `enforce: false`
  - Vertex AI Agent Engine API (`us-central1`) returned HTTP 200.
  - Confirmed **0 `retail_*` / `retail-*` collisions** across BigQuery datasets, Dataplex glossaries, data products, ReasoningEngines, and Cloud Run services.

## Summarized Files (Do NOT Re-Read)
- `deploy-bq.sh`, `deploy-bq-nokc.sh`, `deploy-full.sh`, `post_deploy.sh`, `clean_up.sh`: Updated with mTLS client-cert disable exports (`GOOGLE_API_USE_CLIENT_CERTIFICATE=false`, `CLOUDSDK_CONTEXT_AWARE_USE_CLIENT_CERTIFICATE=false`), `RETAIL_TAXONOMY_DISPLAY_NAME="Retail Demo Sensitivity Taxonomy (alitch)"`, `[Retail] ` dataset descriptions, and 4 required dataset labels (`use-case=retail`, `demo=retail-knowledge-catalog`, `owner=alitch`, `env=demo`).
- `modules/bigquery-{medallion,reference,dashboards}/main.tf`: Updated dataset IDs, table lists, `[Retail] ` descriptions, and 4 dataset labels.
- `modules/bigquery-medallion/sql/*.sql`, `modules/bigquery-reference/sql/*.sql`, `modules/bigquery-dashboards/sql/*.sql`: All 128 SQL files renamed and refactored with consistent retail string literals.
- `scripts/common.py` & `scripts/00_create_dataplex_infra.py` .. `scripts/16_create_policy_tags.py`: Refactored to `retail_` / `retail-` IDs and `[Retail] ` display names/descriptions.
- `agents/agent_{basic,scaled,kc}/agent.py` & `agents/deploy_agents.sh`: Fixed `BigQueryAgentAnalyticsPlugin` import, updated `_BASE_SUFFIXES` and `_OTHER_TABLES` in `agent_scaled` (128 tables), set `[Retail] ` display names and `retail-*-agent-id` secrets.
- `website-live/app.py`, `website-live/deploy.sh`, `website-live/static/index.html`, `website-live/static/static-responses.json`: Updated to Northwind Retail Group branding, retail narratives, and `[Retail] ` glossary link matching.
- `demo/demo_questions.md`, `demo/demo_script.md`, `eval/metrics.py`, `eval/run_eval.py`, `eval/test_cases.yaml`: Refactored to retail scenarios and metrics.
