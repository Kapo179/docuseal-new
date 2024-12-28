import { CVTailoringInterface } from '../components/cv-tailoring-sleek'
import { Link } from 'react-router-dom'

export function Home() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <nav className="w-full p-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/L4017.png"
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="font-semibold text-gray-900">CV Assistant</span>
        </Link>
        <div className="flex gap-4">
          <Link 
            to="/contracts" 
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Contracts
          </Link>
          <Link 
            to="/legal" 
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Legal
          </Link>
        </div>
      </nav>

      <div className="flex-1">
        <CVTailoringInterface />
      </div>
    </main>
  )
} 