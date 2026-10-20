CREATE OR REPLACE TABLE `${project_id}.retail_gold.gold_financial_summary` AS
SELECT
  'Assets' AS category,
  'Cash and Due From Retailers' AS line_item,
  ROUND(SUM(CASE WHEN account_type IN ('POINTS_REWARDS', 'VIP_CASHBACK') THEN current_balance * 0.05 ELSE 0 END), 0) AS amount
FROM `${project_id}.retail_silver.silver_loyalty_accounts`
WHERE account_status = 'Active'
UNION ALL
SELECT 'Assets', 'Total BNPL Plans and Leases',
  ROUND(SUM(current_balance), 0)
FROM `${project_id}.retail_silver.silver_bnpl_plans`
UNION ALL
SELECT 'Assets', 'Investment Product SKUs',
  ROUND(SUM(market_value), 0)
FROM `${project_id}.retail_silver.silver_inventory_positions`
UNION ALL
SELECT 'Liabilities', 'Total Loyalty Balances',
  ROUND(SUM(current_balance), 0)
FROM `${project_id}.retail_silver.silver_loyalty_accounts`
WHERE account_status = 'Active'
UNION ALL
SELECT 'Liabilities', 'Other Borrowed Funds',
  ROUND(SUM(current_balance) * 0.15, 0)
FROM `${project_id}.retail_silver.silver_loyalty_accounts`
WHERE account_status = 'Active'
UNION ALL
SELECT 'Softlines', 'Total Equity Capital',
  ROUND(MAX(capital_amount), 0)
FROM `${project_id}.retail_silver.silver_working_capital`
WHERE capital_component = 'Total Capital'
  AND reporting_date = (SELECT MAX(reporting_date) FROM `${project_id}.retail_silver.silver_working_capital`)
