import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface AddAccoladeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccoladeAdded: () => void;
}

export const AddAccoladeModal: React.FC<AddAccoladeModalProps> = ({
  isOpen,
  onClose,
  onAccoladeAdded,
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accolade, setAccolade] = useState({
    title: '',
    issuer: '',
    date_received: '',
    url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('accolades')
        .insert([
          {
            ...accolade,
            profile_id: user?.id,
          },
        ]);

      if (insertError) throw insertError;

      onAccoladeAdded();
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
            Add Accolade
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                required
                value={accolade.title}
                onChange={(e) => setAccolade({ ...accolade, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Issuer
              </label>
              <input
                type="text"
                required
                value={accolade.issuer}
                onChange={(e) => setAccolade({ ...accolade, issuer: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date Received
              </label>
              <input
                type="date"
                required
                value={accolade.date_received}
                onChange={(e) => setAccolade({ ...accolade, date_received: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Certificate URL (optional)
              </label>
              <input
                type="url"
                value={accolade.url}
                onChange={(e) => setAccolade({ ...accolade, url: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#c50112] bg-white border border-[#c50112] rounded-md hover:bg-[#fff5f5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c50112]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#c50112] border border-transparent rounded-md hover:bg-[#a30110] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c50112]"
              >
                {loading ? 'Adding...' : 'Add Accolade'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};