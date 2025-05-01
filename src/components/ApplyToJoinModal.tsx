import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface ApplyToJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioItemId: string;
}

export const ApplyToJoinModal: React.FC<ApplyToJoinModalProps> = ({
  isOpen,
  onClose,
  portfolioItemId,
}) => {
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const maxLength = 300;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('rough_cut_applications')
        .insert([
          {
            portfolio_item_id: portfolioItemId,
            applicant_id: user.id,
            comment: comment.trim(),
          },
        ]);

      if (submitError) throw submitError;
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
            Apply to Join Crew
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Why would you like to join this project?
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, maxLength))}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                placeholder="Tell us about your interest and what you can bring to the project..."
                required
              />
              <div className="mt-1 text-sm text-gray-500 flex justify-end">
                {comment.length}/{maxLength} characters
              </div>
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
                disabled={loading || !comment.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#c50112] border border-transparent rounded-md hover:bg-[#a30110] disabled:opacity-50"
              >
                {loading ? 'Applying...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};