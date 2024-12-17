import { type FC } from 'react';
import { type FormStep } from '../types';

interface Props {
  currentStep: FormStep;
}

const steps: { id: FormStep; label: string; emoji: string }[] = [
  { id: 'verification', label: 'Check', emoji: '🔍' },
  { id: 'vehicle', label: 'Vehicle', emoji: '🚗' },
  { id: 'documents', label: 'Docs', emoji: '📋' },
  { id: 'review', label: 'Review', emoji: '📝' },
];

export const StepIndicator: FC<Props> = ({ currentStep }) => {
  return (
    <nav aria-label="Progress" className="mb-8 sm:mb-12">
      <ol className="flex items-center justify-between w-full max-w-3xl mx-auto px-2 sm:px-4">
        {steps.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
          
          return (
            <li key={step.id} className="relative flex-1 flex flex-col items-center">
              {idx !== steps.length - 1 && (
                <div 
                  className="absolute left-[50%] right-[-50%] top-[1.375rem] sm:top-[1.75rem] h-0.5 bg-gray-200"
                  aria-hidden="true"
                >
                  <div 
                    className={`
                      h-full bg-gradient-to-r from-blue-500 to-indigo-500
                      transition-all duration-500 ease-in-out
                      ${isCompleted ? 'w-full' : 'w-0'}
                    `}
                  />
                </div>
              )}
              
              <div className="relative mb-2 sm:mb-3 group">
                <div
                  className={`
                    w-10 h-10 sm:w-13 sm:h-13 rounded-full flex items-center justify-center text-base sm:text-xl
                    transform transition-all duration-300 ease-in-out
                    ${isActive ? 'scale-110' : 'scale-100'}
                    ${isCompleted ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30' : 
                      isActive ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30' : 
                      'bg-white border-2 border-gray-200'}
                  `}
                >
                  <span className={`
                    transition-all duration-300
                    ${isCompleted || isActive ? 'text-white' : 'text-gray-400'}
                  `}>
                    {isCompleted ? '✓' : step.emoji}
                  </span>
                  
                  {isActive && (
                    <div className="absolute inset-0 rounded-full animate-ping-slow opacity-30 bg-blue-500" />
                  )}
                </div>

                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 sm:mt-3 w-max">
                  <span className={`
                    text-xs sm:text-sm font-medium block text-center whitespace-nowrap
                    ${isActive ? 'text-blue-600' : 'text-gray-500'}
                    transition-colors duration-200
                  `}>
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="hidden sm:block text-xs text-blue-400 mt-1 text-center animate-fadeIn">
                      Current Step
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};