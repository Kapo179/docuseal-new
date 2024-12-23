interface ContractHeaderProps {
  title: string;
  subtitle: string;
}

export function ContractHeader({ title, subtitle }: ContractHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center mb-4">
        <div className="bg-blue-500 p-3 rounded-xl">
          <FileText className="w-6 h-6 text-white" />
        </div>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        {title}
      </h1>
      <p className="mt-2 text-gray-600">{subtitle}</p>
    </div>
  );
} 