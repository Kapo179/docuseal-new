'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Upload, FileText, X } from 'lucide-react'

export function CVTailoringInterface() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    setFile(uploadedFile)
    const fileUrl = URL.createObjectURL(uploadedFile)
    setPdfUrl(fileUrl)
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
  }

  const marketingFeatures = [
    { title: "ATS-Friendly", icon: "✓" },
    { title: "AI-Powered", icon: "✓" },
    { title: "Best Practices", icon: "✓" },
    { title: "Instant Updates", icon: "✓" }
  ]

  return (
    <div className="h-screen w-full bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
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
            <h1 className="text-xl font-semibold tracking-tight">
              CV Tailoring <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">Assistant</span>
            </h1>
            <p className="text-xs text-gray-500">AI-powered CV optimization for your dream job</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="col-span-2 space-y-4">
            {!file ? (
              <div 
                {...getRootProps()} 
                className={`h-[200px] border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-500'
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium">Drop your CV here</p>
                  <p className="text-xs text-gray-500">or click to select</p>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-purple-500 mr-2" />
                    <span className="text-xs font-medium truncate">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removePdf}
                    className="h-6 w-6 text-gray-500 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden">
                  {pdfUrl ? (
                    <iframe
                      src={`${pdfUrl}#toolbar=0`}
                      className="w-full h-full"
                      title="CV Preview"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
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
                  className="h-8 text-xs"
                />
                <Button 
                  className="h-8 bg-purple-600 hover:bg-purple-700 transition-colors text-white text-xs font-medium px-3"
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
              <span className="text-purple-600 font-bold text-sm">{feature.icon}</span>
              <p className="text-xs font-medium text-gray-800">{feature.title}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-center text-gray-500">
          Powered by advanced AI to help you land your next opportunity
        </p>
      </div>
    </div>
  )
}
