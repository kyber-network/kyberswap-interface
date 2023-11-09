import { rgba } from 'polished'
import React, { useCallback, useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import sprite from 'assets/svg/sprite.svg'
import { NotificationType } from 'components/Announcement/type'
import { ICON_IDS } from 'constants/index'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { useNotify } from 'state/application/hooks'

const allSvgFiles = import.meta.glob('../../assets/svg/*')
const allIconComponentsFiles = import.meta.glob('../../components/Icons/*')

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin: auto;
  width: 1000px;
  color: ${({ theme }) => theme.subText};
  gap: 10px;
  margin: 20px 0;
`
const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => rgba(theme.background, 0.8)};
  width: 120px;
  height: 100px;
  flex-direction: column;
  border-radius: 5px;
  box-shadow: 0 2px 2px 2px #050505;
  padding: 20px 10px;
  font-size: 12px;
  &:hover {
    transform: scale(1.2);
  }
  > svg {
    display: block;
    height: 24px;
    width: 24px;
    flex: 1;
  }
  cursor: pointer;
`

const IconWrapperV2 = styled(IconWrapper)`
  color: ${({ theme }) => theme.subText};
  gap: 8px;
  > svg {
    display: block;
    width: 100%;
  }
`
const camelizeSnake = (st: string) =>
  st
    .split('_')
    .map((i: string) => i[0].toUpperCase() + i.slice(1))
    .join('')

export default function Icons() {
  const [svgComponents, setSvgComponents] = useState<any>([])
  const [iconComponents, setIconComponents] = useState<any>([])
  const [copied, setCopied] = useCopyClipboard(2000)
  const notify = useNotify()
  const theme = useTheme()

  const onClick = useCallback(
    (id: string) => {
      setCopied(id)
    },
    [setCopied],
  )

  useEffect(() => {
    if (copied) {
      notify({
        title: 'Copy success',
        summary: `Copied '${copied}'`,
        type: NotificationType.SUCCESS,
      })
    }
  }, [copied, notify])

  useEffect(() => {
    const array = Object.keys(allSvgFiles).map(key => ({ id: key.split('/').pop(), fn: allSvgFiles[key]() }))
    Promise.all(array.map(el => el.fn))
      .then(data => {
        setSvgComponents(
          data.map((e: any, i) => {
            const id = array[i].id
            return {
              render: !id?.endsWith('.svg')
                ? () => <img src={e.default} style={{ maxWidth: '100%' }} />
                : e.ReactComponent,
              id,
            }
          }),
        )
      })
      .catch(console.error)

    const componentArr = Object.keys(allIconComponentsFiles).map(key => ({
      id: key.split('/').pop()?.replace('.tsx', ''),
      fn: allIconComponentsFiles[key](),
    }))
    Promise.all(componentArr.map(el => el.fn))
      .then(data => {
        setIconComponents(
          data.map((e: any, i) => {
            const id = componentArr[i].id
            return {
              render: e.default || (() => null),
              id,
            }
          }),
        )
      })
      .catch(console.error)
  }, [])
  return (
    <>
      <h2>Svg sprite icon</h2>
      <Wrapper>
        {ICON_IDS.map((id: string) => (
          <IconWrapper key={id} onClick={() => onClick(`<Icon id="${id}" size={16} />`)}>
            <svg>
              <use href={`${sprite}#${id}`} width="24" height="24" />
            </svg>
            {id}
          </IconWrapper>
        ))}
      </Wrapper>
      <h2>All Svg in: folder /assets/svg </h2>
      <Wrapper>
        {svgComponents.map((el: any) => {
          const title: string = el.id
          return (
            <IconWrapperV2
              key={el.id}
              onClick={() =>
                onClick(`import { ReactComponent as ${camelizeSnake(title.slice(0, -4))} } from 'assets/svg/${title}'`)
              }
            >
              {el.render?.()}
              <Text fontSize={10} style={{ wordBreak: 'break-all' }}>
                {title}
              </Text>
            </IconWrapperV2>
          )
        })}
      </Wrapper>
      <h2>All icons in: folder /components/Icons </h2>
      <Wrapper>
        {iconComponents.map((el: any) => {
          const key: string = el.id
          return (
            <IconWrapperV2 key={key} onClick={() => onClick(`import ${key} from 'components/Icons/${key}'`)}>
              {(() => {
                try {
                  return typeof el?.render === 'function'
                    ? el.render({ color: theme.text })
                    : React.createElement(el?.render)
                } catch (error) {
                  return 'Display Error'
                }
              })()}
              <Text fontSize={10} style={{ wordBreak: 'break-all' }}>
                {key}.tsx
              </Text>
            </IconWrapperV2>
          )
        })}
      </Wrapper>
    </>
  )
}
