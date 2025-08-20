import { useState, useEffect, ReactNode } from 'react';
import GeolocationContext from './GeolocationContext';

interface ProvidersProps {
  children: ReactNode;
}

const GeolocationProvider = ({ children }: ProvidersProps) => {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getGeoLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
          throw new Error('Failed to fetch location');
        }
        const data = await response.json();
        const country = data.country_code.toLowerCase();
        const currency = data.currency;

        setCountryCode(country);
        setCurrencyCode(currency);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get location');

        setCountryCode(null);
        setCurrencyCode(null);
      }
    };

    getGeoLocation();
  }, []);

  return (
    <GeolocationContext.Provider
      value={{
        countryCode,
        currencyCode,
        error
      }}
    >
      {children}
    </GeolocationContext.Provider>
  );
};

export default GeolocationProvider; 