import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ContractSelector } from './components/ContractSelector';
import { VehicleAgreement } from './components/VehicleAgreement';
import { InfluencerAgreement } from './components/InfluencerAgreement';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SigningFlow } from './components/SigningFlow';
import { EmbeddedSigning } from './components/EmbeddedSigning';
import { SigningStatus } from './components/SigningStatus';
import { PaymentSuccessPage } from './components/PaymentSuccessPage';
import type { ContractType, FormStep } from './types';

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-pulse space-y-4 w-full max-w-md">
      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [selectedContract, setSelectedContract] = useLocalStorage<ContractType>('selected_contract', null);
  const [currentStep, setCurrentStep] = useLocalStorage<FormStep>('current_step', 'verification');

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Router>
          <Routes>
            <Route path="/" element={
              !selectedContract ? (
                <ContractSelector onSelect={setSelectedContract} />
              ) : selectedContract === 'influencer' ? (
                <InfluencerAgreement onReset={() => setSelectedContract(null)} />
              ) : (
                <VehicleAgreement 
                  onReset={() => setSelectedContract(null)}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                />
              )
            } />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/signing-setup" element={<SigningFlow />} />
            <Route 
              path="/embedded-signing" 
              element={
                <EmbeddedSigning 
                  signingUrl={sessionStorage.getItem('docuseal_signing_url') || ''}
                  onComplete={() => {
                    sessionStorage.removeItem('docuseal_signing_url');
                    window.location.href = '/signing-status';
                  }}
                  onError={(error) => {
                    console.error('Signing error:', error);
                    window.location.href = '/signing-status';
                  }}
                />
              } 
            />
            <Route path="/signing-status" element={<SigningStatus />} />
          </Routes>
        </Router>
      </Suspense>
    </ErrorBoundary>
  );
}