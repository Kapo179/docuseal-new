interface ContractPreviewProps {
    imageUrl: string;
  }
  
  export function ContractPreview({ imageUrl }: ContractPreviewProps) {
    return (
      <div className="relative">
        <div className="aspect-[1/1.4] max-h-[600px] overflow-hidden bg-gray-50">
          <img
            src={imageUrl}
            alt="Contract Preview"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 pointer-events-none" />
      </div>
    );
  }