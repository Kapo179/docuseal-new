import axios from 'axios';

interface TailorCVResponse {
  success: boolean;
  pdfUrl?: string;
  previewUrl?: string;
  error?: string;
}

export async function tailorCV(pdfFile: File, jobDetails: string): Promise<TailorCVResponse> {
  try {
    const formData = new FormData();
    formData.append('cv', pdfFile);
    formData.append('jobDetails', jobDetails);

    const response = await axios.post('/.netlify/functions/tailorCV', formData);
    const { threadId, runId } = response.data;

    while (true) {
      const statusResponse = await axios.post('/.netlify/functions/checkCVStatus', {
        threadId,
        runId
      });

      if (statusResponse.data.status === 'completed') {
        return {
          success: true,
          pdfUrl: statusResponse.data.result.pdfUrl,
          previewUrl: statusResponse.data.result.previewUrl
        };
      }

      if (statusResponse.data.status === 'failed') {
        throw new Error(statusResponse.data.error);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Error tailoring CV:', error);
    return {
      success: false,
      error: 'Failed to tailor CV. Please try again.'
    };
  }
} 