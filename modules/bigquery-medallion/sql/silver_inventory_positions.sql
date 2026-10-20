CREATE OR REPLACE TABLE `${project_id}.retail_silver.silver_inventory_positions` AS
SELECT
  holding_id,
  assortment_id,
  security_id,
  ROUND(ABS(quantity), 4) AS quantity,
  ROUND(ABS(market_price), 2) AS market_price,
  ROUND(ABS(market_value), 2) AS market_value,
  ROUND(ABS(cost_basis), 2) AS cost_basis,
  ROUND(market_value - cost_basis, 2) AS unrealized_gain_loss,
  asset_class,
  sector,
  as_of_date,
  ROUND(SAFE_DIVIDE(market_value - cost_basis, cost_basis), 4) AS return_pct,
  created_at,
  source_system,
  CURRENT_TIMESTAMP() AS silver_loaded_at
FROM `${project_id}.retail_bronze.bronze_inventory_positions`
WHERE holding_id IS NOT NULL
  AND assortment_id IS NOT NULL
  AND security_id IS NOT NULL
