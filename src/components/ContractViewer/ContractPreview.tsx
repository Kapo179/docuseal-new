interface ContractPreviewProps {
    imageUrl: string;
  }
  
  export function ContractPreview({ imageUrl }: ContractPreviewProps) {
    return (
      <div className="relative flex items-center justify-center">
        <div className="aspect-[1/1.4] max-h-[600px] overflow-hidden bg-gray-50 flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Contract Preview"
            className="w-full h-full object-fit"
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 pointer-events-none" />
      </div>
    );
  }