import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Check, X as XIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Application {
  id: string;
  applicant: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  comment: string;
  created_at: string;
}

interface ReviewApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioItemId: string;
}

export const ReviewApplicationsModal: React.FC<ReviewApplicationsModalProps> = ({
  isOpen,
  onClose,
  portfolioItemId,
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadApplications();
    }
  }, [isOpen]);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('rough_cut_applications')
        .select(`
          id,
          comment,
          created_at,
          applicant:applicant_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('portfolio_item_id', portfolioItemId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error loading applications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplication = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error: updateError } = await supabase
        .from('rough_cut_applications')
        .update({ status })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      if (status === 'accepted') {
        const application = applications.find(app => app.id === applicationId);
        if (application) {
          const { error: contributorError } = await supabase
            .from('portfolio_contributors')
            .insert([
              {
                portfolio_item_id: portfolioItemId,
                profile_id: application.applicant.id,
                role: 'Crew Member',
                department: 'Other'
              }
            ]);

          if (contributorError) throw contributorError;
        }
      }

      setApplications(applications.filter(app => app.id !== applicationId));
    } catch (error: any) {
      console.error('Error handling application:', error);
      setError(error.message);
    }
  };

  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return null;
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-lg w-full mx-auto p-6">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            Review Applications
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-4">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No pending applications
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {application.applicant.avatar_url ? (
                      <img
                        src={getAvatarUrl(application.applicant.avatar_url)}
                        alt={application.applicant.full_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-lg text-gray-500">
                          {application.applicant.full_name[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {application.applicant.full_name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {application.comment}
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        Applied {new Date(application.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleApplication(application.id, 'rejected')}
                      className="inline-flex items-center px-3 py-1.5 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
                    >
                      <XIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApplication(application.id, 'accepted')}
                      className="inline-flex items-center px-3 py-1.5 border border-green-600 text-green-600 rounded-md hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};