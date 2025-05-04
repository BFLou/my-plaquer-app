// src/components/collections/EnhancedCollectionManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  Share2, User, Users, Download, Lock, Globe, Tags, 
  ListFilter, Search, Plus, Edit, Settings, X, 
  FolderPlus, CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { Collection } from '@/types/plaque';

// Define enhanced types for collaborative collections
interface CollaboratorPermissions {
  canEdit: boolean;
  canInvite: boolean;
  canManagePlaques: boolean;
}

interface Collaborator {
  id: number;
  name: string;
  email?: string;
  avatarUrl?: string;
  permissions: CollaboratorPermissions;
  dateAdded: string;
}

interface CollectionTag {
  id: number;
  name: string;
  color: string;
}

interface EnhancedCollection extends Collection {
  owner: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  isPublic: boolean;
  isShared: boolean;
  collaborators: Collaborator[];
  tags: CollectionTag[];
  parentId?: number;
  path?: string; // For nested collections
  views: number;
  dateCreated: string;
  dateUpdated: string;
  isPinned?: boolean;
}

type EnhancedCollectionManagerProps = {
  userCollections: EnhancedCollection[];
  onUpdateCollection: (collection: EnhancedCollection) => void;
  onCreateCollection: (collection: Partial<EnhancedCollection>) => void;
  onDeleteCollection: (collectionId: number) => void;
  onExportCollection: (collectionId: number, format: 'pdf' | 'json' | 'csv') => void;
  onImportCollection: (data: any) => void;
  currentUserId: number;
  className?: string;
};

const EnhancedCollectionManager: React.FC<EnhancedCollectionManagerProps> = ({
  userCollections,
  onUpdateCollection,
  onCreateCollection,
  onDeleteCollection,
  onExportCollection,
  onImportCollection,
  currentUserId,
  className = ''
}) => {
  // State
  const [activeTab, setActiveTab] = useState<string>('my');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showTagsModal, setShowTagsModal] = useState<boolean>(false);
  const [activeCollection, setActiveCollection] = useState<EnhancedCollection | null>(null);
  const [sortOption, setSortOption] = useState<string>('updated');
  const [collaboratorEmail, setCollaboratorEmail] = useState<string>('');
  const [collaboratorPermissions, setCollaboratorPermissions] = useState<CollaboratorPermissions>({
    canEdit: false,
    canInvite: false,
    canManagePlaques: true
  });
  const [newTagName, setNewTagName] = useState<string>('');
  const [newTagColor, setNewTagColor] = useState<string>('#3b82f6');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // New collection state
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    icon: '📚',
    color: 'bg-blue-500',
    isPublic: false,
    tags: [],
    parentId: undefined
  });
  
  // Get all available tags across collections
  const allTags = userCollections.reduce((tags, collection) => {
    collection.tags.forEach(tag => {
      if (!tags.some(t => t.id === tag.id)) {
        tags.push(tag);
      }
    });
    return tags;
  }, [] as CollectionTag[]);
  
  // Filter collections based on active tab and search
  const getFilteredCollections = () => {
    let filtered = userCollections;
    
    // Filter by tab
    if (activeTab === 'my') {
      filtered = userCollections.filter(c => c.owner.id === currentUserId);
    } else if (activeTab === 'shared') {
      filtered = userCollections.filter(c => c.owner.id !== currentUserId);
    } else if (activeTab === 'public') {
      filtered = userCollections.filter(c => c.isPublic);
    } else if (activeTab === 'favorite') {
      filtered = userCollections.filter(c => c.isFavorite);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        (c.description && c.description.toLowerCase().includes(query))
      );
    }
    
    // Apply tag filter
// Apply tag filter
if (selectedTags.length > 0) {
    filtered = filtered.filter(c => 
      c.tags.some(tag => selectedTags.includes(tag.id))
    );
  }
  
  // Sort collections
  filtered.sort((a, b) => {
    if (sortOption === 'updated') {
      return new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime();
    } else if (sortOption === 'created') {
      return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
    } else if (sortOption === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'popularity') {
      return b.views - a.views;
    }
    return 0;
  });
  
  return filtered;
};

const filteredCollections = getFilteredCollections();

// Handle collection sharing
const handleShareCollection = (collection: EnhancedCollection) => {
  setActiveCollection(collection);
  setShowShareModal(true);
};

// Add collaborator to collection
const addCollaborator = () => {
  if (!activeCollection || !collaboratorEmail) return;
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(collaboratorEmail)) {
    toast.error("Please enter a valid email address");
    return;
  }
  
  // Check if already a collaborator
  if (activeCollection.collaborators.some(c => c.email === collaboratorEmail)) {
    toast.error("This person is already a collaborator");
    return;
  }
  
  // Create new collaborator object
  const newCollaborator: Collaborator = {
    id: Math.floor(Math.random() * 10000), // In a real app, this would be the user ID
    name: collaboratorEmail.split('@')[0], // Use first part of email as name
    email: collaboratorEmail,
    permissions: { ...collaboratorPermissions },
    dateAdded: new Date().toISOString()
  };
  
  // Add to collection
  const updatedCollection = {
    ...activeCollection,
    collaborators: [...activeCollection.collaborators, newCollaborator],
    isShared: true
  };
  
  // Update collection
  onUpdateCollection(updatedCollection);
  
  // Reset form
  setCollaboratorEmail('');
  setCollaboratorPermissions({
    canEdit: false,
    canInvite: false,
    canManagePlaques: true
  });
  
  // Show success message
  toast.success(`Invitation sent to ${collaboratorEmail}`);
};

// Remove collaborator
const removeCollaborator = (collaboratorId: number) => {
  if (!activeCollection) return;
  
  // Filter out the collaborator
  const updatedCollection = {
    ...activeCollection,
    collaborators: activeCollection.collaborators.filter(c => c.id !== collaboratorId),
    isShared: activeCollection.collaborators.length > 1
  };
  
  // Update collection
  onUpdateCollection(updatedCollection);
  
  // Show success message
  toast.success("Collaborator removed");
};

// Toggle collection public status
const togglePublicStatus = (collection: EnhancedCollection) => {
  const updatedCollection = {
    ...collection,
    isPublic: !collection.isPublic
  };
  
  onUpdateCollection(updatedCollection);
  
  toast.success(`Collection is now ${updatedCollection.isPublic ? 'public' : 'private'}`);
};

// Handle tags management
const handleManageTags = (collection: EnhancedCollection) => {
  setActiveCollection(collection);
  setShowTagsModal(true);
};

// Add a new tag
const addNewTag = () => {
  if (!newTagName.trim()) {
    toast.error("Please enter a tag name");
    return;
  }
  
  // Create a new tag
  const newTag: CollectionTag = {
    id: Math.floor(Math.random() * 10000), // In a real app, this would be a DB ID
    name: newTagName.trim(),
    color: newTagColor
  };
  
  // Add to all tags
  allTags.push(newTag);
  
  // Reset form
  setNewTagName('');
  setNewTagColor('#3b82f6');
  
  toast.success(`Tag "${newTag.name}" created`);
};

// Toggle tag on active collection
const toggleTagOnCollection = (tagId: number) => {
  if (!activeCollection) return;
  
  let updatedTags;
  if (activeCollection.tags.some(t => t.id === tagId)) {
    // Remove tag
    updatedTags = activeCollection.tags.filter(t => t.id !== tagId);
  } else {
    // Add tag
    const tagToAdd = allTags.find(t => t.id === tagId);
    if (tagToAdd) {
      updatedTags = [...activeCollection.tags, tagToAdd];
    } else {
      updatedTags = activeCollection.tags;
    }
  }
  
  // Update collection
  const updatedCollection = {
    ...activeCollection,
    tags: updatedTags
  };
  
  onUpdateCollection(updatedCollection);
};

// Create new collection
const createNewCollection = () => {
  if (!newCollection.name.trim()) {
    toast.error("Please enter a collection name");
    return;
  }
  
  // Create collection object
  const collection: Partial<EnhancedCollection> = {
    ...newCollection,
    owner: {
      id: currentUserId,
      name: "Current User" // In a real app, this would be the user's name
    },
    collaborators: [],
    isShared: false,
    tags: [],
    views: 0,
    dateCreated: new Date().toISOString(),
    dateUpdated: new Date().toISOString()
  };
  
  // Call create function
  onCreateCollection(collection);
  
  // Reset form
  setNewCollection({
    name: '',
    description: '',
    icon: '📚',
    color: 'bg-blue-500',
    isPublic: false,
    tags: [],
    parentId: undefined
  });
  
  // Close modal
  setShowCreateModal(false);
  
  toast.success(`Collection "${collection.name}" created`);
};

// Export collection
const handleExport = (collection: EnhancedCollection, format: 'pdf' | 'json' | 'csv') => {
  onExportCollection(collection.id, format);
  
  toast.success(`Exporting collection as ${format.toUpperCase()}`);
};

// Import collection - handle file input
const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Check file type
  if (!file.name.endsWith('.json')) {
    toast.error("Only JSON files are supported for import");
    return;
  }
  
  // Read file
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      onImportCollection(data);
      toast.success("Collection imported successfully");
    } catch (error) {
      toast.error("Failed to parse import file");
      console.error('Import error:', error);
    }
  };
  reader.readAsText(file);
  
  // Reset input
  event.target.value = '';
};

// Pin/unpin collection
const togglePinCollection = (collection: EnhancedCollection) => {
  const updatedCollection = {
    ...collection,
    isPinned: !collection.isPinned
  };
  
  onUpdateCollection(updatedCollection);
  
  toast.success(`Collection ${updatedCollection.isPinned ? 'pinned' : 'unpinned'}`);
};

return (
  <div className={`bg-white rounded-lg shadow ${className}`}>
    {/* Tabs and controls */}
    <div className="border-b p-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="my">My Collections</TabsTrigger>
            <TabsTrigger value="shared">Shared With Me</TabsTrigger>
            <TabsTrigger value="public">Public Collections</TabsTrigger>
            <TabsTrigger value="favorite">Favorites</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-2" /> New Collection
          </Button>
          
          <input
            type="file"
            id="import-collection"
            className="hidden"
            accept=".json"
            onChange={handleFileImport}
          />
          <Button variant="outline" onClick={() => document.getElementById('import-collection')?.click()}>
            <Download size={16} className="mr-2" /> Import
          </Button>
        </div>
      </div>
    </div>
    
    {/* Filters and search */}
    <div className="p-4 border-b">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Tag filter */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tags size={16} className="mr-2" /> Filter by Tags
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter by Tags</DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                <div className="grid grid-cols-2 gap-3">
                  {allTags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-2">
                      <Checkbox 
                        id={`tag-${tag.id}`} 
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags([...selectedTags, tag.id]);
                          } else {
                            setSelectedTags(selectedTags.filter(id => id !== tag.id));
                          }
                        }}
                      />
                      <Label htmlFor={`tag-${tag.id}`} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></div>
                        <span>{tag.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
                
                {allTags.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No tags available</p>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTags([])}>
                  Clear All
                </Button>
                <Button type="submit">Apply Filters</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Sort options */}
          <select 
            className="px-3 py-2 border rounded-md bg-white"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="name">Alphabetical</option>
            <option value="popularity">Most Popular</option>
          </select>
          
          {/* View mode toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <button 
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white'}`}
              onClick={() => setViewMode('grid')}
            >
              <div className="grid grid-cols-2 gap-1">
                <div className="w-2 h-2 bg-current opacity-70 rounded-sm"></div>
                <div className="w-2 h-2 bg-current opacity-70 rounded-sm"></div>
                <div className="w-2 h-2 bg-current opacity-70 rounded-sm"></div>
                <div className="w-2 h-2 bg-current opacity-70 rounded-sm"></div>
              </div>
            </button>
            <button 
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white'}`}
              onClick={() => setViewMode('list')}
            >
              <div className="flex flex-col gap-1">
                <div className="w-6 h-1 bg-current opacity-70 rounded-sm"></div>
                <div className="w-6 h-1 bg-current opacity-70 rounded-sm"></div>
                <div className="w-6 h-1 bg-current opacity-70 rounded-sm"></div>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Active filters display */}
      {(selectedTags.length > 0 || searchQuery) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTags.map((tagId) => {
            const tag = allTags.find(t => t.id === tagId);
            if (!tag) return null;
            
            return (
              <Badge 
                key={tag.id} 
                className="px-2 py-1 flex items-center gap-1"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` }}
              >
                {tag.name}
                <X 
                  size={14} 
                  className="cursor-pointer" 
                  onClick={() => setSelectedTags(selectedTags.filter(id => id !== tag.id))}
                />
              </Badge>
            );
          })}
          
          {searchQuery && (
            <Badge className="px-2 py-1 flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200">
              Search: {searchQuery}
              <X 
                size={14} 
                className="cursor-pointer" 
                onClick={() => setSearchQuery('')}
              />
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => {
            setSelectedTags([]);
            setSearchQuery('');
          }}>
            Clear All
          </Button>
        </div>
      )}
    </div>
    
    {/* Collections list */}
    <div className="p-4">
      {filteredCollections.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderPlus size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Collections Found</h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'my' 
              ? "You haven't created any collections yet." 
              : activeTab === 'shared' 
                ? "No collections have been shared with you." 
                : activeTab === 'public' 
                  ? "No public collections available." 
                  : "You don't have any favorite collections."}
          </p>
          {activeTab === 'my' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} className="mr-2" /> Create Your First Collection
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-3"
        }>
          {filteredCollections.map((collection) => (
            viewMode === 'grid' ? (
              <div key={collection.id} className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="h-32 relative">
                  <div className={`absolute inset-0 ${collection.color} opacity-10`}></div>
                  <div className="absolute top-4 left-4 w-16 h-16 flex items-center justify-center text-4xl">
                    {collection.icon}
                  </div>
                  
                  {/* Top-right badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {collection.isPublic && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Globe size={12} className="mr-1" /> Public
                      </Badge>
                    )}
                    
                    {collection.isShared && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Users size={12} className="mr-1" /> Shared
                      </Badge>
                    )}
                    
                    {collection.isPinned && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <CheckCircle size={12} className="mr-1" /> Pinned
                      </Badge>
                    )}
                  </div>
                  
                  {/* Actions dropdown */}
                  <div className="absolute bottom-2 right-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Collection Actions</DialogTitle>
                        </DialogHeader>
                        
                        <div className="py-4 flex flex-col gap-2">
                          <Button variant="outline" className="justify-start" onClick={() => handleManageTags(collection)}>
                            <Tags size={16} className="mr-2" /> Manage Tags
                          </Button>
                          
                          <Button variant="outline" className="justify-start" onClick={() => handleShareCollection(collection)}>
                            <Share2 size={16} className="mr-2" /> Share Collection
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="justify-start" 
                            onClick={() => togglePublicStatus(collection)}
                          >
                            {collection.isPublic ? (
                              <>
                                <Lock size={16} className="mr-2" /> Make Private
                              </>
                            ) : (
                              <>
                                <Globe size={16} className="mr-2" /> Make Public
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="justify-start" 
                            onClick={() => togglePinCollection(collection)}
                          >
                            {collection.isPinned ? (
                              <>
                                <CheckCircle size={16} className="mr-2" /> Unpin Collection
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} className="mr-2" /> Pin Collection
                              </>
                            )}
                          </Button>
                          
                          {/* Export options */}
                          <div className="border-t border-b py-2 my-2">
                            <h4 className="font-medium mb-2">Export As...</h4>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleExport(collection, 'pdf')}
                              >
                                PDF
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleExport(collection, 'json')}
                              >
                                JSON
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleExport(collection, 'csv')}
                              >
                                CSV
                              </Button>
                            </div>
                          </div>
                          
                          <Button 
                            variant="destructive" 
                            className="justify-start"
                            onClick={() => onDeleteCollection(collection.id)}
                          >
                            <X size={16} className="mr-2" /> Delete Collection
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1 truncate">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{collection.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium border-2 border-white">
                          {collection.owner.name.charAt(0)}
                        </div>
                        
                        {collection.collaborators.slice(0, 2).map((collaborator, index) => (
                          <div 
                            key={collaborator.id} 
                            className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium border-2 border-white"
                          >
                            {collaborator.name.charAt(0)}
                          </div>
                        ))}
                        
                        {collection.collaborators.length > 2 && (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium border-2 border-white">
                            +{collection.collaborators.length - 2}
                          </div>
                        )}
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        {collection.plaques} plaques
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {collection.tags.slice(0, 2).map((tag) => (
                        <div 
                          key={tag.id} 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                          title={tag.name}
                        ></div>
                      ))}
                      
                      {collection.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{collection.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                key={collection.id} 
                className="flex items-center border rounded-lg p-3 hover:bg-gray-50 transition"
              >
                <div className={`w-12 h-12 flex items-center justify-center text-xl rounded-lg ${collection.color} text-white mr-4`}>
                  {collection.icon}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{collection.name}</h3>
                    
                    {/* Badges */}
                    {collection.isPublic && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        Public
                      </Badge>
                    )}
                    
                    {collection.isShared && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        Shared
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="truncate">{collection.plaques} plaques</span>
                    <span className="mx-2">•</span>
                    <span className="truncate">Updated {new Date(collection.dateUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareCollection(collection);
                    }}
                  >
                    <Share2 size={16} />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManageTags(collection);
                    }}
                  >
                    <Tags size={16} />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePublicStatus(collection);
                    }}
                  >
                    {collection.isPublic ? (
                      <Lock size={16} />
                    ) : (
                      <Globe size={16} />
                    )}
                  </Button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
    
    {/* Create Collection Modal */}
    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input 
              id="name" 
              value={newCollection.name}
              onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
              placeholder="e.g., Literary London"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input 
              id="description" 
              value={newCollection.description}
              onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
              placeholder="What's this collection about?"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2">
              {['📚', '🎨', '🏛️', '🎭', '🎶', '🧠', '🦄', '🏆', '🧪', '🏙️', '🌟', '🎓', '🌍', '⚔️'].map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewCollection({...newCollection, icon})}
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-xl ${
                    newCollection.icon === icon 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {[
                'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 
                'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 
                'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCollection({...newCollection, color})}
                  className={`w-10 h-10 ${color} rounded-lg ${
                    newCollection.color === color 
                      ? 'ring-2 ring-offset-2 ring-blue-400' 
                      : ''
                  }`}
                >
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="public-switch">Make Collection Public</Label>
              <Switch 
                id="public-switch" 
                checked={newCollection.isPublic}
                onCheckedChange={(checked) => setNewCollection({...newCollection, isPublic: checked})}
              />
            </div>
            <p className="text-sm text-gray-500">
              Public collections can be viewed by anyone
            </p>
          </div>
          
          {/* Parent collection selector (for nested collections) */}
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Collection (Optional)</Label>
            <select 
id="parent"
className="w-full px-3 py-2 border rounded-md"
value={newCollection.parentId || ''}
onChange={(e) => setNewCollection({
  ...newCollection, 
  parentId: e.target.value ? parseInt(e.target.value) : undefined
})}
>
<option value="">None (Top Level)</option>
{userCollections
  .filter(c => c.owner.id === currentUserId) // Only allow nesting under your own collections
  .map(collection => (
    <option key={collection.id} value={collection.id}>
      {collection.name}
    </option>
  ))
}
</select>
</div>
</div>

<DialogFooter>
<Button variant="outline" onClick={() => setShowCreateModal(false)}>
Cancel
</Button>
<Button onClick={createNewCollection}>
Create Collection
</Button>
</DialogFooter>
</DialogContent>
</Dialog>

{/* Share Collection Modal */}
<Dialog open={showShareModal} onOpenChange={setShowShareModal}>
<DialogContent className="sm:max-w-[500px]">
<DialogHeader>
<DialogTitle>Share Collection</DialogTitle>
</DialogHeader>

<div className="py-4 space-y-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${activeCollection?.color}`}>
  {activeCollection?.icon}
</div>
<div>
  <h3 className="font-medium">{activeCollection?.name}</h3>
  <p className="text-sm text-gray-500">{activeCollection?.plaques} plaques</p>
</div>
</div>

<div className="flex items-center gap-2">
<span className="text-sm text-gray-500">Public</span>
<Switch 
  checked={activeCollection?.isPublic || false}
  onCheckedChange={(checked) => {
    if (activeCollection) {
      const updatedCollection = {
        ...activeCollection,
        isPublic: checked
      };
      onUpdateCollection(updatedCollection);
    }
  }}
/>
</div>
</div>

{/* Public link */}
{activeCollection?.isPublic && (
<div className="p-3 bg-blue-50 rounded-md">
<div className="flex justify-between items-center">
  <span className="text-sm font-medium">Public Link</span>
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={() => {
      navigator.clipboard.writeText(`https://plaquer.app/collection/${activeCollection.id}`);
      toast.success("Link copied to clipboard");
    }}
  >
    Copy
  </Button>
</div>
<div className="mt-2 flex items-center gap-2">
  <Input 
    value={`https://plaquer.app/collection/${activeCollection.id}`} 
    readOnly
    className="text-sm"
  />
</div>
</div>
)}

{/* Add collaborator */}
<div className="space-y-3">
<h3 className="font-medium">Add Collaborators</h3>

<div className="flex gap-2">
<Input 
  placeholder="Email address" 
  value={collaboratorEmail}
  onChange={(e) => setCollaboratorEmail(e.target.value)}
/>
<Button onClick={addCollaborator}>Add</Button>
</div>

<div className="space-y-2">
<label className="text-sm font-medium">Permissions</label>

<div className="space-y-2">
  <div className="flex items-center gap-2">
    <Checkbox 
      id="perm-edit" 
      checked={collaboratorPermissions.canEdit}
      onCheckedChange={(checked) => setCollaboratorPermissions({
        ...collaboratorPermissions,
        canEdit: !!checked
      })}
    />
    <Label htmlFor="perm-edit">Can edit collection details</Label>
  </div>
  
  <div className="flex items-center gap-2">
    <Checkbox 
      id="perm-invite" 
      checked={collaboratorPermissions.canInvite}
      onCheckedChange={(checked) => setCollaboratorPermissions({
        ...collaboratorPermissions,
        canInvite: !!checked
      })}
    />
    <Label htmlFor="perm-invite">Can invite others</Label>
  </div>
  
  <div className="flex items-center gap-2">
    <Checkbox 
      id="perm-manage" 
      checked={collaboratorPermissions.canManagePlaques}
      onCheckedChange={(checked) => setCollaboratorPermissions({
        ...collaboratorPermissions,
        canManagePlaques: !!checked
      })}
    />
    <Label htmlFor="perm-manage">Can add/remove plaques</Label>
  </div>
</div>
</div>
</div>

{/* Collaborators list */}
<div className="space-y-3">
<h3 className="font-medium">Current Collaborators</h3>

<ScrollArea className="h-48 rounded-md border p-2">
{activeCollection?.collaborators.length === 0 ? (
  <div className="flex flex-col items-center justify-center h-full text-center p-4">
    <Users size={24} className="text-gray-400 mb-2" />
    <p className="text-gray-500 text-sm">No collaborators yet</p>
  </div>
) : (
  <div className="space-y-2">
    {activeCollection?.collaborators.map((collaborator) => (
      <div 
        key={collaborator.id} 
        className="flex items-center justify-between border-b pb-2 last:border-b-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
            {collaborator.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{collaborator.name}</p>
            <p className="text-xs text-gray-500">{collaborator.email}</p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
          onClick={() => removeCollaborator(collaborator.id)}
        >
          <X size={16} />
        </Button>
      </div>
    ))}
  </div>
)}
</ScrollArea>
</div>
</div>

<DialogFooter>
<Button variant="outline" onClick={() => setShowShareModal(false)}>
Done
</Button>
</DialogFooter>
</DialogContent>
</Dialog>

{/* Manage Tags Modal */}
<Dialog open={showTagsModal} onOpenChange={setShowTagsModal}>
<DialogContent>
<DialogHeader>
<DialogTitle>Manage Tags</DialogTitle>
</DialogHeader>

<div className="py-4 space-y-4">
<div>
<h3 className="text-sm font-medium mb-2">Collection Tags</h3>
<div className="flex flex-wrap gap-2">
{allTags.map((tag) => {
  const isTagged = activeCollection?.tags.some(t => t.id === tag.id);
  
  return (
    <Badge 
      key={tag.id} 
      className={`px-2 py-1 cursor-pointer transition-colors ${
        isTagged
          ? 'bg-opacity-100'
          : 'bg-opacity-20'
      }`}
      style={{ 
        backgroundColor: isTagged ? tag.color : `${tag.color}20`, 
        color: tag.color,
        borderColor: `${tag.color}${isTagged ? '40' : '20'}`
      }}
      onClick={() => toggleTagOnCollection(tag.id)}
    >
      {tag.name}
    </Badge>
  );
})}

{allTags.length === 0 && (
  <p className="text-gray-500 text-sm">No tags available</p>
)}
</div>
</div>

<div className="border-t pt-4">
<h3 className="text-sm font-medium mb-2">Create New Tag</h3>
<div className="flex gap-2">
<Input 
  placeholder="Tag name" 
  value={newTagName}
  onChange={(e) => setNewTagName(e.target.value)}
/>
<input 
  type="color" 
  value={newTagColor}
  onChange={(e) => setNewTagColor(e.target.value)}
  className="w-10 h-9 border rounded-md cursor-pointer"
/>
<Button onClick={addNewTag}>Add</Button>
</div>
</div>
</div>

<DialogFooter>
<Button variant="outline" onClick={() => setShowTagsModal(false)}>
Done
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
</div>
);
};

export default EnhancedCollectionManager;