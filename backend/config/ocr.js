import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import fs from 'fs';

// Initialize Gemini for OCR extraction
const genAI = new GoogleGenerativeAI(process.env.GEMINI_EXTRACT_API_KEY || process.env.GEMINI_API_KEY);

// Use Gemini Vision for OCR instead of OCR.space
export const extractText = async (filePath) => {
  try {
    console.log('🔍 [Gemini OCR] Starting extraction for file:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ [Gemini OCR] File does not exist:', filePath);
      return '';
    }

    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');
    
    // Get file type
    const mimeType = filePath.toLowerCase().includes('.png') ? 'image/png' : 
                    filePath.toLowerCase().includes('.jpg') || filePath.toLowerCase().includes('.jpeg') ? 'image/jpeg' :
                    'image/jpeg'; // default

    console.log('🔍 [Gemini OCR] File size:', fileBuffer.length, 'bytes');
    console.log('🔍 [Gemini OCR] MIME type:', mimeType);

    // Use Gemini Vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Extract ALL text from this medical document image. 
    
Return the text exactly as it appears, maintaining the original formatting and structure. 
Include all visible text: doctor names, patient names, diagnoses, medicines, dates, instructions, etc.

Do not add any interpretation or formatting - just return the raw text as you see it.`;

    console.log('📤 [Gemini OCR] Sending to Gemini Vision API...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const response = result.response;
    const extractedText = response.text();

    console.log('✅ [Gemini OCR] Extraction complete');
    console.log('✅ [Gemini OCR] Text length:', extractedText.length);
    console.log('✅ [Gemini OCR] First 200 chars:', extractedText.substring(0, 200));

    return extractedText;

  } catch (error) {
    console.error('❌ [Gemini OCR] Error:', error.message);
    console.log('⚠️ [Gemini OCR] Falling back to empty string');
    return '';
  }
};
