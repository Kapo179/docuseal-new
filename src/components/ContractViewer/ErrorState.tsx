import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 px-4">
      <div className="bg-red-100 rounded-full p-3 mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong 😕</h3>
      <p className="text-gray-600 text-center max-w-md">{message}</p>
    </div>
  );
}