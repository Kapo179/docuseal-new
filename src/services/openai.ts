import axios from 'axios';

interface TailorCVResponse {
  success: boolean;
  tailoredCV?: string;
  error?: string;
}

export async function tailorCV(pdfFile: File, jobDetails: string): Promise<TailorCVResponse> {
  try {
    // Create form data to send the PDF file
    const formData = new FormData();
    formData.append('cv', pdfFile);
    formData.append('jobDetails', jobDetails);

    const response = await axios.post('/.netlify/functions/tailorCV', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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