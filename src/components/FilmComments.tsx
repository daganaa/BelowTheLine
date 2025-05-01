import React, { useState, useEffect } from 'react';
import { Star, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Comment {
  id: string;
  text: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface FilmCommentsProps {
  filmId: string;
  filmOwnerId: string;
  onRatingUpdated?: () => void;
}

export const FilmComments: React.FC<FilmCommentsProps> = ({ 
  filmId, 
  filmOwnerId,
  onRatingUpdated 
}) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadComments();
      checkConnection();
      loadUserRating();
    }
  }, [user, filmId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('film_comments')
        .select(`
          id,
          text,
          created_at,
          user:profiles!film_comments_profile_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('portfolio_item_id', filmId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const checkConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select('status')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${filmOwnerId},receiver_id.eq.${filmOwnerId}`);

      if (error) throw error;
      setIsConnected(data && data.length > 0);
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRating = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('film_ratings')
        .select('rating')
        .eq('portfolio_item_id', filmId)
        .eq('rater_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserRating(data?.rating || null);
    } catch (error) {
      console.error('Error loading user rating:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('film_comments')
        .insert([
          {
            portfolio_item_id: filmId,
            profile_id: user.id,
            text: newComment.trim(),
          },
        ]);

      if (error) throw error;

      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleRating = async (value: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('film_ratings')
        .upsert(
          {
            portfolio_item_id: filmId,
            rater_id: user.id,
            rating: value,
          },
          {
            onConflict: 'portfolio_item_id,rater_id',
          }
        );

      if (error) throw error;

      setUserRating(value);
      if (onRatingUpdated) {
        onRatingUpdated();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return null;
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!isConnected && user?.id !== filmOwnerId) {
    return (
      <div className="text-center py-4 text-gray-500">
        Connect with the filmmaker to leave comments and ratings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(isConnected || user?.id === filmOwnerId) && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Your Rating:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleRating(value)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-5 w-5 ${
                      value <= (userRating || 0)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c50112]"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#c50112] hover:bg-[#a30110] disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Post Comment
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              {comment.user.avatar_url ? (
                <img
                  src={getAvatarUrl(comment.user.avatar_url)}
                  alt={comment.user.full_name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm text-gray-500">
                    {comment.user.full_name[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-medium text-gray-900">
                    {comment.user.full_name}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-gray-600">{comment.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};