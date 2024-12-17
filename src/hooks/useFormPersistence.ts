import { useEffect } from 'react';
import { type FormData } from '../types';
import Cookies from 'js-cookie';

const STORAGE_KEY = 'vehicle_agreement_form';
const SESSION_COOKIE = 'vehicle_agreement_session';
const EXPIRY_DAYS = 7;

export function useFormPersistence(formData: FormData, setFormData: (data: FormData) => void) {
  // Load saved data on initial mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const sessionId = Cookies.get(SESSION_COOKIE);

    if (!sessionId) {
      // Generate new session ID if none exists
      Cookies.set(SESSION_COOKIE, generateSessionId(), { expires: EXPIRY_DAYS });
    }

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
        clearSavedData();
      }
    }
  }, [setFormData]);

  // Save data on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  return {
    clearSavedData,
    getSessionId: () => Cookies.get(SESSION_COOKIE),
  };
}

export function clearSavedData() {
  localStorage.removeItem(STORAGE_KEY);
  Cookies.remove(SESSION_COOKIE);
}

function generateSessionId(): string {
  return `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}