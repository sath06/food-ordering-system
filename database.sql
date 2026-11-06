CREATE DATABASE IF NOT EXISTS food_ordering
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE food_ordering;

CREATE TABLE IF NOT EXISTS food_items (
  food_id INT AUTO_INCREMENT PRIMARY KEY,
  food_name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  availability TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  delivery_address TEXT NOT NULL,
  payment_method VARCHAR(40) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  order_status VARCHAR(30) NOT NULL DEFAULT 'Placed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  food_id INT NULL,
  food_name VARCHAR(120) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_food FOREIGN KEY (food_id) REFERENCES food_items(food_id) ON DELETE SET NULL
);

INSERT INTO food_items (food_name, category, price, description, availability)
SELECT 'Classic Burger', 'Fast Food', 149.00, 'Juicy burger with fresh vegetables and sauce', 1
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE food_name='Classic Burger');
INSERT INTO food_items (food_name, category, price, description, availability)
SELECT 'Margherita Pizza', 'Pizza', 249.00, 'Cheesy pizza with tomato and basil', 1
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE food_name='Margherita Pizza');
INSERT INTO food_items (food_name, category, price, description, availability)
SELECT 'Veg Biryani', 'Indian', 179.00, 'Aromatic rice cooked with vegetables and spices', 1
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE food_name='Veg Biryani');
INSERT INTO food_items (food_name, category, price, description, availability)
SELECT 'French Fries', 'Snacks', 89.00, 'Crispy golden potato fries', 1
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE food_name='French Fries');
INSERT INTO food_items (food_name, category, price, description, availability)
SELECT 'Chocolate Brownie', 'Dessert', 99.00, 'Rich chocolate brownie', 1
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE food_name='Chocolate Brownie');
