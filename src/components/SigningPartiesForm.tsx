import { Mail, Wand2, PlusCircle } from 'lucide-react';

interface SigningPartiesFormProps {
  emailRecipients: Array<{name: string, email: string}>;
  setEmailRecipients: (recipients: Array<{name: string, email: string}>) => void;
  onAutoFill?: () => void;
  showAutoFill?: boolean;
}

export function SigningPartiesForm({ 
  emailRecipients, 
  setEmailRecipients, 
  onAutoFill,
  showAutoFill 
}: SigningPartiesFormProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-lg p-2">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Enter Signing Parties</h3>
            <p className="text-sm text-blue-700 mt-1">
              Add the email addresses of all parties who need to sign this contract
            </p>
          </div>
          {showAutoFill && (
            <button
              onClick={onAutoFill}
              className="ml-auto inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Wand2 className="w-4 h-4 mr-1.5" />
              Auto-fill
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {emailRecipients.map((recipient, index) => (
          <div key={index} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Party {index + 1} Name
              </label>
              <input
                type="text"
                placeholder="Full Name"
                value={recipient.name}
                onChange={(e) => {
                  const newRecipients = [...emailRecipients];
                  newRecipients[index].name = e.target.value;
                  setEmailRecipients(newRecipients);
                }}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Party {index + 1} Email
              </label>
              <input
                type="email"
                placeholder="Email Address"
                value={recipient.email}
                onChange={(e) => {
                  const newRecipients = [...emailRecipients];
                  newRecipients[index].email = e.target.value;
                  setEmailRecipients(newRecipients);
                }}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        ))}
      </div>

      {emailRecipients.length < 2 && (
        <button
          onClick={() => setEmailRecipients([...emailRecipients, { name: '', email: '' }])}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <PlusCircle className="w-4 h-4 mr-1" />
          Add Another Party
        </button>
      )}
    </div>
  );
} 