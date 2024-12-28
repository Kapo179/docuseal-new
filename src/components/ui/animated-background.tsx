export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] animate-blob-slow">
        <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-[#C7F9CC]/30 blur-3xl" />
        <div className="absolute top-[40%] right-[20%] w-[35%] h-[35%] rounded-full bg-[#80ED99]/20 blur-3xl animate-blob" />
        <div className="absolute bottom-[20%] left-[25%] w-[30%] h-[30%] rounded-full bg-[#57CC99]/20 blur-3xl animate-blob-delay" />
        <div className="absolute top-[10%] right-[30%] w-[25%] h-[25%] rounded-full bg-[#38A3A5]/20 blur-3xl animate-blob-slow" />
      </div>
    </div>
  )
} 