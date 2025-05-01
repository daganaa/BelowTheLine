import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  type: 'film' | 'professional' | 'work_in_progress';
  url?: string;
  image_url?: string;
  start_date?: string;
  end_date?: string;
  rating?: number;
}

interface EditPortfolioItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: () => void;
  item: PortfolioItem;
}

export const EditPortfolioItemModal: React.FC<EditPortfolioItemModalProps> = ({
  isOpen,
  onClose,
  onItemUpdated,
  item,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedItem, setEditedItem] = useState<PortfolioItem>(item);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('portfolio_items')
        .update({
          ...editedItem,
          end_date: editedItem.type === 'work_in_progress' ? null : editedItem.end_date,
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      onItemUpdated();
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
        .from('portfolio_items')
        .delete()
        .eq('id', item.id);

      if (deleteError) throw deleteError;

      onItemUpdated();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const typeTitle = editedItem.type === 'work_in_progress' ? 'Rough Cut' : 
                   editedItem.type === 'professional' ? 'Professional Work' : 'Film';

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
            Edit {typeTitle}
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {showDeleteConfirm ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete this {typeTitle.toLowerCase()}? This action cannot be undone.
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
                  value={editedItem.title}
                  onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={editedItem.description}
                  onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Project URL
                </label>
                <input
                  type="url"
                  value={editedItem.url}
                  onChange={(e) => setEditedItem({ ...editedItem, url: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <input
                  type="url"
                  value={editedItem.image_url}
                  onChange={(e) => setEditedItem({ ...editedItem, image_url: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                />
              </div>

              {editedItem.type === 'film' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rating
                  </label>
                  <select
                    value={editedItem.rating || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, rating: parseInt(e.target.value) || undefined })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                  >
                    <option value="">No rating</option>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>{rating} stars</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editedItem.start_date}
                  onChange={(e) => setEditedItem({ ...editedItem, start_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                />
              </div>

              {editedItem.type !== 'work_in_progress' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editedItem.end_date}
                    onChange={(e) => setEditedItem({ ...editedItem, end_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                  />
                </div>
              )}

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