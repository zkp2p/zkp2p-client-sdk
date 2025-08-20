import { useContext } from 'react';

import { GeolocationContext } from '@contexts/Geolocation';

const useGeolocation = () => {
  return { ...useContext(GeolocationContext) }
};

export default useGeolocation;
