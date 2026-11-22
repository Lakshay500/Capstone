# Project Report - E-Commerce and Inventory Management System

**Course:** Backend Development

## 1. Abstract
This project implements a RESTful backend for an online store with three roles - customer, seller and administrator.
It covers product and category management, a server-priced shopping cart, order placement with atomic stock control,
order lifecycle management, MongoDB aggregation reports, and real-time notifications built on Socket.IO and Node's EventEmitter.
Security is enforced on the server with bcrypt password hashing, JWT access/refresh tokens and role-based access control.

## 2. Problem Statement
Small retailers need a reliable backend that keeps inventory accurate while many customers order at once, lets several
sellers manage only their own listings, and gives owners timely sales and stock insight. Naive implementations oversell
stock, trust client-supplied prices and expose other users' data. This project addresses those issues.

## 3. Objectives
1. Build a complete product-to-order workflow. 2. Enforce customer/seller/admin permissions on the server.
3. Prevent overselling under concurrent orders. 4. Produce sales and inventory reports with aggregation.
5. Notify users in real time about orders and low stock. 6. Provide documentation, seed data and an API test collection.

## 4. Scope and Limitations
**In scope:** auth, users, categories, products, cart, orders, inventory, reports, notifications.
**Out of scope / limitations:** payment is simulated (no gateway or card data); an order holds one status for all sellers
(no per-seller fulfilment); no frontend (APIs demonstrated through Postman and Socket.IO clients); stock rollback uses compensating
updates rather than multi-document transactions so that it runs on a standalone MongoDB.

## 5. Requirements
**Functional:** register/login/refresh/logout; CRUD for categories and products with search, filter, sort and pagination;
cart add/update/remove; checkout; order history and status updates; stock adjustment and low-stock alerts; reports; real-time events.
**Non-functional:** security (hashing, JWT, RBAC, input validation, mass-assignment protection), consistency (atomic stock updates),
maintainability (layered MVC), observability (request logger, event logs), performance (indexes, pagination).

## 6. System Architecture
Layered MVC: routes -> middleware -> controllers -> models -> MongoDB, with an event bus and Socket.IO gateway on the side
(see README diagram). Controllers emit domain events; listeners push notifications.

| Module | Responsibility |
|---|---|
| Auth & Users | registration, login, token rotation, profile, admin user management |
| Catalogue | categories, products, stock adjustment |
| Cart | per-customer cart with server-side totals |
| Orders | checkout, status workflow, cancellation with stock restore |
| Reports | aggregation pipelines for sales, best sellers, inventory |
| Realtime | Socket.IO auth, rooms, EventEmitter listeners |

## 7. Database Design
| Collection | Key fields | Relationships |
|---|---|---|
| users | name, email (unique), password (hash), role, isActive, refreshTokens[hash, expiresAt] | - |
| categories | name (unique), description | 1 category : N products |
| products | name, description, price, stock, lowStockThreshold, isActive | category -> categories, seller -> users |
| carts | user (unique), items[product, quantity] | user -> users, product -> products |
| orders | items[product, seller, name, price, quantity], totalAmount, shippingAddress, payment, status, statusHistory | user -> users; seller/product refs |

Orders embed item snapshots (name, price, seller) so history never changes when a product is edited. Indexes are listed in the README.

## 8. REST API
See `docs/API.md` (endpoint, method, auth, body, sample responses and error codes).

## 9. Authentication and Authorization
- Passwords hashed with bcrypt (cost 12) in a pre-save hook; never selected or serialised.
- Access token (15 min) is sent as a Bearer token; refresh token (7 days) is rotated on every use, stored only as a SHA-256 hash,
  and reuse of a consumed token revokes all of the user's sessions.
- `authenticate` verifies the token and loads the user; `authorize(...roles)` implements RBAC; controllers add ownership checks.
- Roles cannot be self-assigned at registration beyond customer/seller; unknown body fields are stripped.

## 10. Implementation Highlights
- **Atomic reservation:** guarded `$inc` per line, rollback on any failure (`orderController.placeOrder`).
- **Safe cancellation:** compare-and-set on `status` guarantees stock is restored once.
- **EventEmitter:** `order:placed`, `order:status-changed`, `stock:low` decouple business logic from notifications.
- **Socket.IO:** JWT handshake auth and room-based delivery (`user:`, `seller:`, `admins`).
- **Centralized error handling:** `AppError` + one middleware mapping Mongoose, JWT and JSON errors to consistent responses.

## 11. Testing Strategy
Postman collection (`postman/EcommerceAPI.postman_collection.json`, ~70 requests with assertions) runs after `npm run seed`.

| Category | Examples |
|---|---|
| Success | register, login, create product, add to cart, checkout, reports |
| Validation failure | bad email/password, negative price, missing address, invalid quantity |
| Not found | unknown product/category/order id |
| Unauthorized (401) | no/invalid token on protected routes |
| Forbidden (403) | customer creating product, seller editing another's product, customer viewing reports |
| Conflict (409) | duplicate email/category, quantity above stock, illegal status jump, reused refresh token |
| Business rules | stock 10 -> 8 after order -> 10 after cancel; totals computed on server |

## 12. Conclusion and Future Enhancements
The system meets the functional and security goals and keeps inventory consistent under concurrent orders.
Future work: multi-document transactions on a replica set, per-seller fulfilment status, coupons, reviews, CSV/PDF reports, rate limiting and automated tests.

## 13. References
Node.js, Express, Mongoose and Socket.IO official documentation; MongoDB aggregation framework manual; OWASP Authentication and Session Management cheat sheets.
