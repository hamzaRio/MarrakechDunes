import React, { useState, useEffect } from 'react';
import { useFormAutoSave } from '../hooks/use-autosave';

interface BookingTemplate {
  id: string;
  name: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  activityId: string;
  activityName: string;
  date: string;
  time: string;
  participants: number;
  price: number;
  notes?: string;
  createdAt: string;
  lastUsed?: string;
  useCount: number;
}

interface BookingTemplatesProps {
  onSelectTemplate: (template: BookingTemplate) => void;
  onSaveTemplate: (template: Omit<BookingTemplate, 'id' | 'createdAt' | 'useCount'>) => void;
  currentBooking?: Partial<BookingTemplate>;
}

export const BookingTemplates: React.FC<BookingTemplatesProps> = ({
  onSelectTemplate,
  onSaveTemplate,
  currentBooking
}) => {
  const [templates, setTemplates] = useState<BookingTemplate[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('booking_templates');
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error('Failed to load booking templates:', error);
      }
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = (newTemplates: BookingTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('booking_templates', JSON.stringify(newTemplates));
  };

  // Save current booking as template
  const handleSaveTemplate = () => {
    if (!currentBooking || !templateName.trim()) return;

    const newTemplate: BookingTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      customerName: currentBooking.customerName || '',
      customerPhone: currentBooking.customerPhone || '',
      customerEmail: currentBooking.customerEmail || '',
      activityId: currentBooking.activityId || '',
      activityName: currentBooking.activityName || '',
      date: currentBooking.date || '',
      time: currentBooking.time || '',
      participants: currentBooking.participants || 1,
      price: currentBooking.price || 0,
      notes: currentBooking.notes || '',
      createdAt: new Date().toISOString(),
      useCount: 0
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    setShowSaveModal(false);
    setTemplateName('');
  };

  // Use template
  const handleUseTemplate = (template: BookingTemplate) => {
    const updatedTemplate = {
      ...template,
      lastUsed: new Date().toISOString(),
      useCount: template.useCount + 1
    };

    const updatedTemplates = templates.map(t => 
      t.id === template.id ? updatedTemplate : t
    );
    saveTemplates(updatedTemplates);

    onSelectTemplate(template);
  };

  // Delete template
  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      saveTemplates(updatedTemplates);
    }
  };

  return (
    <div className="space-y-4">
      {/* Save Template Button */}
      {currentBooking && (
        <button
          onClick={() => setShowSaveModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save as Template
        </button>
      )}

      {/* Templates List */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-800">Saved Templates</h3>
        {templates.length === 0 ? (
          <p className="text-gray-500 text-sm">No templates saved yet</p>
        ) : (
          <div className="space-y-2">
            {templates
              .sort((a, b) => (b.lastUsed || b.createdAt).localeCompare(a.lastUsed || a.createdAt))
              .map(template => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{template.name}</h4>
                      <p className="text-sm text-gray-600">
                        {template.customerName} • {template.activityName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {template.participants} participants • {template.price} MAD
                      </p>
                      {template.lastUsed && (
                        <p className="text-xs text-gray-400">
                          Last used: {new Date(template.lastUsed).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="font-semibold text-gray-800 mb-4">Save Booking Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Regular Customer - Marrakech Tour"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Template selector component
export const TemplateSelector: React.FC<{
  templates: BookingTemplate[];
  onSelect: (template: BookingTemplate) => void;
}> = ({ templates, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.activityName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            onClick={() => onSelect(template)}
            className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-medium text-gray-800">{template.name}</h4>
            <p className="text-sm text-gray-600">
              {template.customerName} • {template.activityName}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
