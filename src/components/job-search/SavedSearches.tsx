import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Bookmark, Trash2, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SavedSearch {
  id: string;
  name: string;
  boolean_string: string;
  search_query: string | null;
  location: string | null;
  filters: any;
  created_at: string;
  last_used_at: string | null;
  use_count: number | null;
  user_id: string;
}

interface SavedSearchesProps {
  onLoadSearch: (search: SavedSearch) => void;
  currentBooleanString?: string;
  currentSearchQuery?: string;
  currentLocation?: string;
  currentFilters?: any;
}

export function SavedSearches({
  onLoadSearch,
  currentBooleanString,
  currentSearchQuery,
  currentLocation,
  currentFilters,
}: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchSavedSearches();
    }
  }, [isOpen]);

  const fetchSavedSearches = async () => {
    const { data, error } = await supabase
      .from('saved_boolean_searches')
      .select('*')
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved searches:', error);
      return;
    }

    setSavedSearches(data || []);
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for this search',
        variant: 'destructive',
      });
      return;
    }

    if (!currentBooleanString?.trim()) {
      toast({
        title: 'No boolean string',
        description: 'Please create a boolean search string first',
        variant: 'destructive',
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('saved_boolean_searches').insert({
      user_id: user.id,
      name: searchName.trim(),
      boolean_string: currentBooleanString,
      search_query: currentSearchQuery || null,
      location: currentLocation || null,
      filters: currentFilters || {},
      use_count: 0,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save search',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Search saved',
      description: `"${searchName}" has been saved successfully`,
    });

    setSearchName('');
    setIsSaveDialogOpen(false);
    fetchSavedSearches();
  };

  const handleLoadSearch = async (search: SavedSearch) => {
    // Update use count and last used timestamp
    await supabase
      .from('saved_boolean_searches')
      .update({
        last_used_at: new Date().toISOString(),
        use_count: (search.use_count || 0) + 1,
      })
      .eq('id', search.id);

    onLoadSearch(search);
    setIsOpen(false);

    toast({
      title: 'Search loaded',
      description: `Applied "${search.name}"`,
    });
  };

  const handleDeleteSearch = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('saved_boolean_searches')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete search',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Search deleted',
      description: 'The saved search has been removed',
    });

    setDeleteId(null);
    fetchSavedSearches();
  };

  const canSave = currentBooleanString && currentBooleanString.trim().length > 0;

  return (
    <>
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Searches
              {savedSearches.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {savedSearches.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Saved Boolean Searches</h4>
              </div>

              {savedSearches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved searches yet. Save your first boolean search!
                </p>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {savedSearches.map((search) => (
                      <div
                        key={search.id}
                        className="p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => handleLoadSearch(search)}
                              className="text-left w-full group"
                            >
                              <p className="font-medium truncate group-hover:text-primary">
                                {search.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {search.boolean_string}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {(search.use_count || 0) > 0 && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {search.use_count} uses
                                  </span>
                                )}
                                {search.last_used_at && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(search.last_used_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(search.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSaveDialogOpen(true)}
          disabled={!canSave}
        >
          Save Current
        </Button>
      </div>

      <AlertDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Boolean Search</AlertDialogTitle>
            <AlertDialogDescription>
              Give this search a memorable name so you can quickly load it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="search-name">Search Name</Label>
            <Input
              id="search-name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g., Senior PM with React"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveSearch();
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Current boolean string: <code className="text-xs">{currentBooleanString}</code>
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveSearch}>Save Search</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved search?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this saved search.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSearch} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
