# Backend API

## Auth Endpoints

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Patient"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

## Models

### User

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "Patient" | "Doctor"
}
```

### Doctor

```javascript
{
  name: String,
  specialty: String,
  hospital: String,
  phone: String,
  email: String
}
```

### Appointment

```javascript
{
  patientId: ObjectId (ref: User),
  doctorId: ObjectId (ref: Doctor),
  date: Date,
  documentStatus: "pending" | "uploaded" | "processed" | "completed",
  notes: String
}
```

### Document

```javascript
{
  appointmentId: ObjectId (ref: Appointment),
  cloudStorageURL: String,
  rawText: String (OCR),
  vectorIndexKey: String,
  fileName: String,
  ocrStatus: "pending" | "processing" | "completed" | "failed"
}
```

## Testing

```powershell
npm run server:dev
node backend/test-api.js
```
