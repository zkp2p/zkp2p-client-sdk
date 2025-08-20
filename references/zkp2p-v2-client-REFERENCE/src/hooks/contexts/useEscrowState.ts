import { useContext } from 'react';

import { EscrowContext } from '@contexts/Escrow';

const useEscrowState = () => {
  return { ...useContext(EscrowContext) }
}

export default useEscrowState;
