import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import useTheme from 'hooks/useTheme'
import { IKyberScoreChart } from 'pages/TrueSightV2/types'
import { calculateValueToColor, formatTokenPrice } from 'pages/TrueSightV2/utils'

import SimpleTooltip from '../SimpleTooltip'

const Wrapper = styled.div`
  height: 28px;
  width: 140px;
  rect:hover {
    filter: brightness(1.2);
  }
`

export default function KyberScoreChart({
  width,
  height,
  data,
}: {
  width?: string
  height?: string
  data?: Array<IKyberScoreChart>
}) {
  const theme = useTheme()
  // const sampleData = [10, 20, 60, 40, 50, 60, 70, 40, 90, 60, 70, 80, 90, 50, 60, 70, 70, 0]

  const [{ x, y }, setXY] = useState({ x: 0, y: 0 })
  const [hoveringItem, setHoveringItem] = useState<IKyberScoreChart | undefined>()
  const handleMouseEnter = useCallback((e: any, item: IKyberScoreChart) => {
    console.log(e)
    setXY({ x: e.clientX, y: e.clientY })
    setHoveringItem(item)
  }, [])
  const handleMouseLeave = useCallback(() => {
    setXY({ x: 0, y: 0 })
    setHoveringItem(undefined)
  }, [])
  return (
    <Wrapper style={{ width, height }} onMouseLeave={handleMouseLeave}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <g transform="scale(1,-1) translate(0,-100)">
          {data?.map((item, index) => {
            const v = item.kyber_score
            const gap = 2
            const rectWidth = (100 - (data.length - 1) * gap) / data.length
            const rectHeight = v === 0 ? 100 : v
            const color = calculateValueToColor(v, theme)

            return (
              <rect
                key={v + index}
                x={index * (rectWidth + gap)}
                y={0}
                width={rectWidth}
                style={{ fill: v === 0 ? (theme.darkMode ? theme.background + '60' : theme.text + '10') : color }}
                onMouseEnter={e => handleMouseEnter(e, item)}
                strokeWidth={v === 0 ? '2px' : 0}
                stroke={theme.disableText}
                vectorEffect="non-scaling-stroke"
                shapeRendering="crispEdges"
              >
                <animate
                  attributeName="height"
                  from="0"
                  to={rectHeight}
                  dur="0.5s"
                  begin={`${1 + index * 0.05}s`}
                  fill="freeze"
                  keySplines="0 0.33 0.3 1"
                />
              </rect>
            )
          })}
        </g>
      </svg>
      <SimpleTooltip
        x={x}
        y={y}
        text={
          <Column style={{ color: theme.subText, fontSize: '12px', lineHeight: '16px' }} gap="2px">
            <Text>
              {hoveringItem?.created_at && dayjs(hoveringItem?.created_at * 1000).format('DD/MM/YYYY hh:mm A')}
            </Text>
            <Text style={{ whiteSpace: 'nowrap' }}>
              <Trans>KyberScore</Trans>:{' '}
              <span
                style={{ color: hoveringItem ? calculateValueToColor(hoveringItem.kyber_score, theme) : theme.text }}
              >
                {hoveringItem ? `${hoveringItem.kyber_score} (${hoveringItem.tag})` : '--'}
              </span>
            </Text>
            <Text>
              <Trans>Token Price</Trans>:{' '}
              <span style={{ color: theme.text }}>${hoveringItem ? formatTokenPrice(hoveringItem?.price) : '--'}</span>
            </Text>
          </Column>
        }
      />
    </Wrapper>
  )
}
