import React, { useState, useEffect } from 'react';
import { Calendar, Link as LinkIcon, Pencil, Star, Trash2, Users, MessageCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getYouTubeThumbnail } from '../utils/youtube';
import { FilmComments } from './FilmComments';
import { supabase } from '../lib/supabase';
import { AddCrewMemberModal } from './AddCrewMemberModal';
import { ApplyToJoinModal } from './ApplyToJoinModal';
import { ReviewApplicationsModal } from './ReviewApplicationsModal';

interface Contributor {
  id: string;
  fullName: string;
  role: string;
  department: string;
  avatarUrl?: string;
}

interface RatingStats {
  averageRating: number;
  totalRatings: number;
}

interface FilmProps {
  id: string;
  title: string;
  description: string;
  type: 'film' | 'professional' | 'work_in_progress';
  imageUrl?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  rating?: number;
  contributors?: Contributor[];
  onEdit?: () => void;
  onDelete?: () => void;
  showEditButton?: boolean;
  profileId?: string;
}

export const Film: React.FC<FilmProps> = ({
  id,
  title,
  description,
  type,
  imageUrl,
  url,
  startDate,
  endDate,
  rating,
  contributors = [],
  onEdit,
  onDelete,
  showEditButton,
  profileId,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [crewMembers, setCrewMembers] = useState<Contributor[]>([]);
  const [isAddCrewModalOpen, setIsAddCrewModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [pendingApplications, setPendingApplications] = useState(0);

  useEffect(() => {
    if (type === 'film') {
      loadRatingStats();
    }
    loadCrewMembers();
    if (type === 'work_in_progress' && showEditButton) {
      loadPendingApplicationsCount();
    }
  }, [id]);

  const loadPendingApplicationsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('rough_cut_applications')
        .select('*', { count: 'exact', head: true })
        .eq('portfolio_item_id', id)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingApplications(count || 0);
    } catch (error) {
      console.error('Error loading pending applications count:', error);
    }
  };

  const loadRatingStats = async () => {
    try {
      const { data, error } = await supabase
        .from('film_ratings')
        .select('rating')
        .eq('portfolio_item_id', id);

      if (error) throw error;

      if (data && data.length > 0) {
        const totalRatings = data.length;
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        const averageRating = sum / totalRatings;

        setRatingStats({
          averageRating,
          totalRatings
        });
      }
    } catch (error) {
      console.error('Error loading rating stats:', error);
    }
  };

  const loadCrewMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_contributors')
        .select(`
          id,
          role,
          department,
          profile:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('portfolio_item_id', id);

      if (error) throw error;

      if (data) {
        const formattedCrewMembers = data.map(item => ({
          id: item.profile.id,
          fullName: item.profile.full_name,
          role: item.role,
          department: item.department,
          avatarUrl: item.profile.avatar_url
        }));
        setCrewMembers(formattedCrewMembers);
      }
    } catch (error) {
      console.error('Error loading crew members:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return null;
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  const renderCrewMembers = () => (
    <div className="flex -space-x-2 overflow-hidden">
      {crewMembers.map((member, index) => (
        <Link
          key={member.id}
          to={`/profile/${member.id}`}
          className="relative inline-block"
          style={{ zIndex: crewMembers.length - index }}
        >
          {member.avatarUrl ? (
            <img
              src={getAvatarUrl(member.avatarUrl)}
              alt={member.fullName}
              className="h-8 w-8 rounded-full border-2 border-white transition-transform hover:scale-110"
            />
          ) : (
            <div 
              className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center transition-transform hover:scale-110"
            >
              <span className="text-xs text-gray-500">
                {member.fullName[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </Link>
      ))}
      {showEditButton && type !== 'work_in_progress' && (
        <button
          onClick={() => setIsAddCrewModalOpen(true)}
          className="h-8 w-8 rounded-full border-2 border-white bg-[#fff5f5] flex items-center justify-center hover:bg-[#fff0f0]"
          title="Add crew member"
        >
          <UserPlus className="h-4 w-4 text-[#c50112]" />
        </button>
      )}
      {showEditButton && type === 'work_in_progress' && (
        <button
          onClick={() => setIsReviewModalOpen(true)}
          className="h-8 px-3 rounded-full border-2 border-white bg-[#fff5f5] flex items-center hover:bg-[#fff0f0]"
        >
          <span className="text-sm text-[#c50112] whitespace-nowrap">
            Review crew members ({pendingApplications})
          </span>
        </button>
      )}
    </div>
  );

  const thumbnailUrl = url ? getYouTubeThumbnail(url) : imageUrl;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {thumbnailUrl && (
        <div className="h-48 w-full overflow-hidden relative">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-200"
            >
              <div className="text-white text-center">
                <LinkIcon className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">Watch on YouTube</span>
              </div>
            </a>
          )}
        </div>
      )}
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              {showEditButton && (
                <div className="flex space-x-2">
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <span className="mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full bg-[#fff5f5] text-[#c50112]">
              {type === 'work_in_progress' ? 'rough cut' : type}
            </span>
          </div>
        </div>
        
        {(startDate || endDate) && (
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {startDate && new Date(startDate).toLocaleDateString()}
              {endDate && ` - ${new Date(endDate).toLocaleDateString()}`}
            </span>
          </div>
        )}

        <p className="mt-3 text-gray-600">{description}</p>

        {type === 'film' && (
          <div className="mt-4">
            {ratingStats && (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {renderStars(Math.round(ratingStats.averageRating))}
                </div>
                <span className="text-sm text-gray-600">
                  ({ratingStats.averageRating.toFixed(1)} from {ratingStats.totalRatings} rating{ratingStats.totalRatings !== 1 ? 's' : ''})
                </span>
              </div>
            )}
            {!ratingStats && (
              <div className="text-sm text-gray-500">No ratings yet</div>
            )}
          </div>
        )}

        {url && !thumbnailUrl && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-4 text-sm text-[#c50112] hover:text-[#a30110]"
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            View Project
          </a>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 flex items-center mb-2">
              <Users className="h-4 w-4 mr-1" />
              Crew Members
            </h4>
          </div>
          {crewMembers.length > 0 ? (
            renderCrewMembers()
          ) : (
            <div className="text-sm text-gray-500">
              No crew members yet
              {showEditButton && type !== 'work_in_progress' && (
                <button
                  onClick={() => setIsAddCrewModalOpen(true)}
                  className="ml-2 text-[#c50112] hover:text-[#a30110]"
                >
                  Add crew member
                </button>
              )}
              {showEditButton && type === 'work_in_progress' && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="ml-2 text-[#c50112] hover:text-[#a30110]"
                >
                  Review crew members ({pendingApplications})
                </button>
              )}
            </div>
          )}
        </div>

        {type === 'work_in_progress' && !showEditButton && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-[#c50112] rounded-md hover:bg-[#a30110] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c50112]"
            >
              Apply to Join
            </button>
          </div>
        )}

        {type === 'film' && profileId && (
          <div className="mt-4 border-t pt-4">
            <button
              onClick={() => setShowComments(!showComments)}
              className="inline-flex items-center text-sm text-[#c50112] hover:text-[#a30110]"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {showComments ? 'Hide Comments' : 'Show Comments and Rating'}
            </button>
            {showComments && (
              <div className="mt-4">
                <FilmComments filmId={id} filmOwnerId={profileId} onRatingUpdated={loadRatingStats} />
              </div>
            )}
          </div>
        )}
      </div>

      <AddCrewMemberModal
        isOpen={isAddCrewModalOpen}
        onClose={() => setIsAddCrewModalOpen(false)}
        onCrewMemberAdded={loadCrewMembers}
        portfolioItemId={id}
      />

      <ApplyToJoinModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        portfolioItemId={id}
      />

      <ReviewApplicationsModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          loadPendingApplicationsCount();
          loadCrewMembers();
        }}
        portfolioItemId={id}
      />
    </div>
  );
};