# 📚 IN-N-OUT Store API Documentation

## Overview

This document provides comprehensive documentation for the IN-N-OUT Store e-commerce platform API. The API follows RESTful principles and supports JSON data format.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {}, // Response data (if applicable)
  "error": "Error message" // Only present if success is false
}
```

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "userName": "string",
  "email": "string",
  "password": "string"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

### Logout User
```http
POST /auth/logout
```

### Check Authentication
```http
GET /auth/check-auth
```

### Forgot Password
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "string"
}
```

### Reset Password
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "string",
  "newPassword": "string"
}
```

## Product Endpoints

### Get All Products
```http
GET /shop/products/get
```

**Query Parameters:**
- `category` - Filter by category
- `brand` - Filter by brand
- `sortBy` - Sort by (price-lowtohigh, price-hightolow, title-atoz, title-ztoa)
- `shop` - Filter by shop name

### Get Product Details
```http
GET /shop/products/get/:id
```

### Get Bestseller Products
```http
GET /shop/products/bestsellers
```

### Get New Arrival Products
```http
GET /shop/products/new-arrivals
```

### Get Similar Products
```http
GET /shop/products/similar/:id
```

## Cart Endpoints

### Add to Cart
```http
POST /shop/cart/add
```

**Request Body:**
```json
{
  "userId": "string",
  "productId": "string",
  "quantity": "number",
  "size": "string",
  "color": "string"
}
```

### Get Cart Items
```http
GET /shop/cart/get/:userId
```

### Update Cart Item
```http
PUT /shop/cart/update-cart
```

**Request Body:**
```json
{
  "userId": "string",
  "productId": "string",
  "quantity": "number"
}
```

### Delete Cart Item
```http
DELETE /shop/cart/:userId/:productId
```

## Order Endpoints

### Create Order
```http
POST /shop/order/create
```

**Request Body:**
```json
{
  "userId": "string",
  "cartItems": "array",
  "addressInfo": "object",
  "totalAmount": "number",
  "shippingFee": "number",
  "adminShippingFees": "object",
  "paymentMethod": "string"
}
```

### Get User Orders
```http
GET /shop/order/list/:userId
```

### Get Order Details
```http
GET /shop/order/details/:id
```

### Verify Payment
```http
POST /shop/order/verify-payment
```

**Request Body:**
```json
{
  "reference": "string",
  "orderId": "string"
}
```

## Wishlist Endpoints

### Add to Wishlist
```http
POST /shop/wishlist/add
```

**Request Body:**
```json
{
  "userId": "string",
  "productId": "string"
}
```

### Get Wishlist
```http
GET /shop/wishlist/get/:userId
```

### Remove from Wishlist
```http
DELETE /shop/wishlist/:userId/:productId
```

## Admin Endpoints

### Add Product
```http
POST /admin/products/add
```

**Request Body:** (multipart/form-data)
```
title: string
description: string
category: string
brand: string
price: number
salePrice: number
totalStock: number
image: file
```

### Edit Product
```http
PUT /admin/products/edit/:id
```

### Delete Product
```http
DELETE /admin/products/delete/:id
```

### Get Admin Products
```http
GET /admin/products/get
```

### Get Admin Orders
```http
GET /admin/orders/get
```

### Update Order Status
```http
PUT /admin/orders/update/:id
```

**Request Body:**
```json
{
  "orderStatus": "string"
}
```

## SuperAdmin Endpoints

### Get All Users
```http
GET /superAdmin/users/get
```

### Add User
```http
POST /superAdmin/users/add
```

**Request Body:**
```json
{
  "userName": "string",
  "email": "string",
  "role": "string"
}
```

### Update User Role
```http
PUT /superAdmin/users/update-role/:id
```

**Request Body:**
```json
{
  "role": "string"
}
```

### Delete User
```http
DELETE /superAdmin/users/delete/:id
```

### Get Revenue Analytics
```http
GET /superAdmin/revenue/:period
```

**Parameters:**
- `period` - daily, weekly, monthly, yearly

### Create Vendor Payment
```http
POST /superAdmin/vendor-payments
```

**Request Body:**
```json
{
  "vendorId": "string",
  "amount": "number",
  "description": "string",
  "paymentMethod": "string",
  "transactionId": "string"
}
```

## Payment Endpoints

### Initialize Payment
```http
POST /payment/paystack/initialize
```

**Request Body:**
```json
{
  "amount": "number",
  "email": "string",
  "callbackUrl": "string",
  "metadata": "object"
}
```

### Verify Payment
```http
POST /payment/paystack/verify
```

**Request Body:**
```json
{
  "reference": "string"
}
```

## File Upload

### Upload Product Image
```http
POST /admin/products/upload-image
```

**Request:** multipart/form-data with image file

**Response:**
```json
{
  "success": true,
  "image": {
    "public_id": "string",
    "url": "string"
  }
}
```

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- General API endpoints: 100 requests per minute

## Email Notifications

The system automatically sends emails for:
- User registration (welcome email)
- Password reset
- Order confirmation
- Order status updates
- Product sold notifications (to vendors)
- Low stock alerts
- Payment confirmations
- Contact form submissions

## Webhooks

### Paystack Webhook
```http
POST /payment/paystack/webhook
```

Handles payment status updates from Paystack.

## Error Handling

All endpoints include comprehensive error handling with descriptive messages. Common error scenarios:

- **Validation Errors**: Missing required fields, invalid data formats
- **Authentication Errors**: Invalid or expired tokens
- **Authorization Errors**: Insufficient permissions
- **Resource Errors**: Not found, already exists
- **Server Errors**: Database connection issues, external service failures

## Testing

Use the provided test scripts to verify API functionality:

```bash
# Test email notifications
node test-all-notifications.js your-email@example.com

# Test shipping calculations
node scripts/testShippingCalc.js

# Test shop system
node test-shop-system.js
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS configuration
- Environment variable protection
- SQL injection prevention (MongoDB)

## Performance Optimizations

- Database indexing
- Query optimization
- Caching headers
- Image optimization via Cloudinary
- Pagination for large datasets

## Monitoring

- Console logging for all operations
- Error tracking
- Performance monitoring
- Email delivery tracking

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Status**: Production Ready ✅ 