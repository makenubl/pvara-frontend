/**
 * Settings Component - Email Template Management System
 * 
 * PURPOSE:
 * Allows administrators to customize email templates sent to candidates
 * throughout the recruitment process. Templates support variable substitution
 * and are persisted to localStorage for reuse.
 * 
 * FEATURES:
 * - Visual template editor with live preview
 * - Variable system ({{candidateName}}, {{jobTitle}}, etc.)
 * - Reset to defaults (individual or all templates)
 * - Email sender configuration
 * - Admin-only access
 * 
 * TEMPLATE TYPES:
 * 1. APPLICATION_RECEIVED - Auto-sent when candidate applies
 * 2. TEST_INVITED - Auto-sent when test invitation is sent
 * 3. APPLICATION_SHORTLISTED - Auto-sent when added to shortlist
 * 4. INTERVIEW_SCHEDULED - Manual/future feature
 * 5. OFFER_EXTENDED - Auto-sent when offer is extended
 * 6. REJECTION - Manual/future feature
 * 
 * DATA STORAGE:
 * - Templates: localStorage key 'pvara_email_templates'
 * - Settings: localStorage key 'pvara_email_settings'
 * 
 * VARIABLE SYSTEM:
 * Variables are replaced when email is sent:
 * {{candidateName}} → "John Doe"
 * {{jobTitle}} → "Senior Developer"
 * {{salary}} → "$120,000"
 * 
 * USAGE:
 * <Settings 
 *   onSave={() => console.log('Saved')} 
 *   onCancel={() => setView('dashboard')}
 * />
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';

// Default email templates (fallback if no custom templates saved)
const defaultTemplates = {
  APPLICATION_RECEIVED: {
    subject: 'Application Received - {{jobTitle}}',
    body: 'Dear {{candidateName}},\n\nThank you for applying to {{jobTitle}}. We have received your application and will review it shortly. You will be notified of the next steps.\n\nBest regards,\nPVARA Recruitment Team'
  },
  TEST_INVITED: {
    subject: 'Assessment Test - {{jobTitle}}',
    body: 'Dear {{candidateName}},\n\nCongratulations! You\'ve been selected to take our assessment test for the {{jobTitle}} position. Please check your candidate portal for test details and instructions. The test link will be available shortly.\n\nBest regards,\nPVARA Recruitment Team'
  },
  APPLICATION_SHORTLISTED: {
    subject: 'Congratulations! You\'ve been shortlisted',
    body: 'Dear {{candidateName}},\n\nGreat news! You have been shortlisted for the {{jobTitle}} position. Our team will contact you soon to schedule an interview.\n\nBest regards,\nPVARA Recruitment Team'
  },
  INTERVIEW_SCHEDULED: {
    subject: 'Interview Scheduled - {{jobTitle}}',
    body: 'Dear {{candidateName}},\n\nYour {{interviewType}} for {{jobTitle}} is scheduled on {{date}} at {{time}}. Please confirm your availability.\n\nBest regards,\nPVARA Recruitment Team'
  },
  OFFER_EXTENDED: {
    subject: 'Job Offer - {{jobTitle}}',
    body: 'Dear {{candidateName}},\n\nWe are excited to offer you the position of {{jobTitle}} with a salary of {{salary}}. Please review the offer and let us know your decision.\n\nBest regards,\nPVARA Recruitment Team'
  },
  REJECTION: {
    subject: 'Application Status Update',
    body: 'Dear {{candidateName}},\n\nThank you for your interest. After careful consideration, we have decided to move forward with other candidates. Best of luck in your future endeavors!\n\nBest regards,\nPVARA Recruitment Team'
  }
};

const templateDescriptions = {
  APPLICATION_RECEIVED: 'Sent automatically when a candidate submits an application',
  TEST_INVITED: 'Sent when candidate is invited to take an assessment test',
  APPLICATION_SHORTLISTED: 'Sent when candidate is added to a shortlist',
  INTERVIEW_SCHEDULED: 'Sent when an interview is scheduled (future feature)',
  OFFER_EXTENDED: 'Sent when a job offer is extended to a candidate',
  REJECTION: 'Sent when a candidate is rejected (future feature)'
};

const availableVariables = {
  APPLICATION_RECEIVED: ['candidateName', 'jobTitle'],
  TEST_INVITED: ['candidateName', 'jobTitle'],
  APPLICATION_SHORTLISTED: ['candidateName', 'jobTitle'],
  INTERVIEW_SCHEDULED: ['candidateName', 'jobTitle', 'interviewType', 'date', 'time'],
  OFFER_EXTENDED: ['candidateName', 'jobTitle', 'salary'],
  REJECTION: ['candidateName', 'jobTitle']
};

export default function Settings({ onSave, onCancel }) {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('APPLICATION_RECEIVED');
  const [hasChanges, setHasChanges] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    fromName: 'PVARA Recruitment',
    fromEmail: 'recruitment@pvara.com',
    replyTo: 'hr@pvara.com'
  });

  useEffect(() => {
    // Load templates from localStorage
    const saved = localStorage.getItem('pvara_email_templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      setTemplates(defaultTemplates);
    }

    // Load email settings
    const savedSettings = localStorage.getItem('pvara_email_settings');
    if (savedSettings) {
      setEmailSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleTemplateChange = (field, value) => {
    setTemplates(prev => ({
      ...prev,
      [selectedTemplate]: {
        ...prev[selectedTemplate],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveTemplates = () => {
    localStorage.setItem('pvara_email_templates', JSON.stringify(templates));
    localStorage.setItem('pvara_email_settings', JSON.stringify(emailSettings));
    setHasChanges(false);
    onSave?.();
  };

  const handleResetTemplate = () => {
    if (window.confirm('Reset this template to default?')) {
      setTemplates(prev => ({
        ...prev,
        [selectedTemplate]: defaultTemplates[selectedTemplate]
      }));
      setHasChanges(true);
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Reset all templates to defaults? This cannot be undone.')) {
      setTemplates(defaultTemplates);
      setHasChanges(true);
    }
  };

  const currentTemplate = templates[selectedTemplate] || defaultTemplates[selectedTemplate];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage email templates and system preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Template List Sidebar */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Email Templates</h3>
            </div>
            <div className="p-2">
              {Object.keys(defaultTemplates).map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${
                    selectedTemplate === key
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">
                    {key.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {key === 'APPLICATION_RECEIVED' ? 'On Submit' :
                     key === 'TEST_INVITED' ? 'On Test Send' :
                     key === 'APPLICATION_SHORTLISTED' ? 'On Shortlist' :
                     key === 'OFFER_EXTENDED' ? 'On Offer' :
                     'Manual'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Email Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Email Settings</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Name</label>
                <input
                  type="text"
                  value={emailSettings.fromName}
                  onChange={(e) => {
                    setEmailSettings(prev => ({ ...prev, fromName: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Email</label>
                <input
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) => {
                    setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reply-To</label>
                <input
                  type="email"
                  value={emailSettings.replyTo}
                  onChange={(e) => {
                    setEmailSettings(prev => ({ ...prev, replyTo: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="col-span-9">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedTemplate.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{templateDescriptions[selectedTemplate]}</p>
                </div>
                <button
                  onClick={handleResetTemplate}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Reset to Default
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Available Variables */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-medium text-blue-900 text-sm mb-2">Available Variables</div>
                    <div className="flex flex-wrap gap-2">
                      {availableVariables[selectedTemplate].map(variable => (
                        <code key={variable} className="px-2 py-1 bg-white text-blue-700 text-xs rounded border border-blue-300">
                          {`{{${variable}}}`}
                        </code>
                      ))}
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      Copy and paste these variables into your template. They will be replaced with actual values when the email is sent.
                    </p>
                  </div>
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email Subject</label>
                <input
                  type="text"
                  value={currentTemplate.subject}
                  onChange={(e) => handleTemplateChange('subject', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Email subject line"
                />
              </div>

              {/* Body Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email Body</label>
                <textarea
                  value={currentTemplate.body}
                  onChange={(e) => handleTemplateChange('body', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  rows={12}
                  placeholder="Email body content"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use \n for line breaks. Keep it professional and concise.
                </p>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Preview</label>
                <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <div className="text-xs text-gray-500 mb-1">Subject:</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {currentTemplate.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                          const examples = {
                            candidateName: 'John Doe',
                            jobTitle: 'Senior Developer',
                            salary: '$120,000',
                            date: 'Dec 15, 2025',
                            time: '2:00 PM',
                            interviewType: 'Technical Interview'
                          };
                          return examples[key] || match;
                        })}
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {currentTemplate.body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                        const examples = {
                          candidateName: 'John Doe',
                          jobTitle: 'Senior Developer',
                          salary: '$120,000',
                          date: 'Dec 15, 2025',
                          time: '2:00 PM',
                          interviewType: 'Technical Interview'
                        };
                        return examples[key] || match;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleResetAll}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
          >
            Reset All to Defaults
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveTemplates}
            disabled={!hasChanges}
            className={`px-6 py-2 rounded-lg transition ${
              hasChanges
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
