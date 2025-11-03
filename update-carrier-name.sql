-- First, let's check the current setup
SELECT u.email, u.role, c.id as company_id, c.name as company_name, c.type
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'carrier@test.com';

-- Update the carrier company name to "External Test Carrier" and set type to 'carrier'
-- (Run this after checking the above query to confirm the company_id)
UPDATE companies 
SET name = 'External Test Carrier',
    type = 'carrier'
WHERE id = (
  SELECT company_id 
  FROM users 
  WHERE email = 'carrier@test.com'
);

-- Verify the update
SELECT u.email, u.role, c.id as company_id, c.name as company_name, c.type
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'carrier@test.com';

