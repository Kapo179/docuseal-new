export type Currency = 'USD' | 'GBP' | 'EUR';
export type Condition = 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type FormStep = 'verification' | 'vehicle' | 'documents' | 'review';
export type ContractType = 'vehicle' | 'influencer' | null;
export type ContractStatus = 'draft' | 'pending_signatures' | 'completed';
export type PaymentStatus = 'pending' | 'completed';

export interface ContractParty {
  name: string;
  email: string;
}

export interface VehicleDetails {
  vin: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  currency: Currency;
  condition: Condition;
}

export interface DocumentStatus {
  registration: boolean;
  insurance: boolean;
  inspection: boolean;
  inspectionNotes?: string;
}

// Make FormData more flexible
export interface FormData {
  [key: string]: any;
}