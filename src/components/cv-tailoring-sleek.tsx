'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Upload, FileText, X } from 'lucide-react'

export function CVTailoringInterface() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup URLs when component unmounts
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [objectUrl, pdfUrl])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    setFile(uploadedFile)
    
    // Create both URLs
    const fileUrl = URL.createObjectURL(uploadedFile)
    setPdfUrl(fileUrl)
    
    // Create object URL for PDF viewing
    const objUrl = URL.createObjectURL(uploadedFile)
    setObjectUrl(objUrl)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  const removePdf = () => {
    setFile(null)
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      setObjectUrl(null)
    }
  }

  const marketingFeatures = [
    { title: "ATS-Friendly", icon: "✓" },
    { title: "AI-Powered", icon: "✓" },
    { title: "Best Practices", icon: "✓" },
    { title: "Instant Updates", icon: "✓" }
  ]

  return (
    <div className="h-screen w-full bg-gradient-to-br from-[#C7F9CC] via-white to-[#C7F9CC] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 flex flex-col space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 relative flex-shrink-0">
            <img
              src="/L4017.png"
              alt="Company Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#22577A]">
              CV Tailoring <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#38A3A5] to-[#57CC99]">Assistant</span>
            </h1>
            <p className="text-xs text-[#22577A]/70">AI-powered CV optimization for your dream job</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="col-span-2 space-y-4">
            {!file ? (
              <div 
                {...getRootProps()} 
                className={`h-[200px] border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-[#38A3A5] bg-[#C7F9CC]/20' : 'border-[#57CC99] hover:border-[#38A3A5]'
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <Upload className="w-8 h-8 text-[#38A3A5] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#22577A]">Drop your CV here</p>
                  <p className="text-xs text-[#22577A]/70">or click to select</p>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-[#38A3A5] mr-2" />
                    <span className="text-xs font-medium truncate text-[#22577A]">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removePdf}
                    className="h-6 w-6 text-[#22577A]/70 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 border border-[#57CC99] rounded-xl overflow-hidden">
                  {pdfUrl ? (
                    <object
                      data={objectUrl || undefined}
                      type="application/pdf"
                      className="w-full h-full"
                    >
                      <div className="w-full h-full flex items-center justify-center bg-[#C7F9CC]/10 text-[#22577A]/70 text-xs">
                        <p>
                          Unable to display PDF preview. 
                          <a 
                            href={pdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#38A3A5] hover:text-[#22577A] ml-1"
                          >
                            Click here to open
                          </a>
                        </p>
                      </div>
                    </object>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#22577A]/70 text-xs">
                      Unable to display PDF preview
                    </div>
                  )}
                </div>
              </div>
            )}

            {file && (
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter target job title..."
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-8 text-xs border-[#57CC99] focus-visible:ring-[#38A3A5] text-[#22577A]"
                />
                <Button 
                  className="h-8 bg-[#80ED99] hover:bg-[#57CC99] transition-colors text-[#22577A] text-xs font-medium px-3"
                  disabled={!jobTitle.trim()}
                >
                  Tailor CV
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          {marketingFeatures.map((feature, index) => (
            <div key={index} className="flex items-center space-x-1">
              <span className="text-[#38A3A5] font-bold text-sm">{feature.icon}</span>
              <p className="text-xs font-medium text-[#22577A]">{feature.title}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-center text-[#22577A]/70">
          Powered by advanced AI to help you land your next opportunity
        </p>
      </div>
    </div>
  )
}
