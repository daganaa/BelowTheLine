import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AddCrewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrewMemberAdded: () => void;
  portfolioItemId: string;
}

export const AddCrewMemberModal: React.FC<AddCrewMemberModalProps> = ({
  isOpen,
  onClose,
  onCrewMemberAdded,
  portfolioItemId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crewMember, setCrewMember] = useState({
    role: '',
    profileId: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; full_name: string }>>([]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      console.error('Error searching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crewMember.profileId || !crewMember.role) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('portfolio_contributors')
        .insert([
          {
            portfolio_item_id: portfolioItemId,
            profile_id: crewMember.profileId,
            role: crewMember.role,
            department: 'Other' // Set a default department since it's required in the database
          },
        ]);

      if (insertError) throw insertError;

      onCrewMemberAdded();
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
            Add Crew Member
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Search Crew Member
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                placeholder="Search by name..."
              />
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md shadow-sm">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        setCrewMember({ ...crewMember, profileId: result.id });
                        setSearchQuery(result.full_name);
                        setSearchResults([]);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#fff5f5]"
                    >
                      {result.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <input
                type="text"
                required
                value={crewMember.role}
                onChange={(e) => setCrewMember({ ...crewMember, role: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50112] focus:ring-[#c50112]"
                placeholder="e.g., Director, Cinematographer, Editor"
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
                {loading ? 'Adding...' : 'Add Crew Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};