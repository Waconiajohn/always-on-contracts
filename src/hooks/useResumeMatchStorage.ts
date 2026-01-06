import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'careeriq_resume_match';

interface StoredData {
  resumeText: string;
  jobDescription: string;
  lastUpdated: string;
}

export function useResumeMatchStorage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredData = JSON.parse(stored);
        if (data.resumeText) setResumeText(data.resumeText);
        if (data.jobDescription) setJobDescription(data.jobDescription);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      const data: StoredData = {
        resumeText,
        jobDescription,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [resumeText, jobDescription, isLoaded]);

  const clearAll = useCallback(() => {
    setResumeText('');
    setJobDescription('');
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateResume = useCallback((text: string) => {
    setResumeText(text);
  }, []);

  const updateJobDescription = useCallback((text: string) => {
    setJobDescription(text);
  }, []);

  return {
    resumeText,
    jobDescription,
    updateResume,
    updateJobDescription,
    clearAll,
    isLoaded
  };
}
