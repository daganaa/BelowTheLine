import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface AddEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEducationAdded: () => void;
}

export const AddEducationModal: React.FC<AddEducationModalProps> = ({
  isOpen,
  onClose,
  onEducationAdded,
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [education, setEducation] = useState({
    school: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert month input to date format
      const startDate = education.start_date ? `${education.start_date}-01` : null;
      const endDate = education.end_date ? `${education.end_date}-01` : null;

      const { error: insertError } = await supabase
        .from('education')
        .insert([
          {
            ...education,
            profile_id: user?.id,
            start_date: startDate,
            end_date: endDate,
          },
        ]);

      if (insertError) throw insertError;

      onEducationAdded();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            Add Education
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                School
              </label>
              <input
                type="text"
                required
                value={education.school}
                onChange={(e) => setEducation({ ...education, school: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Degree
              </label>
              <input
                type="text"
                required
                value={education.degree}
                onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Field of Study
              </label>
              <input
                type="text"
                required
                value={education.field_of_study}
                onChange={(e) => setEducation({ ...education, field_of_study: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="month"
                required
                value={education.start_date}
                onChange={(e) => setEducation({ ...education, start_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date (leave empty if current)
              </label>
              <input
                type="month"
                value={education.end_date}
                onChange={(e) => setEducation({ ...education, end_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#c50112] bg-white border border-[#c50112] rounded-md hover:bg-[#fff5f5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#c50112] border border-transparent rounded-md hover:bg-[#a30110]"
              >
                {loading ? 'Adding...' : 'Add Education'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};