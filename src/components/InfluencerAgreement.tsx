import { ArrowLeft, Users } from 'lucide-react';

interface Props {
  onReset: () => void;
}

export function InfluencerAgreement({ onReset }: Props) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="px-4 pt-6 pb-2">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contract Selection
        </button>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-4">
          <div className="bg-blue-500 p-3 rounded-xl">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Generate Influencer Agreement
        </h1>
        <p className="mt-2 text-gray-600">Create a professional contract for influencer partnerships</p>
      </div>

      <div className="form-card text-center p-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon!</h2>
        <p className="text-gray-600">
          We're currently building this feature. Check back soon for professional influencer agreement templates.
        </p>
      </div>
    </div>
  );
}