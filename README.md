# Health Vault AI

Medical records management system with AI-powered search.

## Quick Start

### 1. Setup MongoDB

**Option A: Cloud (Easiest)**

- https://www.mongodb.com/cloud/atlas → Create free cluster
- Get connection string
- Update `.env`: `MONGODB_URI=mongodb+srv://...`

**Option B: Local**

- Download: https://www.mongodb.com/try/download/community
- Install & run: `net start MongoDB`

### 2. Run

```powershell
npm run server:dev    # Start backend
npm run dev          # Start frontend (optional)
node backend/test-api.js  # Test (optional)
```

## API Endpoints

### Auth

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me (protected)
```

### Doctors

```
GET    /api/doctors          # List all doctors
GET    /api/doctors/:id      # Get one doctor
POST   /api/doctors          # Create doctor
PUT    /api/doctors/:id      # Update doctor
DELETE /api/doctors/:id      # Delete doctor
```

### Appointments

```
GET    /api/appointments     # List user's appointments
GET    /api/appointments/:id # Get one appointment
POST   /api/appointments     # Create appointment
PUT    /api/appointments/:id # Update appointment
DELETE /api/appointments/:id # Delete appointment
```

### Documents

```
GET    /api/documents?appointmentId=xxx  # List documents for appointment
GET    /api/documents/:id                # Get one document
POST   /api/documents                    # Create document
PUT    /api/documents/:id                # Update document
DELETE /api/documents/:id                # Delete document
```

## Data Models

- **User**: name, email, password, role (Patient/Doctor)
- **Doctor**: name, specialty, hospital, contact
- **Appointment**: patientId, doctorId, date, status
- **Document**: appointmentId, cloudURL, rawText, vectorKey

## Structure

```
backend/models/      # Database schemas
backend/routes/      # API endpoints
backend/controllers/ # Logic
src/components/      # UI
src/pages/          # Pages
```

## Config (.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=change-this

# Cloudinary (https://cloudinary.com - free)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Setup Cloudinary (Free)

1. Go to https://cloudinary.com/users/register_free
2. Sign up for free account
3. Copy Cloud Name, API Key, API Secret from dashboard
4. Add to `.env` file

## Phase 2: File Upload & OCR ✅

- Upload documents (images/PDFs)
- Auto upload to Cloudinary
- OCR text extraction
- Text search ready
