import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { EditProfileModal } from '../components/EditProfileModal';
import { AddPortfolioItemModal } from '../components/AddPortfolioItemModal';
import { EditPortfolioItemModal } from '../components/EditPortfolioItemModal';
import { AddAccoladeModal } from '../components/AddAccoladeModal';
import { EditAccoladeModal } from '../components/EditAccoladeModal';
import { AddEducationModal } from '../components/AddEducationModal';
import { Film } from '../components/Film';
import { MapPin, Globe, Plus, Award, BookOpen, GraduationCap, Pencil, Instagram, Mail, Link } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  headline: string;
  bio: string;
  location: string;
  website: string;
  avatar_url: string;
  instagram_url: string;
  email_public: string;
  other_social_links: { label: string; url: string }[];
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  type: 'film' | 'professional' | 'work_in_progress';
  image_url?: string;
  url?: string;
  start_date?: string;
  end_date?: string;
  contributors?: {
    id: string;
    fullName: string;
    role: string;
  }[];
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
}

interface Accolade {
  id: string;
  title: string;
  issuer: string;
  date_received: string;
  url?: string;
}

export const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [worksInProgress, setWorksInProgress] = useState<PortfolioItem[]>([]);
  const [accolades, setAccolades] = useState<Accolade[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPortfolioModalOpen, setIsAddPortfolioModalOpen] = useState(false);
  const [isAddAccoladeModalOpen, setIsAddAccoladeModalOpen] = useState(false);
  const [isAddEducationModalOpen, setIsAddEducationModalOpen] = useState(false);
  const [isAddWorkInProgressModalOpen, setIsAddWorkInProgressModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [editingAccolade, setEditingAccolade] = useState<Accolade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !userId || userId === user?.id;
  const profileId = userId || user?.id;

  useEffect(() => {
    if (profileId) {
      loadProfile();
      loadPortfolioItems();
      loadAccolades();
      loadEducation();
    }
  }, [profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profile) {
        setError('Profile not found');
        return;
      }

      setProfile(profile);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioItems = async () => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('portfolio_items')
        .select(`
          id,
          title,
          description,
          type,
          image_url,
          url,
          start_date,
          end_date,
          portfolio_contributors (
            id,
            profile:profiles (
              id,
              full_name
            ),
            role
          )
        `)
        .eq('profile_id', profileId);

      if (itemsError) throw itemsError;

      const formattedItems = items?.map((item: any) => ({
        ...item,
        contributors: item.portfolio_contributors?.map((contributor: any) => ({
          id: contributor.profile?.id,
          fullName: contributor.profile?.full_name,
          role: contributor.role,
        })) || [],
      })) || [];

      setPortfolioItems(formattedItems.filter(item => item.type !== 'work_in_progress'));
      setWorksInProgress(formattedItems.filter(item => item.type === 'work_in_progress'));
    } catch (error) {
      console.error('Error loading portfolio items:', error);
    }
  };

  const loadAccolades = async () => {
    try {
      const { data, error } = await supabase
        .from('accolades')
        .select('*')
        .eq('profile_id', profileId)
        .order('date_received', { ascending: false });

      if (error) throw error;
      setAccolades(data || []);
    } catch (error) {
      console.error('Error loading accolades:', error);
    }
  };

  const loadEducation = async () => {
    try {
      const { data, error } = await supabase
        .from('education')
        .select('*')
        .eq('profile_id', profileId)
        .order('end_date', { ascending: false });

      if (error) throw error;
      setEducation(data || []);
    } catch (error) {
      console.error('Error loading education:', error);
    }
  };

  const getAvatarUrl = (avatarPath: string) => {
    if (!avatarPath) return null;
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error loading profile: {error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="relative h-32 bg-[#c50112]">
          <div className="absolute -bottom-16 left-8">
            {profile.avatar_url ? (
              <img
                src={getAvatarUrl(profile.avatar_url)}
                alt={profile.full_name}
                className="h-32 w-32 rounded-full border-4 border-white bg-white object-cover"
              />
            ) : (
              <div className="h-32 w-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                <span className="text-4xl text-gray-500">
                  {profile.full_name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-20 px-8 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.full_name || 'Anonymous'}
              </h1>
              {profile.headline && (
                <p className="mt-1 text-lg text-gray-600">{profile.headline}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-4">
                {profile.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-[#c50112] hover:text-[#a30110]"
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    <span>Website</span>
                  </a>
                )}
                {profile.instagram_url && (
                  <a
                    href={profile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-[#c50112] hover:text-[#a30110]"
                  >
                    <Instagram className="h-4 w-4 mr-1" />
                    <span>Instagram</span>
                  </a>
                )}
                {profile.email_public && (
                  <a
                    href={`mailto:${profile.email_public}`}
                    className="flex items-center text-[#c50112] hover:text-[#a30110]"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    <span>{profile.email_public}</span>
                  </a>
                )}
                {profile.other_social_links?.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-[#c50112] hover:text-[#a30110]"
                  >
                    <Link className="h-4 w-4 mr-1" />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 border border-[#c50112] rounded-md text-sm font-medium text-[#c50112] bg-white hover:bg-[#fff5f5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c50112]"
              >
                Edit Profile
              </button>
            )}
          </div>

          {profile.bio && (
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900">About</h2>
              <p className="mt-2 text-gray-600">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
          {isOwnProfile && (
            <button
              onClick={() => setIsAddPortfolioModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#c50112] hover:bg-[#a30110]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <Film
              key={item.id}
              {...item}
              imageUrl={item.image_url}
              startDate={item.start_date}
              endDate={item.end_date}
              showEditButton={isOwnProfile}
              onEdit={() => setEditingItem(item)}
              profileId={profileId}
            />
          ))}
          {portfolioItems.length === 0 && (
            <div className="col-span-full bg-white shadow rounded-lg p-6 text-center text-gray-500">
              No films added yet
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Award className="h-6 w-6 mr-2" />
            Accolades
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => setIsAddAccoladeModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#c50112] hover:bg-[#a30110]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Accolade
            </button>
          )}
        </div>

        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {accolades.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No accolades added yet
            </div>
          ) : (
            accolades.map((accolade) => (
              <div key={accolade.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{accolade.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{accolade.issuer}</p>
                    {accolade.url && (
                      <a
                        href={accolade.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-[#c50112] hover:text-[#a30110]"
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        View Certificate
                      </a>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {new Date(accolade.date_received).toLocaleDateString()}
                    </span>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditingAccolade(accolade)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-6 w-6 mr-2" />
            Rough Cuts
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => setIsAddWorkInProgressModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#c50112] hover:bg-[#a30110]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rough Cut
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {worksInProgress.map((item) => (
            <Film
              key={item.id}
              {...item}
              imageUrl={item.image_url}
              startDate={item.start_date}
              endDate={item.end_date}
              showEditButton={isOwnProfile}
              onEdit={() => setEditingItem(item)}
              profileId={profileId}
            />
          ))}
          {worksInProgress.length === 0 && (
            <div className="col-span-full bg-white shadow rounded-lg p-6 text-center text-gray-500">
              No rough cuts added yet
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <GraduationCap className="h-6 w-6 mr-2" />
            Education
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => setIsAddEducationModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#c50112] hover:bg-[#a30110]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </button>
          )}
        </div>

        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {education.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No education history added yet
            </div>
          ) : (
            education.map((edu) => (
              <div key={edu.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{edu.school}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {edu.degree} in {edu.field_of_study}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isOwnProfile && (
        <>
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onProfileUpdate={loadProfile}
          />

          <AddPortfolioItemModal
            isOpen={isAddPortfolioModalOpen}
            onClose={() => setIsAddPortfolioModalOpen(false)}
            onItemAdded={loadPortfolioItems}
            type="film"
          />

          <AddPortfolioItemModal
            isOpen={isAddWorkInProgressModalOpen}
            onClose={() => setIsAddWorkInProgressModalOpen(false)}
            onItemAdded={loadPortfolioItems}
            type="work_in_progress"
          />

          <AddAccoladeModal
            isOpen={isAddAccoladeModalOpen}
            onClose={() => setIsAddAccoladeModalOpen(false)}
            onAccoladeAdded={loadAccolades}
          />

          <AddEducationModal
            isOpen={isAddEducationModalOpen}
            onClose={() => setIsAddEducationModalOpen(false)}
            onEducationAdded={loadEducation}
          />

          {editingItem && (
            <EditPortfolioItemModal
              isOpen={true}
              onClose={() => setEditingItem(null)}
              onItemUpdated={loadPortfolioItems}
              item={editingItem}
            />
          )}

          {editingAccolade && (
            <EditAccoladeModal
              isOpen={true}
              onClose={() => setEditingAccolade(null)}
              onAccoladeUpdated={loadAccolades}
              accolade={editingAccolade}
            />
          )}
        </>
      )}
    </div>
  );
};