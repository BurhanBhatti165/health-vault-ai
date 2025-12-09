import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// Initialize Gemini for extraction
const genAI = new GoogleGenerativeAI(process.env.GEMINI_EXTRACT_API_KEY || process.env.GEMINI_API_KEY);

/**
 * Extract text from image using Google Gemini Vision
 */
export const extractWithGemini = async (imageUrl) => {
  try {
    console.log('🔍 [Gemini Extract] Processing image:', imageUrl);

    // Download image
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';

    // Use Gemini Pro Vision model (supports image analysis)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a medical document analyzer. Carefully examine this medical document and extract ALL visible information in a structured format.

Extract and return a JSON object with:
{
  "document_type": "type of document (prescription/lab report/medical certificate/etc)",
  "diagnosis": "primary diagnosis or medical condition",
  "medicines": ["medicine name with dosage and frequency"],
  "doctor_name": "prescribing doctor's name",
  "patient_name": "patient's name if visible",
  "date": "date on document",
  "hospital": "hospital or clinic name",
  "instructions": "special instructions or notes",
  "test_results": "any lab test results or values",
  "vital_signs": "blood pressure, temperature, etc if present",
  "additional_notes": "any other relevant medical information"
}

If any field is not visible, use "Not specified". Be thorough and extract all text you can see.
Return ONLY the JSON object, no other text.`;

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
    const text = response.text();

    console.log('✅ [Gemini Extract] Raw response:', text.substring(0, 200));

    // Parse JSON from response
    let extractedData;
    try {
      if (text.includes('```json')) {
        const jsonStr = text.split('```json')[1].split('```')[0].trim();
        extractedData = JSON.parse(jsonStr);
      } else if (text.includes('```')) {
        const jsonStr = text.split('```')[1].split('```')[0].trim();
        extractedData = JSON.parse(jsonStr);
      } else {
        extractedData = JSON.parse(text.trim());
      }
    } catch (e) {
      // If JSON parsing fails, return raw text
      extractedData = {
        document_type: "Medical Document",
        raw_extraction: text,
        extraction_method: "gemini_vision"
      };
    }

    extractedData.extraction_method = "gemini_vision";
    console.log('✅ [Gemini Extract] Structured data:', extractedData);

    return {
      success: true,
      data: extractedData,
      rawText: text
    };

  } catch (error) {
    console.error('❌ [Gemini Extract] Error:', error);
    return {
      success: false,
      error: error.message,
      data: {
        document_type: "Medical Document",
        extraction_method: "gemini_vision",
        error: error.message
      }
    };
  }
};

/**
 * Extract text from image using selected method
 * @param {string} imageUrl - URL of the image
 * @param {string} method - 'gemini' (only option now)
 */
export const extractText = async (imageUrl, method = 'gemini') => {
  console.log(`📸 [Extraction Service] Using Gemini Vision`);
  return await extractWithGemini(imageUrl);
};
