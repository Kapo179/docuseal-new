import axios from 'axios';

interface TailorCVResponse {
  success: boolean;
  tailoredCV?: string;
  error?: string;
}

export async function tailorCV(cvText: string, jobDetails: string): Promise<TailorCVResponse> {
  try {
    const response = await axios.post('/.netlify/functions/tailorCV', {
      cv: cvText,
      jobDetails
    });

    return {
      success: true,
      tailoredCV: response.data.tailoredCV
    };
  } catch (error) {
    console.error('Error tailoring CV:', error);
    return {
      success: false,
      error: 'Failed to tailor CV. Please try again.'
    };
  }
} 