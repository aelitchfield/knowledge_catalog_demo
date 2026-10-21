CREATE OR REPLACE TABLE `${project_id}.retail_staging.staging_annual_omniretail_filing` AS
SELECT
  DATE_ADD('2024-03-31', INTERVAL CAST(FLOOR(n / 10.0) AS INT64) * 3 MONTH) AS reporting_date,
  CONCAT('OMNI-', CASE MOD(n, 10) WHEN 0 THEN 'BS-1' WHEN 1 THEN 'BS-2' WHEN 2 THEN 'BS-3' WHEN 3 THEN 'BS-4' WHEN 4 THEN 'WC-1' WHEN 5 THEN 'WC-2' WHEN 6 THEN 'IS-1' WHEN 7 THEN 'IS-2' WHEN 8 THEN 'IS-3' ELSE 'EQ-1' END) AS schedule_line,
  CASE MOD(n, 10) WHEN 0 THEN 'Consolidated Retail Assets' WHEN 1 THEN 'Merchandise Inventory SKUs' WHEN 2 THEN 'BNPL Installment Receivables' WHEN 3 THEN 'Unredeemed Loyalty Balances' WHEN 4 THEN 'Markdown-Exposed Inventory' WHEN 5 THEN 'Total Operating Capital' WHEN 6 THEN 'Gross Merchandise Revenue' WHEN 7 THEN 'Cost of Goods Sold (COGS)' WHEN 8 THEN 'Store & Fulfillment OpEx' ELSE 'Total Retail Operating Equity' END AS line_description,
  ROUND(5000000 + RAND() * 120000000, 0) AS amount,
  'Filed' AS status,
  TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL CAST(FLOOR(RAND() * 500 * 24 * 60) AS INT64) MINUTE) AS created_at
FROM UNNEST(GENERATE_ARRAY(1, 40)) AS n
