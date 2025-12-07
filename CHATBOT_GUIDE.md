# 🤖 AI Chatbot Integration Guide

## Overview

The chatbot allows patients and doctors to ask questions about their appointments using Google Gemini AI. Each patient-doctor relationship has a separate chat with context from their appointments.

---

## ✅ Features Implemented

### 1. **Appointment-Specific Context**

- Chatbot uses appointment data (date, notes, documents) as context
- Users can select specific appointments for focused questions
- AI provides answers based on medical history

### 2. **OCR Integration Ready**

- **TODO Comment Added**: The system has placeholder fields for OCR-extracted text
- Your friend's OCR model should populate the `ocrExtractedText` field
- Location: `backend/models/ChatMessage.js` and `backend/config/gemini.js`

### 3. **Separate Conversations**

- Each patient-doctor pair has an isolated chat
- Doctors cannot see chats with other doctors' patients
- Patients can chat with multiple doctors separately

### 4. **Split Screen UI**

- Dashboard has tabs: "Appointments" and "AI Chat"
- Chat view shows conversation list + chat window
- Responsive design for mobile and desktop

---

## 🔑 Setup Instructions

### Step 1: Get Google Gemini API Key (FREE)

1. Go to: https://makersuite.google.com/app/apikey
2. Click **"Create API Key"**
3. Select your Google Cloud project or create a new one
4. Copy the API key

### Step 2: Add API Key to `.env`

Open `.env` and replace `your_gemini_api_key_here` with your actual key:

```env
# AI Chatbot (Google Gemini - Free API)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
```

### Step 3: Install Dependencies (if needed)

```bash
npm install axios
```

### Step 4: Restart Backend

```bash
npm run server:dev
```

---

## 📡 API Endpoints

### Chat Routes

```
GET /api/chat/conversations
- Get all conversations for current user
- Returns: List of doctors (for patients) or patients (for doctors)

GET /api/chat/messages/:otherUserId
- Get chat history with specific user
- Returns: Array of messages (user, doctor, ai)

POST /api/chat/send
- Send message and get AI response
Body: {
  message: string,
  otherUserId: string,
  appointmentIds?: string[] (optional - specific appointments for context)
}

GET /api/chat/appointments/:otherUserId
- Get appointments between users for context selection
- Returns: List of appointments with dates and documents
```

---

## 🔧 OCR Model Integration Points

### Location 1: `backend/models/ChatMessage.js`

```javascript
// Line 28-35
ocrExtractedText: {
  type: String,
  default: '' // Currently empty - will be populated by OCR model
},
```

**Your friend's OCR model should:**

1. Extract text from prescriptions, X-rays, test reports
2. Store it in this field when creating/updating appointments
3. This text becomes part of the AI chatbot context

### Location 2: `backend/config/gemini.js`

```javascript
// Line 23-29
// TODO: OCR Model Integration Point
// When your friend's OCR model is ready, it will populate the ocrExtractedText field
// This extracted text from prescriptions, X-rays, and test reports will be used here
if (apt.ocrExtractedText && apt.ocrExtractedText.trim() !== "") {
  contextText += `Medical Document Content (Extracted by OCR):\n${apt.ocrExtractedText}\n`;
}
```

### Location 3: `backend/controllers/chatController.js`

```javascript
// Line 91-94 and 105-108
// TODO: OCR Model Integration Point
// Your friend's OCR model will populate apt.ocrText with extracted text
ocrExtractedText: apt.ocrText || '',
```

---

## 💬 How to Use the Chatbot

### For Patients:

1. Go to Dashboard → Click **"AI Chat"** tab
2. See list of doctors you have appointments with
3. Click on a doctor to open chat
4. **(Optional)** Select specific appointments for context
5. Ask questions like:
   - "What did the doctor prescribe in my last visit?"
   - "Summarize my appointment on [date]"
   - "What were the test results?"
6. AI responds with context from appointments

### For Doctors:

1. Go to Dashboard → Click **"AI Chat"** tab
2. See list of patients who have appointments with you
3. Click on a patient to open chat
4. **(Optional)** Select specific appointments for context
5. Ask questions like:
   - "What medications is this patient on?"
   - "Show me the patient's appointment history"
   - "What were the symptoms mentioned?"

---

## 🎯 Example Questions

### General Questions:

- "What appointments do I have with this doctor?"
- "When was my last visit?"
- "What documents were uploaded?"

### With Appointment Selection:

- "What did the X-ray show?" (select the appointment with X-ray)
- "What was prescribed?" (select specific appointment)
- "Explain the test results" (select appointment with test)

### Medical History:

- "Summarize my medical history with this doctor"
- "What conditions have been diagnosed?"
- "What medications have I been prescribed?"

---

## 🔒 Privacy & Security

- ✅ **Separate Conversations**: Each patient-doctor pair is isolated
- ✅ **Access Control**: Users can only access their own chats
- ✅ **Context Filtering**: AI only sees appointment data between the two users
- ✅ **No Cross-Contamination**: Doctor A cannot see patient's chat with Doctor B

---

## 📊 Database Schema

### ChatMessage Model

```javascript
{
  patientId: ObjectId (ref: User),
  doctorId: ObjectId (ref: User),
  sender: "patient" | "doctor" | "ai",
  message: String,
  appointmentContext: [{
    appointmentId: ObjectId,
    appointmentDate: Date,
    notes: String,
    ocrExtractedText: String, // ← OCR MODEL POPULATES THIS
    fileName: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing the Chatbot

### Test Scenario 1: Basic Chat

1. Register as Patient and Doctor
2. Create appointment from Patient to Doctor
3. Patient: Go to Dashboard → AI Chat tab
4. Select the doctor from conversations list
5. Ask: "What appointments do I have?"
6. AI should respond with appointment details

### Test Scenario 2: Appointment Context

1. Create appointment with notes and upload a document
2. Patient: Select that specific appointment in chat
3. Ask: "What document did I upload?"
4. AI should mention the filename and notes

### Test Scenario 3: Multiple Appointments

1. Create 3 appointments with different dates
2. Ask: "What were my appointments in November?"
3. AI should list the relevant appointments

---

## 🚀 Next Steps for OCR Integration

When your friend's OCR model is ready:

1. **Update Appointment Creation**: When a file is uploaded, run OCR and save extracted text
2. **Populate `ocrText` field**: In `Appointment` model
3. **Test with real documents**: Upload prescription images and see if AI can read them
4. **Refine prompts**: Adjust Gemini prompts based on OCR quality

---

## 💡 Tips

- The Gemini API free tier has limits (~15 requests per minute)
- For production, consider upgrading or implementing rate limiting
- AI responses are generated fresh each time (not stored)
- Long appointment histories may hit token limits - consider pagination

---

## 🐛 Troubleshooting

### "Failed to generate AI response"

- Check if `GEMINI_API_KEY` is correct in `.env`
- Verify internet connection
- Check Gemini API quota: https://console.cloud.google.com

### "No conversations found"

- Make sure appointments exist between patient and doctor
- Check if both users are registered properly

### Chatbot not loading

- Restart backend: `npm run server:dev`
- Clear browser cache
- Check browser console for errors

---

## ✅ What's Ready

- ✅ Chat UI with split screen
- ✅ Conversation management
- ✅ Appointment context selection
- ✅ Google Gemini AI integration
- ✅ Privacy and access control
- ✅ OCR integration placeholders (ready for your friend's model)

**The system is ready to test once you add the Gemini API key!** 🎉
