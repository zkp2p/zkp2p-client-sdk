import { createContext } from 'react';

interface GeolocationValues {
  countryCode: string | null;
  currencyCode: string | null;
  error: string | null;
}

const defaultValues: GeolocationValues = {
  countryCode: null,
  currencyCode: null,
  error: null
};

const GeolocationContext = createContext<GeolocationValues>(defaultValues);

export default GeolocationContext; 