import React, { useEffect, useRef } from 'react'
import styled, { CSSProperties } from 'styled-components'

import useTheme from 'hooks/useTheme'

import { calculateValueToColor } from '../utils'

export const gaugeList: { value: number; d: string }[] = [
  {
    value: 1,
    d: 'M1.40994 126.255C1.73532 128.207 2.06069 130.16 2.49452 132.004L22.4507 127.557C22.1254 126.147 21.9084 124.628 21.5831 123.109L1.40994 126.255Z',
  },
  {
    value: 2,
    d: 'M20.8239 117.252L0.433838 118.988C0.650753 120.94 0.867669 122.893 1.08458 124.845L21.3662 121.699C21.1493 120.181 21.0408 118.771 20.8239 117.252Z',
  },
  {
    value: 3,
    d: 'M20.4985 111.287L0 111.612C0 113.564 0.108458 115.517 0.325373 117.469L20.7154 115.734C20.607 114.324 20.4985 112.805 20.4985 111.287Z',
  },
  {
    value: 4,
    d: 'M20.4985 109.009C20.4985 107.707 20.4985 106.514 20.607 105.213L0.108458 104.128C0 105.863 0 107.382 0 109.009C0 109.334 0 109.768 0 110.094L20.4985 109.768C20.4985 109.551 20.4985 109.334 20.4985 109.009Z',
  },
  {
    value: 5,
    d: 'M21.0408 99.3553L0.650748 96.8606C0.433833 98.813 0.325375 100.765 0.108459 102.718L20.607 103.802C20.7154 102.284 20.8239 100.765 21.0408 99.3553Z',
  },
  {
    value: 6,
    d: 'M21.8 93.3897L1.73534 89.5934C1.40996 91.5458 1.08459 93.4982 0.867676 95.4506L21.1493 97.8368C21.3662 96.3183 21.5831 94.9082 21.8 93.3897Z',
  },
  {
    value: 7,
    d: 'M1.95224 88.1833L22.0169 91.9796C22.3423 90.4611 22.6677 89.051 22.993 87.641L3.25373 82.4346C2.8199 84.387 2.38607 86.2309 1.95224 88.1833Z',
  },
  {
    value: 8,
    d: 'M3.68756 81.0245L23.4269 86.1225C23.8607 84.7124 24.1861 83.1939 24.7284 81.7838L5.31443 75.3843C4.66368 77.2282 4.12139 79.0721 3.68756 81.0245Z',
  },
  {
    value: 9,
    d: 'M5.74826 73.8657L25.1622 80.2652C25.596 78.8552 26.1383 77.4451 26.6806 76.035L7.80896 68.4424C7.04975 70.1778 6.39901 72.0218 5.74826 73.8657Z',
  },
  {
    value: 10,
    d: 'M8.35126 67.0324L27.2229 74.7335C27.7652 73.3234 28.4159 72.0218 29.0667 70.6118L10.7373 61.7175C9.97812 63.453 9.11046 65.1885 8.35126 67.0324Z',
  },
  {
    value: 11,
    d: 'M11.4965 60.3073L29.8259 69.3101C30.4766 68.0085 31.2358 66.5984 31.8866 65.2968L14.3164 55.101C13.2318 56.8364 12.3642 58.5719 11.4965 60.3073Z',
  },
  {
    value: 12,
    d: 'M14.9672 53.9079L32.5373 63.9953C33.2965 62.6937 34.0557 61.3921 34.9234 60.199L18.1124 48.9185C17.0279 50.5455 15.9433 52.1725 14.9672 53.9079Z',
  },
  {
    value: 13,
    d: 'M18.8716 47.6168L35.791 59.0058C36.6587 57.8126 37.5264 56.511 38.394 55.3179L22.3423 42.8442C21.1493 44.4712 20.0647 45.9898 18.8716 47.6168Z',
  },
  {
    value: 14,
    d: 'M23.3184 41.6512L39.3702 54.0164C40.3463 52.8232 41.2139 51.6301 42.1901 50.5454L27.006 37.0956C25.7045 38.6141 24.5115 40.1326 23.3184 41.6512Z',
  },
  {
    value: 15,
    d: 'M27.9821 36.0108L43.1662 49.4607C44.1423 48.376 45.2269 47.2914 46.203 46.2067L31.995 31.7806C30.6935 33.1907 29.2836 34.6008 27.9821 36.0108Z',
  },
  {
    value: 16,
    d: 'M33.0796 30.8045L47.2875 45.2306C48.3721 44.1459 49.4567 43.1697 50.6497 42.1935L37.4179 26.7913C36.0079 28.0929 34.4895 29.3945 33.0796 30.8045Z',
  },
  {
    value: 17,
    d: 'M38.6109 25.8151L51.7343 41.1088C52.9274 40.1326 54.0119 39.1564 55.205 38.2887L43.1662 22.1272C41.5393 23.3203 40.0209 24.5135 38.6109 25.8151Z',
  },
  {
    value: 18,
    d: 'M45.1184 20.7171C44.9015 20.934 44.5761 21.151 44.3592 21.2594L56.398 37.421C56.6149 37.3125 56.7234 37.204 56.9403 36.9871C57.9164 36.2278 59.001 35.4686 60.0856 34.8178L49.1313 17.897C47.8298 18.7647 46.4199 19.7409 45.1184 20.7171Z',
  },
  {
    value: 19,
    d: 'M50.4328 17.1378L61.3871 34.0586C62.6885 33.1908 63.99 32.4316 65.2915 31.6723L55.5303 14.1007C53.6866 14.9684 52.0597 16.0531 50.4328 17.1378Z',
  },
  {
    value: 20,
    d: 'M56.7234 13.3414L66.4846 30.913C67.7861 30.1537 69.0876 29.5029 70.4975 28.8521L61.9294 10.6298C60.194 11.4975 58.4587 12.3652 56.7234 13.3414Z',
  },
  {
    value: 21,
    d: 'M63.3393 9.97897L71.9075 28.2013C73.3174 27.5506 74.6189 27.0082 76.0288 26.4659L68.6537 7.70117C66.9184 8.46044 65.0746 9.2197 63.3393 9.97897Z',
  },
  {
    value: 22,
    d: 'M70.0637 7.15882L77.3304 25.8151C78.7403 25.2727 80.1503 24.7304 81.5602 24.2965L75.7035 5.20642C73.7513 5.85722 71.9075 6.50802 70.0637 7.15882Z',
  },
  {
    value: 23,
    d: 'M77.1134 4.77251L83.0786 23.8626C84.4886 23.4288 86.007 22.9949 87.4169 22.6695L82.7532 3.14551C80.801 3.68784 78.9572 4.23017 77.1134 4.77251Z',
  },
  {
    value: 24,
    d: 'M84.1632 2.82008L88.8269 22.3441C90.3453 22.0187 91.7552 21.6933 93.2736 21.4763L90.0199 1.62695C88.0677 2.06082 86.1154 2.38622 84.1632 2.82008Z',
  },
  {
    value: 25,
    d: 'M91.4299 1.41002L94.7921 21.1509C96.3105 20.934 97.7204 20.7171 99.2388 20.5001L97.2866 0.650757C95.3343 0.86769 93.3821 1.08462 91.4299 1.41002Z',
  },
  {
    value: 26,
    d: 'M98.6965 0.43392L100.757 20.3918C102.276 20.2833 103.794 20.1748 105.312 20.0664L104.553 0.108521C102.601 0.216987 100.649 0.325454 98.6965 0.43392Z',
  },
  {
    value: 27,
    d: 'M106.072 0L106.722 20.0663C107.482 20.0663 108.241 20.0663 109 20.0663C109.759 20.0663 110.518 20.0663 111.278 20.0663L111.928 0C110.952 0 109.976 0 109 0C108.024 0 107.048 0 106.072 0Z',
  },
  {
    value: 28,
    d: 'M113.447 0.108521L112.796 20.0664C114.314 20.1748 115.833 20.2833 117.351 20.3918L119.303 0.43392C117.351 0.325454 115.399 0.216987 113.447 0.108521Z',
  },
  {
    value: 29,
    d: 'M120.822 0.650757L118.761 20.6086C120.28 20.8255 121.798 20.934 123.208 21.2594L126.57 1.51849C124.726 1.08462 122.774 0.86769 120.822 0.650757Z',
  },
  {
    value: 30,
    d: 'M128.089 1.62695L124.726 21.3679C126.245 21.5848 127.655 21.9102 129.173 22.2356L133.837 2.71162C131.993 2.38622 130.041 2.06082 128.089 1.62695Z',
  },
  {
    value: 31,
    d: 'M135.355 3.14551L130.692 22.6695C132.101 22.9949 133.62 23.4288 135.03 23.8626L140.995 4.77251C139.043 4.23017 137.199 3.68784 135.355 3.14551Z',
  },
  {
    value: 32,
    d: 'M142.405 5.20642L136.44 24.2965C137.85 24.7304 139.26 25.2727 140.67 25.8151L147.936 7.15882C146.093 6.50802 144.249 5.85722 142.405 5.20642Z',
  },
  {
    value: 33,
    d: 'M149.346 7.70117L142.08 26.3574C143.49 26.8997 144.899 27.5506 146.201 28.0929L154.769 9.8705C152.925 9.2197 151.19 8.46044 149.346 7.70117Z',
  },
  {
    value: 34,
    d: 'M156.071 10.6298L147.503 28.8521C148.804 29.5029 150.214 30.1537 151.515 30.913L161.277 13.3414C159.541 12.3652 157.806 11.4975 156.071 10.6298Z',
  },
  {
    value: 35,
    d: 'M162.578 14.1007L152.817 31.6723C154.118 32.4316 155.42 33.1908 156.721 34.0586L167.676 17.1378C165.94 16.0531 164.313 14.9684 162.578 14.1007Z',
  },
  {
    value: 36,
    d: 'M172.882 20.7172C171.58 19.741 170.279 18.8732 168.869 18.0055L157.914 34.9263C158.999 35.6855 159.975 36.3363 161.06 37.0956C161.277 37.2041 161.385 37.3125 161.602 37.5295L173.641 21.368C173.424 21.0426 173.207 20.8256 172.882 20.7172Z',
  },
  {
    value: 37,
    d: 'M174.942 22.1272L162.903 38.2887C164.097 39.1564 165.29 40.1326 166.374 41.1088L179.498 25.8151C177.979 24.5135 176.461 23.3203 174.942 22.1272Z',
  },
  {
    value: 38,
    d: 'M180.582 26.7913L167.459 42.085C168.543 43.0612 169.736 44.1459 170.821 45.1221L185.029 30.6961C183.51 29.3945 182.1 28.0929 180.582 26.7913Z',
  },
  {
    value: 39,
    d: 'M186.005 31.7806L171.797 46.2067C172.882 47.2914 173.858 48.376 174.834 49.4607L190.018 36.0108C188.716 34.6008 187.415 33.1907 186.005 31.7806Z',
  },
  {
    value: 40,
    d: 'M190.994 37.204L175.81 50.6538C176.786 51.7385 177.762 52.9316 178.63 54.1248L194.682 41.7596C193.597 40.1326 192.296 38.614 190.994 37.204Z',
  },
  {
    value: 41,
    d: 'M195.658 42.8442L179.606 55.3179C180.474 56.511 181.341 57.7042 182.209 59.0058L199.02 47.7252C198.044 45.9898 196.851 44.4712 195.658 42.8442Z',
  },
  {
    value: 42,
    d: 'M199.996 48.9185L183.077 60.199C183.944 61.5006 184.703 62.6937 185.463 63.9953L203.033 53.7995C202.057 52.1725 201.081 50.5455 199.996 48.9185Z',
  },
  {
    value: 43,
    d: 'M203.792 55.2095L186.222 65.4053C186.981 66.7069 187.632 68.0085 188.283 69.4186L206.612 60.4159C205.744 58.5719 204.768 56.8365 203.792 55.2095Z',
  },
  {
    value: 44,
    d: 'M207.263 61.7175L188.933 70.7202C189.584 72.0218 190.126 73.4319 190.777 74.842L209.649 67.1409C208.89 65.1885 208.13 63.453 207.263 61.7175Z',
  },
  {
    value: 45,
    d: 'M210.191 68.4424L191.319 76.1435C191.862 77.5536 192.404 78.9636 192.838 80.3737L212.252 73.9742C211.601 72.0218 210.95 70.1778 210.191 68.4424Z',
  },
  {
    value: 46,
    d: 'M212.686 75.3843L193.272 81.7838C193.705 83.1939 194.139 84.7124 194.573 86.1225L214.312 81.0245C213.879 79.0721 213.336 77.2282 212.686 75.3843Z',
  },
  {
    value: 47,
    d: 'M216.048 88.1833C215.722 86.2309 215.289 84.387 214.746 82.4346L195.007 87.5325C195.332 88.9426 195.658 90.4611 195.983 91.8712L216.048 88.1833Z',
  },
  {
    value: 48,
    d: 'M196.851 97.8368L217.132 95.4505C216.915 93.4981 216.59 91.5457 216.265 89.7018L196.2 93.4981C196.417 94.9082 196.634 96.3182 196.851 97.8368Z',
  },
  {
    value: 49,
    d: 'M197.393 103.802L217.892 102.718C217.783 100.765 217.566 98.813 217.349 96.8606L197.068 99.2469C197.176 100.765 197.285 102.284 197.393 103.802Z',
  },
  {
    value: 50,
    d: 'M217.892 104.236L197.393 105.321C197.393 106.514 197.502 107.816 197.502 109.117C197.502 109.334 197.502 109.66 197.502 109.877L218 110.202C218 109.877 218 109.443 218 109.117C218 107.382 218 105.863 217.892 104.236Z',
  },
  {
    value: 51,
    d: 'M197.285 115.734L217.675 117.469C217.783 115.517 217.892 113.564 218 111.612L197.502 111.287C197.502 112.805 197.393 114.324 197.285 115.734Z',
  },
  {
    value: 52,
    d: 'M196.634 121.699L216.915 124.845C217.241 122.893 217.458 120.94 217.566 118.988L197.176 117.252C197.068 118.771 196.851 120.181 196.634 121.699Z',
  },
  {
    value: 53,
    d: 'M195.658 127.557L215.614 132.004C216.048 130.051 216.373 128.207 216.699 126.255L196.417 123.109C196.2 124.628 195.983 126.147 195.658 127.557Z',
  },
]

const Wrapper = styled.div`
  position: relative;
`

const MeterGauge = styled.path`
  transition: all 0.2s ease;
`

const GaugeValue = styled.div<{ color?: string; fontSize?: string }>`
  position: absolute;
  bottom: 0px;
  transform: translate(-50%, 0);
  left: 50%;
  font-size: ${({ fontSize }) => fontSize || '40px'};
  font-weight: 500;
  font-family: 'Inter var';
  ${({ theme, color }) => `color: ${color || theme.primary};`};
`

function easeOutQuart(t: number, b: number, c: number, d: number) {
  return -c * ((t = t / d - 1) * t * t * t - 1) + b
}

function KyberScoreMeter({
  value: valueProp = 0,
  style,
  noAnimation,
  fontSize,
  hiddenValue,
  staticMode,
}: {
  value?: number
  style?: CSSProperties
  noAnimation?: boolean
  fontSize?: string
  hiddenValue?: boolean
  staticMode?: boolean
}) {
  const theme = useTheme()
  const currentValueRef = useRef(0)
  const gaugeRefs = useRef<{ [key: string]: SVGPathElement | null }>({})
  const valueRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!valueProp || noAnimation) return
    let startTime = 0
    let lastFrameTime = 0
    const fps = 60
    const interval = 1000 / fps
    let duration = 3000
    let eliminated = false
    let hidden = hiddenValue || false

    Object.keys(gaugeRefs.current).map((k: string) => {
      const el = gaugeRefs.current?.[k]
      el?.setAttribute('style', 'fill:' + theme.subText + '30')
    })

    const step = (currentTime: number, prevValue: number, nextValue: number) => {
      if (!startTime) {
        startTime = currentTime
      }
      const frameTime = currentTime - lastFrameTime
      const elapsedTime = currentTime - startTime
      if (!valueRef.current) return
      if (frameTime > interval) {
        // render the next frame
        lastFrameTime = currentTime - (elapsedTime % interval)
        currentValueRef.current =
          elapsedTime < duration ? easeOutQuart(elapsedTime, prevValue, nextValue - prevValue, duration) : nextValue
        const activeGaugeValue = (gaugeList.length * currentValueRef.current) / 100
        valueRef.current.innerText = hidden ? '??' : nextValue ? currentValueRef.current.toFixed(1) : '--'
        valueRef.current.setAttribute('style', 'color:' + calculateValueToColor(currentValueRef.current, theme))
        if (!!gaugeRefs.current) {
          Object.keys(gaugeRefs.current).map((k: string) => {
            const el = gaugeRefs.current?.[k]
            el?.setAttribute(
              'style',
              'fill:' +
                (+k <= activeGaugeValue ? calculateValueToColor(currentValueRef.current, theme) : theme.subText + '30'),
            )
          })
        }
      }

      if (elapsedTime < duration && !eliminated) {
        window.requestAnimationFrame(currentTime => step(currentTime, prevValue, nextValue))
      }
    }

    let timeout: NodeJS.Timeout
    if (staticMode) {
      duration = 2000
      const intervalFunc = () => {
        startTime = 0
        lastFrameTime = 0
        hidden = false
        window.requestAnimationFrame(currentTime => step(currentTime, 50, 99))
        setTimeout(() => {
          startTime = 0
          lastFrameTime = 0
          window.requestAnimationFrame(currentTime => step(currentTime, 99, 1))
        }, 2200)
        setTimeout(() => {
          startTime = 0
          lastFrameTime = 0
          hidden = true
          window.requestAnimationFrame(currentTime => step(currentTime, 1, 50))
        }, 5000)
      }
      setTimeout(() => {
        intervalFunc()
        timeout = setInterval(() => {
          intervalFunc()
        }, 12000)
      }, 2000)
    } else {
      window.requestAnimationFrame(currentTime => step(currentTime, 0, valueProp))
    }
    return () => {
      eliminated = true
      if (timeout) {
        clearInterval(timeout)
      }
    }
  }, [valueProp, noAnimation, theme, staticMode, hiddenValue])

  return (
    <Wrapper style={style}>
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 218 133" fill="none">
        {noAnimation
          ? gaugeList.map(g => (
              <MeterGauge
                key={g.value}
                d={g.d}
                fill={
                  g.value < (valueProp * gaugeList.length) / 100
                    ? calculateValueToColor(valueProp, theme)
                    : theme.subText + '30'
                }
              />
            ))
          : gaugeList.map(g => (
              <MeterGauge
                key={g.value}
                d={g.d}
                fill={theme.subText + '30'}
                ref={el => {
                  gaugeRefs.current[g.value.toString()] = el
                }}
              />
            ))}
      </svg>
      <GaugeValue
        color={noAnimation ? calculateValueToColor(valueProp, theme) : theme.text}
        fontSize={fontSize}
        ref={valueRef}
      >
        {noAnimation ? (hiddenValue ? '??' : valueProp) : '--'}
      </GaugeValue>
    </Wrapper>
  )
}

export default React.memo(KyberScoreMeter)
