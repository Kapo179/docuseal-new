import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { format } from 'date-fns';
import type { FormData } from '../types';

// These would come from your environment variables
const SPREADSHEET_ID = process.env.VITE_GOOGLE_SHEETS_ID;
const CLIENT_EMAIL = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.VITE_GOOGLE_PRIVATE_KEY;

interface SheetRow {
  timestamp: string;
  listingId: string;
  vin: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  condition: string;
  registration: string;
  insurance: string;
  inspection: string;
  inspectionNotes: string;
  verificationStatus: string;
}

export async function appendToSheet(formData: FormData): Promise<void> {
  try {
    const jwt = new JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, jwt);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByIndex[0];
    
    const row: SheetRow = {
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      listingId: generateListingId(),
      vin: formData.vin || 'Not Provided',
      make: formData.make,
      model: formData.model,
      year: formData.year.toString(),
      mileage: formData.mileage.toString(),
      condition: formData.condition,
      registration: formData.registration ? 'Valid' : 'Invalid',
      insurance: formData.insurance ? 'Valid' : 'Invalid',
      inspection: formData.inspection ? 'Completed' : 'Not Completed',
      inspectionNotes: formData.inspectionNotes || 'No notes provided',
      verificationStatus: 'Verified', // This would come from your verification process
    };

    await sheet.addRow(row);
  } catch (error) {
    console.error('Failed to append to Google Sheet:', error);
    throw new Error('Failed to save listing data');
  }
}

function generateListingId(): string {
  return `VEH${Date.now().toString(36).toUpperCase()}`;
}