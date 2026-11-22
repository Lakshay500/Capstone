# API Documentation

Base URL `http://localhost:5000`. All bodies are JSON. Protected routes need `Authorization: Bearer <accessToken>`.

**Success shape:** `{ "success": true, ... }`  **Error shape:** `{ "success": false, "message": "...", "errors": ["..."] }`

Common errors: `400` validation / bad id, `401` missing or invalid token, `403` wrong role or not owner, `404` not found, `409` conflict (duplicate, stock, state).

## Auth
| Method & path | Auth | Body | Success | Errors |
|---|---|---|---|---|
| POST /api/auth/register | - | `name, email, password (>=8, letter+digit), role? (customer\|seller)` | 201 `{user, accessToken, refreshToken}` | 400, 409 duplicate email |
| POST /api/auth/login | - | `email, password` | 200 `{user, accessToken, refreshToken}` | 400, 401 invalid credentials, 403 disabled |
| POST /api/auth/refresh | - | `refreshToken` | 200 new `{accessToken, refreshToken}` (old one is invalidated) | 401 invalid / reused token |
| POST /api/auth/logout | any | `refreshToken` | 200 `{message}` | 400, 401 |

## Users
| Method & path | Auth | Body / query | Success |
|---|---|---|---|
| GET /api/users/me | any | - | 200 `{user}` |
| PATCH /api/users/me | any | `name?, password?` | 200 `{user}` |
| GET /api/users | admin | `role?, page, limit` | 200 `{total, page, totalPages, users}` |
| PATCH /api/users/:id | admin | `role?, isActive?` | 200 `{user}` (404 if missing) |

## Categories
| Method & path | Auth | Body | Success | Errors |
|---|---|---|---|---|
| GET /api/categories | - | - | 200 `{categories}` | |
| GET /api/categories/:id | - | - | 200 `{category}` | 400, 404 |
| POST /api/categories | admin | `name, description?` | 201 `{category}` | 400, 409 duplicate |
| PATCH /api/categories/:id | admin | `name?, description?` | 200 | 400, 404, 409 |
| DELETE /api/categories/:id | admin | - | 200 | 404, 409 still has active products |

## Products
| Method & path | Auth | Body / query | Success | Errors |
|---|---|---|---|---|
| GET /api/products | - | `q, category, seller, minPrice, maxPrice, inStock, sort (e.g. -price,name), page, limit` | 200 `{total,page,totalPages,count,products}` | 400 bad filter |
| GET /api/products/:id | - | - | 200 `{product}` | 400, 404 |
| POST /api/products | seller, admin | `name, price, category, stock, description?, lowStockThreshold?, seller? (admin only)` | 201 `{product}` | 400, 403 |
| PATCH /api/products/:id | owner seller, admin | any of the create fields | 200 `{product}` | 400, 403 not owner, 404 |
| PATCH /api/products/:id/stock | owner seller, admin | `change` (non-zero integer) | 200 `{product}` | 400, 403, 409 would go negative |
| DELETE /api/products/:id | owner seller, admin | - | 200 (soft delete) | 403, 404 |

## Cart (customer only)
| Method & path | Body | Success | Errors |
|---|---|---|---|
| GET /api/cart | - | 200 `{cart:{items,itemCount,total}}` (totals computed on server) | 401, 403 |
| POST /api/cart/items | `productId, quantity (1-100)` | 201 `{cart}` | 400, 404, 409 exceeds stock |
| PATCH /api/cart/items/:productId | `quantity` | 200 `{cart}` | 400, 404, 409 |
| DELETE /api/cart/items/:productId | - | 200 `{cart}` | 404 |
| DELETE /api/cart | - | 200 | |

## Orders
| Method & path | Auth | Body / query | Success | Errors |
|---|---|---|---|---|
| POST /api/orders | customer | `shippingAddress {fullName,line1,city,postalCode,phone?}` | 201 `{order}` (payment simulated) | 400 empty cart / validation, 409 insufficient stock |
| GET /api/orders | any | `status, page, limit` (customer: own, seller: orders with own items, admin: all) | 200 `{total,page,totalPages,orders}` | 400 |
| GET /api/orders/:id | owner, involved seller, admin | - | 200 `{order}` | 404 (also for other users' orders) |
| PATCH /api/orders/:id/status | see rules | `status` | 200 `{order}` | 400, 403, 404, 409 invalid transition |

**Status rules:** `pending -> confirmed | cancelled`, `confirmed -> shipped | cancelled`, `shipped -> delivered`; `delivered` and `cancelled` are final.
Customers may only cancel their own **pending** orders; sellers (of an item in the order) and admins may apply any allowed transition.
Cancelling restores stock.

## Reports (seller: own data only, admin: everything)
| Path | Query | Response |
|---|---|---|
| GET /api/reports/sales-summary | `from, to` (YYYY-MM-DD) | `{totals:{revenue,unitsSold}, daily:[{date,revenue,unitsSold,orders}]}` |
| GET /api/reports/best-selling | `limit (1-50), from, to` | `{products:[{productId,name,unitsSold,revenue}]}` |
| GET /api/reports/inventory-summary | - | `{summary:[{category,totalProducts,totalUnits,stockValue,lowStockCount}]}` |
| GET /api/reports/low-stock | - | `{count, products}` |

## Socket.IO
Handshake: `io(url, { auth: { token: accessToken } })` (rejected with `Authentication required` / `Invalid or expired token`).
Events (server -> client): `connected`, `order:new`, `order:status`, `stock:low` - payloads are listed in the README.
