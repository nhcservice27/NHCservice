# Cycle Harmony Backend API Documentation

This document provides a comprehensive list of all backend API endpoints for the Cycle Harmony project.

## Base URL
The API is accessible at: `http://<host>:<port>/api`
Health check and root info are available at the root level.

---

## 🛠️ General Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Server health status and database connectivity. | No |
| `GET` | `/` | API version and quick endpoint summary. | No |

---

## 🔐 Authentication

| Method | Endpoint | Description | Body Params |
|--------|----------|-------------|-------------|
| `POST` | `/api/auth/login` | Authenticate user and receive JWT. | `username`, `password` |

---

## 👥 Customer Management

| Method | Endpoint | Description | Params / Body |
|--------|----------|-------------|---------------|
| `POST` | `/api/check-customer` | Check if customer exists by phone. | Body: `phone` |
| `POST` | `/api/check-customer-by-email` | Check if customer exists by email. | Body: `email` |
| `POST` | `/api/customers` | Create or update a customer profile. | Body: `phone`, `name`, `age` |
| `GET` | `/api/customers` | List all customers (optional search). | Query: `search` |
| `GET` | `/api/customer-profile/:phone` | Get details + order history by phone. | Path: `phone` |
| `GET` | `/api/customer-profile-by-email/:email` | Get details + order history by email. | Path: `email` |
| `PATCH` | `/api/customers/:id` | Update customer details. | Path: `id`, Body: `planType`, etc. |
| `DELETE` | `/api/customers/:id` | Delete customer and their associated orders. | Path: `id` |
| `POST` | `/api/customers/:id/addresses` | Add a new address to customer profile. | Body: `house`, `area`, `pincode`, `label`, `landmark` |
| `DELETE` | `/api/customers/:id/addresses/:index` | Remove an address by index. | Path: `id`, `index` |

---

## 📦 Order Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/orders` | List orders with filters (phone, status, search, page, limit, deliveryBoy). | Yes |
| `POST` | `/api/orders` | Create a new order (supports starter/complete plan split logic). | No |
| `GET` | `/api/orders/:id` | View specific order details. | Yes |
| `PATCH` | `/api/orders/:id/status` | Update order status and optional delivery date. | Yes |
| `PATCH` | `/api/orders/:id` | Edit comprehensive order details. | Yes |
| `DELETE` | `/api/orders/:id` | Permanently delete an order. | Yes |
| `GET` | `/api/customer-orders/:customerId` | Retrieve all orders for a specific customer. | No |
| `POST` | `/api/orders/:id/notify` | Manually trigger email notification for an order. | Yes |

### 📊 Reports & Statistics (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/orders/stats` | Global order status aggregates. | Yes |
| `GET` | `/api/orders/revenue-chart` | Daily revenue breakdown for a specific month. | Yes |
| `GET` | `/api/orders/monthly-summary` | Phase-wise and status-wise monthly aggregates. | Yes |
| `GET` | `/api/orders/report` | Get all order records for a specific month. | Yes |
| `GET` | `/api/orders/export/pdf` | Download PDF report for a given month/year. | Yes |
| `GET` | `/api/orders/export/csv` | Download CSV report for a given month/year. | Yes |

### 🌐 Public Subscription Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/orders/public/:id` | View limited order details for confirmation. | No |
| `POST` | `/api/orders/public/:id/confirm` | Publicly confirm a requested subscription order. | No |

---

## 🥗 Ingredient & Stock Tracking (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/ingredients` | List all tracked ingredients and current stock levels. | Yes |
| `POST` | `/api/ingredients/update` | Add stock or update threshold for an ingredient. | Yes |
| `PUT` | `/api/ingredients/:id` | Update absolute stock/threshold by ID. | Yes |
| `DELETE` | `/api/ingredients/:id` | Remove an ingredient from inventory. | Yes |
| `GET` | `/api/ingredients/check-order/:orderId` | Check if stock exists for a specific order's ingredients. | Yes |

---

## 🛍️ Product Inventory (Legacy)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/products` | List all available products in inventory. | Yes |

---

## 📝 Error Handling
All API responses follow a standard structure:
- **Success:** `{ "success": true, "data": ... }`
- **Error:** `{ "success": false, "message": "Reason for failure" }`

---

## 🛡️ Security
- **Authentication:** Admin endpoints are protected using JWT (JSON Web Tokens).
- **Rate Limiting:**
    - Global limit: 1000 requests per 15 mins.
    - Orders stricter limit: 100 requests per 15 mins.
    - Auth (Login) limit: 20 attempts per 15 mins.
