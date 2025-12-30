# API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member",
  "churchId": "optional",
  "unitId": "optional",
  "memberId": "optional"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "member"
  }
}
```

### Login
**POST** `/auth/login`

**Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "member",
    "churchId": "507f1f77bcf86cd799439012"
  }
}
```

### Get Current User
**GET** `/auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "member",
    "isActive": true,
    "lastLogin": "2024-12-01T10:30:00.000Z"
  }
}
```

### Logout
**POST** `/auth/logout`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Change Password
**POST** `/auth/change-password`

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Future Endpoints (To Be Implemented)

### Churches
- `GET /api/churches` - Get all churches
- `POST /api/churches` - Create church (Super Admin)
- `GET /api/churches/:id` - Get church details
- `PUT /api/churches/:id` - Update church
- `DELETE /api/churches/:id` - Delete church

### Units
- `GET /api/units` - Get all units
- `POST /api/units` - Create unit
- `GET /api/units/:id` - Get unit details
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit

### Members
- `GET /api/members` - Get all members (with filters)
- `POST /api/members` - Create member
- `GET /api/members/:id` - Get member details
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member
- `GET /api/members/:id/wallet` - Get member wallet
- `GET /api/members/:id/spiritual-activities` - Get activities

### Transactions
- `GET /api/transactions` - Get all transactions (with filters)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/receipt/:receiptNumber` - Get by receipt

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Spiritual Activities
- `GET /api/spiritual` - Get all activities
- `POST /api/spiritual/mass` - Mark mass attendance
- `POST /api/spiritual/fasting` - Record fasting
- `POST /api/spiritual/prayer` - Record prayer
- `GET /api/spiritual/member/:memberId` - Get member activities

### Reports
- `GET /api/reports/financial` - Financial summary
- `GET /api/reports/transactions` - Transaction report
- `GET /api/reports/collections` - Collection by type
- `GET /api/reports/spiritual` - Spiritual activities report

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 500 | Internal Server Error |

## Rate Limiting

Currently not implemented. Consider adding for production:
- 100 requests per 15 minutes per IP
- 1000 requests per day per user

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

## Postman Collection

Import the Postman collection (to be created) for easier testing.

## WebSocket Support

Not currently implemented. Consider for real-time features in future:
- Live transaction updates
- Real-time notifications
- Dashboard live statistics
