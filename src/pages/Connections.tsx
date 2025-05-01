import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Clock, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Profile {
  id: string;
  full_name: string;
  headline?: string;
  avatar_url?: string;
}

interface Connection {
  id: string;
  sender: Profile;
  receiver: Profile;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export const Connections = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load accepted connections
      const { data: acceptedData, error: acceptedError } = await supabase
        .from('connections')
        .select(`
          id,
          sender:sender_id (id, full_name, headline, avatar_url),
          receiver:receiver_id (id, full_name, headline, avatar_url),
          status,
          created_at
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .eq('status', 'accepted');

      if (acceptedError) throw acceptedError;

      // Load sent requests
      const { data: sentData, error: sentError } = await supabase
        .from('connections')
        .select(`
          id,
          sender:sender_id (id, full_name, headline, avatar_url),
          receiver:receiver_id (id, full_name, headline, avatar_url),
          status,
          created_at
        `)
        .eq('sender_id', user?.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Load received requests
      const { data: receivedData, error: receivedError } = await supabase
        .from('connections')
        .select(`
          id,
          sender:sender_id (id, full_name, headline, avatar_url),
          receiver:receiver_id (id, full_name, headline, avatar_url),
          status,
          created_at
        `)
        .eq('receiver_id', user?.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      setConnections(acceptedData || []);
      setSentRequests(sentData || []);
      setReceivedRequests(receivedData || []);
    } catch (error: any) {
      console.error('Error loading connections:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, headline, avatar_url')
        .ilike('full_name', `%${query}%`)
        .neq('id', user?.id)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .insert([
          {
            sender_id: user?.id,
            receiver_id: receiverId,
            status: 'pending'
          }
        ]);

      if (error) throw error;
      await loadConnections();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'reject') => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', connectionId);

      if (error) throw error;
      await loadConnections();
    } catch (error: any) {
      console.error('Error handling connection request:', error);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading connections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error loading connections: {error}</div>
      </div>
    );
  }

  const getAvatarUrl = (avatarPath: string) => {
    if (!avatarPath) return null;
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  const renderProfile = (profile: Profile) => (
    <Link to={`/profile/${profile.id}`} className="flex items-center space-x-3 hover:bg-[#fff5f5] p-2 rounded-md">
      {profile.avatar_url ? (
        <img
          src={getAvatarUrl(profile.avatar_url)}
          alt={profile.full_name}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-lg text-gray-500">
            {profile.full_name[0]?.toUpperCase()}
          </span>
        </div>
      )}
      <div>
        <div className="font-medium text-gray-900">{profile.full_name}</div>
        {profile.headline && (
          <div className="text-sm text-gray-500">{profile.headline}</div>
        )}
      </div>
    </Link>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('connections')}
              className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'connections'
                  ? 'border-[#c50112] text-[#c50112]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5 mx-auto mb-1" />
              Connections ({connections.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'sent'
                  ? 'border-[#c50112] text-[#c50112]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserPlus className="w-5 h-5 mx-auto mb-1" />
              Sent ({sentRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'received'
                  ? 'border-[#c50112] text-[#c50112]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-5 h-5 mx-auto mb-1" />
              Received ({receivedRequests.length})
            </button>
          </nav>
        </div>

        <div className="p-4">
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c50112]"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 hover:bg-[#fff5f5] flex justify-between items-center"
                  >
                    {renderProfile(result)}
                    <button
                      onClick={() => sendConnectionRequest(result.id)}
                      className="px-3 py-1 text-sm text-[#c50112] hover:text-[#a30110] border border-[#c50112] rounded-md hover:bg-[#fff5f5]"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connections List */}
          {activeTab === 'connections' && (
            <div className="space-y-4">
              {connections.map((connection) => {
                const otherUser = connection.sender.id === user?.id
                  ? connection.receiver
                  : connection.sender;
                return (
                  <div key={connection.id} className="p-4 border rounded-lg">
                    {renderProfile(otherUser)}
                  </div>
                );
              })}
              {connections.length === 0 && (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No connections yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start connecting with other film professionals
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sent Requests */}
          {activeTab === 'sent' && (
            <div className="space-y-4">
              {sentRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg">
                  {renderProfile(request.receiver)}
                  <div className="mt-2 text-sm text-gray-500">
                    Pending since {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {sentRequests.length === 0 && (
                <div className="text-center py-8">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't sent any connection requests
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Received Requests */}
          {activeTab === 'received' && (
            <div className="space-y-4">
              {receivedRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg">
                  {renderProfile(request.sender)}
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleConnectionAction(request.id, 'accept')}
                      className="flex items-center px-3 py-1 text-sm text-[#c50112] hover:text-[#a30110] border border-[#c50112] rounded-md hover:bg-[#fff5f5]"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleConnectionAction(request.id, 'reject')}
                      className="flex items-center px-3 py-1 text-sm text-[#c50112] hover:text-[#a30110] border border-[#c50112] rounded-md hover:bg-[#fff5f5]"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {receivedRequests.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No incoming requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any pending connection requests
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};