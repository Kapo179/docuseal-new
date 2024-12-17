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

export interface FormData extends VehicleDetails, DocumentStatus {
  signature: string;
  privacyAccepted: boolean;
}

export interface SigningData {
  formData: FormData;
  seller: ContractParty;
  buyer: ContractParty;
}

export interface Contract {
  id: string;
  type: 'vehicle' | 'influencer';
  status: ContractStatus;
  formData: FormData;
  createdAt: string;
  updatedAt: string;
  paymentStatus: PaymentStatus;
  parties?: {
    seller: ContractParty;
    buyer: ContractParty;
  };
}