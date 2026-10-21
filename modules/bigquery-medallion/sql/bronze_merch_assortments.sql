CREATE OR REPLACE TABLE `${project_id}.retail_bronze.bronze_merch_assortments` AS
SELECT
  CONCAT('PORT-', LPAD(CAST(n AS STRING), 8, '0')) AS assortment_id,
  CONCAT('WMC-', LPAD(CAST(CAST(FLOOR(n / 2.0) + 1 AS INT64) AS STRING), 7, '0')) AS wm_client_id,
  CASE MOD(n, 8)
    WHEN 0 THEN 'Spring Apparel Core' WHEN 1 THEN 'Outdoor & Activewear' WHEN 2 THEN 'Home & Kitchen Essentials'
    WHEN 3 THEN 'Consumer Electronics Flagship' WHEN 4 THEN 'Beauty & Personal Care' WHEN 5 THEN 'Seasonal Holiday Gifting'
    WHEN 6 THEN 'Footwear & Accessories' ELSE 'Private Label Basics'
  END AS assortment_name,
  CASE MOD(n, 7)
    WHEN 0 THEN 'FLAGSHIP_STORE' WHEN 1 THEN 'OMNICHANNEL' WHEN 2 THEN 'ECOMMERCE_ONLY' WHEN 3 THEN 'OUTLET'
    WHEN 4 THEN 'MARKETPLACE' WHEN 5 THEN 'POP_UP' ELSE 'VIP_CLIENTELING'
  END AS account_type,
  CASE MOD(n, 4) WHEN 0 THEN 'Standard Sales Tax' WHEN 1 THEN 'Apparel Tax-Exempt' WHEN 2 THEN 'Back-to-School Holiday' ELSE 'Standard Sales Tax' END AS tax_status,
  ROUND(CASE MOD(n, 5)
    WHEN 0 THEN 45000 + RAND() * 180000
    WHEN 1 THEN 85000 + RAND() * 320000
    WHEN 2 THEN 25000 + RAND() * 95000
    ELSE 55000 + RAND() * 210000
  END, 2) AS market_value,
  ROUND(CASE MOD(n, 5)
    WHEN 0 THEN 28000 + RAND() * 115000
    WHEN 1 THEN 52000 + RAND() * 200000
    ELSE 32000 + RAND() * 130000
  END, 2) AS cost_basis,
  ROUND(0.08 + RAND() * 0.42, 4) AS ytd_return,
  ROUND(0.12 + RAND() * 0.48, 4) AS inception_return,
  CONCAT('BM-', LPAD(CAST(MOD(n, 10) + 1 AS STRING), 3, '0')) AS benchmark_id,
  CONCAT('ADV-', LPAD(CAST(MOD(n, 500) + 1 AS STRING), 4, '0')) AS advisor_id,
  CONCAT('MDL-', LPAD(CAST(MOD(n, 20) + 1 AS STRING), 3, '0')) AS template_assortment_id,
  DATE_ADD('2018-01-01', INTERVAL CAST(FLOOR(RAND() * 2500) AS INT64) DAY) AS inception_date,
  CASE MOD(n, 5) WHEN 0 THEN 'Active' WHEN 1 THEN 'Active' WHEN 2 THEN 'Active' WHEN 3 THEN 'Active' ELSE 'Closed' END AS status,
  TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL CAST(FLOOR(RAND() * 500 * 24 * 60) AS INT64) MINUTE) AS created_at,
  'LUMEN' AS source_system
FROM UNNEST(GENERATE_ARRAY(1, 15000)) AS n
