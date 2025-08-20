import styled from 'styled-components';


export const Column = styled.div<{
  gap?: string
}>`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: ${({ gap }) => gap || '0'};
`
export const ColumnCenter = styled(Column)`
  width: 100%;
  align-items: center;
`

export const AutoColumn = styled.div<{
  gap?: string
  justify?: 'stretch' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'space-between'
  grow?: true
}>`
  display: grid;
  grid-auto-rows: auto;
  grid-row-gap: ${({ gap }) => gap || '0'};
  justify-items: ${({ justify }) => justify && justify};
  flex-grow: ${({ grow }) => grow && 1};
`

export default Column
