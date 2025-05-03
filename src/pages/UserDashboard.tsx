// src/pages/UserDashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Star, 
  List, 
  Settings, 
  Calendar, 
  Edit, 
  PlusCircle, 
  TrendingUp
} from 'lucide-react';
import { PageContainer } from '@/components';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from '@/components/common/StatCard';
import VisitedPlaquesPanel from '@/components/profile/VisitedPlaquesPanel';
import UserCollectionsPanel from '@/components/profile/UserCollectionsPanel';
import userData from '../data/user_data.json';

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = userData.user;
  const visitedPlaques = userData.visited_plaques;
  const collections = userData.collections;
  
  // Calculate statistics
  const totalVisits = visitedPlaques.length;
  const totalCollections = collections.length;
  const totalFavorites = collections.filter(c => c.is_favorite).length;
  
  // Calculate unique plaques visited (since the same plaque can be visited multiple times)
  const uniquePlaquesVisited = new Set(visitedPlaques.map(v => v.plaque_id)).size;
  
  // Calculate visit streak (in a real app, this would be more sophisticated)
  const calculateStreak = () => {
    // For demo purposes, we'll just return a fixed number
    // In a real app, you would calculate based on consecutive days
    return 4;
  };
  
  const streak = calculateStreak();
  
  // Calculate visits by month for the chart
  const getVisitsByMonth = () => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(sixMonthsAgo);
      date.setMonth(date.getMonth() + i);
      months.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        count: 0
      });
    }
    
    // Count visits per month
    visitedPlaques.forEach(visit => {
      const visitDate = new Date(visit.visited_at);
      
      if (visitDate >= sixMonthsAgo) {
        const monthIndex = visitDate.getMonth() - sixMonthsAgo.getMonth() + 
                          (visitDate.getFullYear() - sixMonthsAgo.getFullYear()) * 12;
        
        if (monthIndex >= 0 && monthIndex < 6) {
          months[monthIndex].count++;
        }
      }
    });
    
    return months;
  };
  
  const visitsByMonth = getVisitsByMonth();
  
  return (
    <PageContainer activePage="profile">
      <div className="container mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center">
            <User size={40} className="text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-gray-500 mb-3">Member since {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <MapPin size={12} className="mr-1" /> {uniquePlaquesVisited} Unique Plaques
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <List size={12} className="mr-1" /> {totalCollections} Collections
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Star size={12} className="mr-1" /> {totalFavorites} Favorites
              </Badge>
              {streak > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <TrendingUp size={12} className="mr-1" /> {streak} Day Streak
                </Badge>
              )}
            </div>
          </div>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Settings size={16} /> Settings
          </Button>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            label="Total Visits" 
            value={totalVisits}
            icon={<MapPin className="text-blue-500" size={20} />} 
          />
          <StatCard 
            label="Collections" 
            value={totalCollections}
            icon={<List className="text-purple-500" size={20} />} 
          />
          <StatCard 
            label="Favorite Collections" 
            value={totalFavorites} 
            icon={<Star className="text-amber-500" size={20} />} 
          />
          <StatCard 
            label="Visit Streak" 
            value={streak} 
            subValue="days"
            icon={<Calendar className="text-green-500" size={20} />} 
          />
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Visits */}
          <div className="lg:col-span-2">
            <VisitedPlaquesPanel />
          </div>
          
          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Favorite Collections */}
            <UserCollectionsPanel showFavoritesOnly={true} />
            
            {/* Visits By Month */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4">Visit Activity</h3>
              <div className="flex items-end h-36 gap-2 mt-4">
                {visitsByMonth.map((month, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-blue-100 rounded-t" 
                      style={{ height: `${Math.max(month.count * 10, 4)}px` }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2">{month.month}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4">
                <span className="text-sm text-gray-500">{visitsByMonth[0].month} {visitsByMonth[0].year}</span>
                <span className="text-sm text-gray-500">{visitsByMonth[5].month} {visitsByMonth[5].year}</span>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/discover')}
                >
                  <MapPin className="mr-2" size={16} /> Discover New Plaques
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/collections')}
                >
                  <PlusCircle className="mr-2" size={16} /> Create New Collection
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/profile/edit')}
                >
                  <Edit className="mr-2" size={16} /> Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default UserDashboard;