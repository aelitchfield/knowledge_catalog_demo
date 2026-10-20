CREATE OR REPLACE TABLE `${project_id}.retail_silver.silver_merch_assortments` AS
SELECT
  assortment_id,
  wm_client_id,
  assortment_name,
  account_type,
  tax_status,
  ROUND(ABS(market_value), 2) AS market_value,
  ROUND(ABS(cost_basis), 2) AS cost_basis,
  ytd_return,
  inception_return,
  benchmark_id,
  advisor_id,
  template_assortment_id,
  inception_date,
  status,
  ROUND(SAFE_DIVIDE(market_value - cost_basis, cost_basis), 4) AS total_return_pct,
  created_at,
  source_system,
  CURRENT_TIMESTAMP() AS silver_loaded_at
FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY assortment_id ORDER BY created_at DESC) AS rn
  FROM `${project_id}.retail_bronze.bronze_merch_assortments`
)
WHERE rn = 1
  AND assortment_id IS NOT NULL
  AND wm_client_id IS NOT NULL
