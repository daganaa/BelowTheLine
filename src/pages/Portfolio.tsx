import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Film } from '../components/Film';
import { AddPortfolioItemModal } from '../components/AddPortfolioItemModal';
import { EditPortfolioItemModal } from '../components/EditPortfolioItemModal';

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

export const Portfolio = () => {
  const { user } = useAuthStore();
  const [films, setFilms] = useState<PortfolioItem[]>([]);
  const [professionalWork, setProfessionalWork] = useState<PortfolioItem[]>([]);
  const [worksInProgress, setWorksInProgress] = useState<PortfolioItem[]>([]);
  const [isAddFilmModalOpen, setIsAddFilmModalOpen] = useState(false);
  const [isAddProfessionalModalOpen, setIsAddProfessionalModalOpen] = useState(false);
  const [isAddWorkInProgressModalOpen, setIsAddWorkInProgressModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPortfolioItems();
    }
  }, [user]);

  const loadPortfolioItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: items, error: itemsError } = await supabase
        .from('portfolio_items')
        .select(`
          *,
          portfolio_contributors (
            id,
            profile:profiles (
              id,
              full_name
            ),
            role
          )
        `)
        .eq('profile_id', user?.id);

      if (itemsError) throw itemsError;

      const formattedItems = items.map((item: any) => ({
        ...item,
        contributors: item.portfolio_contributors.map((contributor: any) => ({
          id: contributor.profile.id,
          fullName: contributor.profile.full_name,
          role: contributor.role,
        })),
      }));

      setFilms(formattedItems.filter(item => item.type === 'film'));
      setProfessionalWork(formattedItems.filter(item => item.type === 'professional'));
      setWorksInProgress(formattedItems.filter(item => item.type === 'work_in_progress'));
    } catch (error: any) {
      console.error('Error loading portfolio items:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error loading portfolio: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Films Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Films</h2>
            <button
              onClick={() => setIsAddFilmModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#c50112] hover:bg-[#a30110]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {films.map((film) => (
              <Film
                key={film.id}
                {...film}
                imageUrl={film.image_url}
                startDate={film.start_date}
                endDate={film.end_date}
                showEditButton
                onEdit={() => setEditingItem(film)}
              />
            ))}
            {films.length === 0 && (
              <div className="col-span-full bg-white shadow rounded-lg p-6 text-center text-gray-500">
                No films added yet
              </div>
            )}
          </div>
        </section>

        {/* Professional Work Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Professional Work</h2>
            <button
              onClick={() => setIsAddProfessionalModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#c50112] hover:bg-[#a30110]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Professional Work
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionalWork.map((work) => (
              <Film
                key={work.id}
                {...work}
                imageUrl={work.image_url}
                startDate={work.start_date}
                endDate={work.end_date}
                showEditButton
                onEdit={() => setEditingItem(work)}
              />
            ))}
            {professionalWork.length === 0 && (
              <div className="col-span-full bg-white shadow rounded-lg p-6 text-center text-gray-500">
                No professional work added yet
              </div>
            )}
          </div>
        </section>

        {/* Works in Progress Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Rough Cuts</h2>
            <button
              onClick={() => setIsAddWorkInProgressModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#c50112] hover:bg-[#a30110]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rough Cut
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {worksInProgress.map((work) => (
              <Film
                key={work.id}
                {...work}
                imageUrl={work.image_url}
                startDate={work.start_date}
                endDate={work.end_date}
                showEditButton
                onEdit={() => setEditingItem(work)}
              />
            ))}
            {worksInProgress.length === 0 && (
              <div className="col-span-full bg-white shadow rounded-lg p-6 text-center text-gray-500">
                No rough cuts added yet
              </div>
            )}
          </div>
        </section>
      </div>

      <AddPortfolioItemModal
        isOpen={isAddFilmModalOpen}
        onClose={() => setIsAddFilmModalOpen(false)}
        onItemAdded={loadPortfolioItems}
        type="film"
      />

      <AddPortfolioItemModal
        isOpen={isAddProfessionalModalOpen}
        onClose={() => setIsAddProfessionalModalOpen(false)}
        onItemAdded={loadPortfolioItems}
        type="professional"
      />

      <AddPortfolioItemModal
        isOpen={isAddWorkInProgressModalOpen}
        onClose={() => setIsAddWorkInProgressModalOpen(false)}
        onItemAdded={loadPortfolioItems}
        type="work_in_progress"
      />

      {editingItem && (
        <EditPortfolioItemModal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          onItemUpdated={loadPortfolioItems}
          item={editingItem}
        />
      )}
    </div>
  );
};