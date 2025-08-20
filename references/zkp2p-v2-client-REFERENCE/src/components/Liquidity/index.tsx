import styled from 'styled-components';

import { AutoColumn } from '@components/layouts/Column';
import { LiquidityTable } from '@components/Liquidity/LiquidityTable';

export default function Liquidity() {
  /*
   * Component
   */

  return (
    <Wrapper>
      <LiquidityTable/>
    </Wrapper>
  );
};

const Wrapper = styled(AutoColumn)`
  max-width: 1120px;
  width: 100%;
`;