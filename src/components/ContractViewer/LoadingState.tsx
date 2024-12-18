import { Loader } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
      <p className="text-gray-600">Loading your contract... ⌛</p>
    </div>
  );
}