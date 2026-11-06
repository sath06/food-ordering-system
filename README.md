# Sathvika's Restaurant

A multi-page restaurant ordering and menu-management project using Node.js, Express and MySQL.

## Features
- Home, menu, cart, checkout and saved-order pages
- Add, view, edit and delete menu items
- Menu CRUD operations are written directly to MySQL
- Checkout stores order headers and order line items in MySQL using a transaction
- Search menu and view order history/details

## Requirements
- Node.js LTS (includes npm)
- MySQL Server and MySQL Workbench

## Setup
1. Extract the ZIP folder.
2. Open MySQL Workbench and connect to your local MySQL server.
3. Open `database.sql` in Workbench and click the lightning-bolt Execute button. It creates `food_ordering`, `food_items`, `orders`, and `order_items` and inserts sample menu items.
4. Open the project folder in VS Code. In the terminal, run `npm install` (this reads `package.json` and creates/updates `package-lock.json` and `node_modules`).
5. Copy `.env.example` to a new file named `.env` in the project root. Set `DB_PASSWORD` to your actual MySQL root password. Do not include angle brackets. The project reads `.env` directly, so no extra package is required. If your MySQL username/database differs, update the other DB values too.
6. Start the server with `npm start`.
7. Open `http://localhost:3000` in your browser.
8. Check the connection at `http://localhost:3000/api/health` — it should return `{"status":"ok","database":"food_ordering"}`.

## Install packages / package files
- `package.json` lists the project dependencies and scripts.
- `package-lock.json` records the exact dependency tree for repeatable installation.
- `npm install` downloads dependencies and updates both lock information and `node_modules`.
- On another computer, run `npm ci` to install exactly from `package-lock.json` (requires a valid lock file).
- Do not manually download individual Node modules or copy `node_modules` between computers.

## Run commands (Windows PowerShell)
```powershell
cd "path\to\food ordering system"
npm install
# Create .env by copying .env.example, then edit DB_PASSWORD
npm start
```

## MySQL sync explanation
The browser sends Add/Edit/Delete requests to Express API endpoints. Express runs parameterized SQL queries against MySQL. The API response is sent only after the database operation completes. Therefore the changes appear in Workbench when you refresh the schema/table and execute `SELECT * FROM food_items;`. Checkout similarly saves to `orders` and `order_items`.

## Pages
- `/` Home
- `/menu.html` Add/search/view menu; edit and delete from row actions
- `/update.html?id=1` Edit a food item (the ID is supplied by the Edit action)
- `/cart.html` Cart
- `/order.html` Checkout
- `/orders.html` Saved orders

## Notes
This is an academic/demo ordering app. UPI is only a displayed demo payment choice; no real payment gateway is integrated. The app has no admin login, so do not expose it publicly without adding authentication and authorization. Never commit your `.env` file.
