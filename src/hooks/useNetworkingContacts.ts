import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NetworkingContact {
  id: string;
  contact_name: string;
  contact_title: string | null;
  contact_company: string | null;
  contact_email: string | null;
  contact_linkedin: string | null;
  relationship_strength: string | null;
  tags: string[] | null;
  notes: string | null;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useNetworkingContacts = () => {
  const [contacts, setContacts] = useState<NetworkingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('networking_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading contacts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContact = async (contact: Omit<NetworkingContact, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('networking_contacts')
        .insert({ ...contact, user_id: user.id });

      if (error) throw error;
      
      await fetchContacts();
      toast({ title: "Contact added" });
    } catch (error: any) {
      toast({
        title: "Error adding contact",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateContact = async (id: string, updates: Partial<NetworkingContact>) => {
    try {
      const { error } = await supabase
        .from('networking_contacts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchContacts();
      toast({ title: "Contact updated" });
    } catch (error: any) {
      toast({
        title: "Error updating contact",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('networking_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setContacts(prev => prev.filter(c => c.id !== id));
      toast({ title: "Contact deleted" });
    } catch (error: any) {
      toast({
        title: "Error deleting contact",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return { contacts, loading, fetchContacts, createContact, updateContact, deleteContact };
};
