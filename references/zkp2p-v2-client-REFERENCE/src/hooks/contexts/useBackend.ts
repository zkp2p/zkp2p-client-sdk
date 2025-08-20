import { useContext } from 'react';

import { BackendContext } from '@contexts/Backend';

const useBackend = () => {
  return { ...useContext(BackendContext) };
};

export default useBackend;
