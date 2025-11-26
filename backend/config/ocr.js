import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Simple OCR using OCR.space API (free tier)
export const extractText = async (filePath) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('apikey', process.env.OCR_API_KEY || 'K87899142388957'); // Free API key
    formData.append('language', 'eng');

    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: formData.getHeaders()
    });

    if (response.data.ParsedResults && response.data.ParsedResults.length > 0) {
      return response.data.ParsedResults[0].ParsedText || '';
    }
    
    return '';
  } catch (error) {
    console.error('OCR error:', error.message);
    return ''; // Return empty string on error
  }
};
