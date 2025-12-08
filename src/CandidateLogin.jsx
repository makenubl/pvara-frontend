import React, { useState } from "react";

export default function CandidateLogin({ onLogin, onCancel }) {
  const [cnic, setCnic] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleCnicChange = (e) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 5) val = val.slice(0, 5) + '-' + val.slice(5);
    if (val.length > 13) val = val.slice(0, 13) + '-' + val.slice(13);
    if (val.length > 15) val = val.slice(0, 15);
    setCnic(val);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate CNIC format
    if (!cnic || cnic.length !== 15) {
      setError("Please enter a valid CNIC (e.g., 12345-1234567-1)");
      return;
    }
    
    // Validate verification field
    const verificationValue = verificationMethod === "phone" ? phone : email;
    if (!verificationValue) {
      setError(`Please enter your ${verificationMethod}`);
      return;
    }
    
    onLogin({ 
      cnic, 
      [verificationMethod]: verificationValue 
    });
  };

  return (
    <div style={{fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif'}} className="max-w-2xl mx-auto px-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Track Applications</h1>
          <p className="text-gray-600">Access your application status using your CNIC</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CNIC Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CNIC (National Identity Card) *
            </label>
            <input
              type="text"
              value={cnic}
              onChange={handleCnicChange}
              placeholder="12345-1234567-1"
              maxLength="15"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition font-mono text-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Format: xxxxx-xxxxxxx-x</p>
          </div>

          {/* Verification Method Toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Verify with *
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setVerificationMethod("phone")}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  verificationMethod === "phone"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Phone Number
              </button>
              <button
                type="button"
                onClick={() => setVerificationMethod("email")}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  verificationMethod === "email"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Email
              </button>
            </div>

            {/* Verification Input */}
            {verificationMethod === "phone" ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                placeholder="0300-1234567"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                required
              />
            ) : (
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                required
              />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Access My Applications
          </button>

          {/* Cancel Button */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Back to Jobs
            </button>
          )}
        </form>

        {/* Info Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Why CNIC?</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Secure access to all your applications</li>
            <li>• Works with any email you used to apply</li>
            <li>• No password to remember</li>
            <li>• Prevents duplicate profiles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
