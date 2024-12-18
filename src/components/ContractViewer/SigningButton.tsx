import { ArrowRight } from 'lucide-react';

interface SigningButtonProps {
  onClick: () => void;
}

export function SigningButton({ onClick }: SigningButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full btn-primary group flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
    >
      Continue to Sign Contract
      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
    </button>
  );
}