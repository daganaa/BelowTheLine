import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Accolade {
  id: string;
  title: string;
  issuer: string;
  date_received: string;
  url?: string;
}

interface EditAccoladeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccoladeUpdated: () => void;
  accolade: Accolade;
}

export const EditAccoladeModal: React.FC<EditAccoladeModalProps> = ({
  isOpen,
  onClose,
  onAccoladeUpdated,
  accolade,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedAccolade, setEditedAccolade] = useState<Accolade>(accolade);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('accolades')
        .update(editedAccolade)
        .eq('id', accolade.id);

      if (updateError) throw updateError;

      onAccoladeUpdated();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('accolades')
        .delete()
        .eq('id', accolade.id);

      if (deleteError) throw deleteError;

      onAccoladeUpdated();
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
            Edit Accolade
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {showDeleteConfirm ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete this accolade? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-[#c50112] bg-white border border-[#c50112] rounded-md hover:bg-[#fff5f5]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#c50112] border border-transparent rounded-md hover:bg-[#a30110]"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editedAccolade.title}
                  onChange={(e) => setEditedAccolade({ ...editedAccolade, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Issuer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editedAccolade.issuer}
                  onChange={(e) => setEditedAccolade({ ...editedAccolade, issuer: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date Received <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={editedAccolade.date_received}
                  onChange={(e) => setEditedAccolade({ ...editedAccolade, date_received: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Certificate URL
                </label>
                <input
                  type="url"
                  value={editedAccolade.url}
                  onChange={(e) => setEditedAccolade({ ...editedAccolade, url: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#c50112] bg-[#fff5f5] border border-transparent rounded-md hover:bg-[#fff0f0]"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
                <div className="flex space-x-3">
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
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </Dialog>
  );
};