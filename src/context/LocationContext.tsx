import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Location {
  id: string;
  nameEn: string;
  nameTe: string;
  state: string;
  latitude: number;
  longitude: number;
  climateZone: 'coastal' | 'interior' | 'rayalaseema' | 'telangana';
}

export const andhraPradeshLocations: Location[] = [
  { id: 'srikakulam', nameEn: 'Srikakulam', nameTe: 'శ్రీకాకుళం', state: 'Andhra Pradesh', latitude: 18.296, longitude: 83.902, climateZone: 'coastal' },
  { id: 'vizianagaram', nameEn: 'Vizianagaram', nameTe: 'విజయనగరం', state: 'Andhra Pradesh', latitude: 18.102, longitude: 83.415, climateZone: 'coastal' },
  { id: 'visakhapatnam', nameEn: 'Visakhapatnam', nameTe: 'విశాఖపట్నం', state: 'Andhra Pradesh', latitude: 17.686, longitude: 83.218, climateZone: 'coastal' },
  { id: 'east-godavari', nameEn: 'East Godavari', nameTe: 'తూర్పు గోదావరి', state: 'Andhra Pradesh', latitude: 16.945, longitude: 82.237, climateZone: 'coastal' },
  { id: 'west-godavari', nameEn: 'West Godavari', nameTe: 'పశ్చిమ గోదావరి', state: 'Andhra Pradesh', latitude: 16.754, longitude: 81.732, climateZone: 'coastal' },
  { id: 'krishna', nameEn: 'Krishna', nameTe: 'కృష్ణా', state: 'Andhra Pradesh', latitude: 16.137, longitude: 81.139, climateZone: 'coastal' },
  { id: 'guntur', nameEn: 'Guntur', nameTe: 'గుంటూరు', state: 'Andhra Pradesh', latitude: 16.306, longitude: 80.436, climateZone: 'coastal' },
  { id: 'prakasam', nameEn: 'Prakasam', nameTe: 'ప్రకాశం', state: 'Andhra Pradesh', latitude: 15.505, longitude: 80.048, climateZone: 'coastal' },
  { id: 'nellore', nameEn: 'Nellore', nameTe: 'నెల్లూరు', state: 'Andhra Pradesh', latitude: 14.443, longitude: 79.986, climateZone: 'coastal' },
  { id: 'chittoor', nameEn: 'Chittoor', nameTe: 'చిత్తూరు', state: 'Andhra Pradesh', latitude: 13.217, longitude: 79.100, climateZone: 'rayalaseema' },
  { id: 'anantapur', nameEn: 'Anantapur', nameTe: 'అనంతపురం', state: 'Andhra Pradesh', latitude: 14.682, longitude: 77.601, climateZone: 'rayalaseema' },
  { id: 'kurnool', nameEn: 'Kurnool', nameTe: 'కర్నూలు', state: 'Andhra Pradesh', latitude: 15.828, longitude: 78.037, climateZone: 'rayalaseema' },
  { id: 'kadapa', nameEn: 'Kadapa', nameTe: 'కడప', state: 'Andhra Pradesh', latitude: 14.467, longitude: 78.824, climateZone: 'rayalaseema' },
];

interface LocationContextValue {
  location: Location;
  setLocation: (loc: Location) => void;
  locations: Location[];
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

const STORAGE_KEY = 'agromihira-location';

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<Location>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = andhraPradeshLocations.find(l => l.id === stored);
      if (found) return found;
    }
    return andhraPradeshLocations[0];
  });

  const setLocation = (loc: Location) => {
    setLocationState(loc);
    localStorage.setItem(STORAGE_KEY, loc.id);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, locations: andhraPradeshLocations }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
