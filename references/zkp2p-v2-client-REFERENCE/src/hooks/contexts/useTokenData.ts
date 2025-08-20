import { useContext } from 'react'

import { TokenDataContext } from '@contexts/TokenData'

const useTokenData = () => {
  return { ...useContext(TokenDataContext) }
}

export default useTokenData 