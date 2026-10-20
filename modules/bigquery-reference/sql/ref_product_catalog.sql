CREATE OR REPLACE TABLE `${project_id}.retail_reference.ref_product_catalog` AS
SELECT 'POINTS_REWARDS' AS product_code, 'Northwind Points Rewards' AS product_name, 'Loyalty Credit' AS category, 'Retail' AS division UNION ALL
SELECT 'VIP_CASHBACK', 'VIP Cashback Tier', 'Loyalty Credit', 'Retail' UNION ALL
SELECT 'STORE_CREDIT', 'Omnichannel Store Credit', 'Loyalty Credit', 'Retail' UNION ALL
SELECT 'GIFT_WALLET', 'Certificate of Loyalty Credit', 'Loyalty Credit', 'Retail' UNION ALL
SELECT 'EMPLOYEE_PERKS', 'Individual Retirement Account', 'Loyalty Credit', 'Retail' UNION ALL
SELECT 'EXTENDED_FINANCING', 'Residential Extended Financing', 'BNPL Plan', 'Lending' UNION ALL
SELECT 'AUTO', 'Auto BNPL Plan', 'BNPL Plan', 'Lending' UNION ALL
SELECT 'PERSONAL', 'Personal BNPL Plan', 'BNPL Plan', 'Lending' UNION ALL
SELECT 'HELOC', 'Home Equity Line of Credit', 'BNPL Plan', 'Lending' UNION ALL
SELECT 'COMMERCIAL', 'Commercial BNPL Plan', 'BNPL Plan', 'Commercial' UNION ALL
SELECT 'SBA', 'SBA BNPL Plan', 'BNPL Plan', 'Commercial' UNION ALL
SELECT 'VISA_PLATINUM', 'Visa Platinum Card', 'Card', 'Cards' UNION ALL
SELECT 'MC_GOLD', 'Mastercard Gold', 'Card', 'Cards' UNION ALL
SELECT 'VISA_SIGNATURE', 'Visa Signature Card', 'Card', 'Cards' UNION ALL
SELECT 'MC_WORLD', 'Mastercard World', 'Card', 'Cards' UNION ALL
SELECT 'VISA_CLASSIC', 'Visa Classic Card', 'Card', 'Cards' UNION ALL
SELECT 'VIP_CLIENTELING', 'VIP Clienteling Account', 'Investment', 'Omnichannel Loyalty' UNION ALL
SELECT 'IRA_WM', 'IRA - Omnichannel Loyalty Managed', 'Investment', 'Omnichannel Loyalty' UNION ALL
SELECT 'ROTH_IRA', 'Roth IRA', 'Investment', 'Omnichannel Loyalty' UNION ALL
SELECT '401K', '401(k) Plan', 'Investment', 'Omnichannel Loyalty' UNION ALL
SELECT 'TRUST', 'Trust Account', 'Investment', 'Omnichannel Loyalty'
