-- Initial database setup for local development

USE groceryprices;

-- Create sample stores
INSERT INTO stores (name, location, address, created_at, updated_at) VALUES
('Walmart Supercenter', 'Downtown', '123 Main St, City, State', NOW(), NOW()),
('Target', 'Uptown', '456 Oak Ave, City, State', NOW(), NOW()),
('Kroger', 'Westside', '789 Pine Rd, City, State', NOW(), NOW()),
('Safeway', 'Eastside', '321 Elm St, City, State', NOW(), NOW());

-- Create sample products
INSERT INTO products (name, brand, category, unit, size, barcode, created_at, updated_at) VALUES
('Whole Milk', 'Great Value', 'Dairy', 'gallon', '1 gal', '1234567890123', NOW(), NOW()),
('Bread', 'Wonder', 'Bakery', 'loaf', '20 oz', '2345678901234', NOW(), NOW()),
('Bananas', NULL, 'Produce', 'lb', NULL, '3456789012345', NOW(), NOW()),
('Ground Beef', NULL, 'Meat', 'lb', '1 lb', '4567890123456', NOW(), NOW()),
('Chicken Breast', NULL, 'Meat', 'lb', '1 lb', '5678901234567', NOW(), NOW()),
('Eggs', 'Great Value', 'Dairy', 'dozen', '12 count', '6789012345678', NOW(), NOW()),
('Apples', NULL, 'Produce', 'lb', NULL, '7890123456789', NOW(), NOW()),
('Rice', 'Uncle Ben\'s', 'Pantry', 'bag', '2 lb', '8901234567890', NOW(), NOW());

-- Create sample prices with some deals
INSERT INTO prices (product_id, store_id, regular_price, sale_price, promotion_type, promotion_details, valid_from, valid_to, scraped_at, created_at) VALUES
-- Milk prices
(1, 1, 3.49, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(1, 2, 3.79, 2.99, 'Sale', 'Weekly special', '2024-01-01', '2024-12-31', NOW(), NOW()),
(1, 3, 3.29, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(1, 4, 3.69, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),

-- Bread prices
(2, 1, 1.99, 1.49, 'BOGO 50%', 'Buy one get one 50% off', '2024-01-01', '2024-12-31', NOW(), NOW()),
(2, 2, 2.29, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(2, 3, 1.89, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(2, 4, 2.19, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),

-- Bananas prices
(3, 1, 0.68, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(3, 2, 0.79, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(3, 3, 0.58, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(3, 4, 0.69, 0.49, 'Sale', 'Weekend special', '2024-01-01', '2024-12-31', NOW(), NOW()),

-- Ground Beef prices
(4, 1, 4.99, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(4, 2, 5.49, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(4, 3, 4.79, 3.99, 'Manager Special', 'Limited time offer', '2024-01-01', '2024-12-31', NOW(), NOW()),
(4, 4, 5.29, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),

-- Chicken Breast prices
(5, 1, 3.99, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(5, 2, 4.29, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(5, 3, 3.79, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(5, 4, 4.19, 2.99, 'Flash Sale', 'Today only!', '2024-01-01', '2024-12-31', NOW(), NOW()),

-- Eggs prices
(6, 1, 2.49, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(6, 2, 2.79, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(6, 3, 2.29, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(6, 4, 2.59, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),

-- Apples prices
(7, 1, 1.99, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(7, 2, 2.29, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(7, 3, 1.79, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(7, 4, 2.09, 1.49, 'Clearance', 'Last day of sale', '2024-01-01', '2024-12-31', NOW(), NOW()),

-- Rice prices
(8, 1, 3.49, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(8, 2, 3.79, 2.49, 'Member Price', 'RedCard exclusive', '2024-01-01', '2024-12-31', NOW(), NOW()),
(8, 3, 3.29, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW()),
(8, 4, 3.59, NULL, NULL, NULL, '2024-01-01', '2024-12-31', NOW(), NOW());