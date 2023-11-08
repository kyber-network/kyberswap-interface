import { Trans } from '@lingui/macro'
import React, { ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useParams } from 'react-router'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import TabButton from 'components/TabButton'
import { MouseoverTooltip } from 'components/Tooltip'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { CloseIcon, MEDIA_WIDTHS } from 'theme'
import { openFullscreen } from 'utils/index'

import { MIXPANEL_KYBERAI_TAG } from '../constants'
import useKyberAIAssetOverview from '../hooks/useKyberAIAssetOverview'
import { ChartTab } from '../types'
import KyberAIShareModal from './KyberAIShareModal'

export const StyledSectionWrapper = styled.div<{ show?: boolean }>`
  display: ${({ show }) => (show ?? 'auto' ? 'auto' : 'none !important')};
  content-visibility: auto;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  background: linear-gradient(332deg, rgb(32 32 32) 0%, rgba(15, 15, 15, 1) 80%);
  margin-bottom: 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const SectionTitle = styled.div`
  font-size: 16px;
  line-height: 20px;
  font-weight: 500;
  margin: 0px -16px;
  padding: 0px 16px 16px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border + '80'};
  color: ${({ theme }) => theme.text};
`
export const SectionDescription = styled.div<{ show?: boolean }>`
  font-size: 14px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  flex: 1;
  color: ${({ theme }) => theme.subText};
  ${({ show }) =>
    show &&
    css`
      white-space: initial;
    `}

  > * {
    display: inline-block;
  }
`

const ButtonWrapper = styled.div`
  color: ${({ theme }) => theme.subText};
  height: 24px;
  width: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  :hover {
    background-color: ${({ theme }) => theme.border + '33'};
  }
`

export const FullscreenButton = React.memo(function FCButton({
  elementRef,
  onClick,
}: {
  elementRef: React.RefObject<HTMLDivElement>
  onClick?: () => void
}) {
  const toggleFullscreen = () => {
    onClick?.()
    if (isMobile) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      elementRef.current && openFullscreen(elementRef.current)
    }
  }

  return (
    <ButtonWrapper onClick={toggleFullscreen}>
      <Icon id="fullscreen" size={16} />
    </ButtonWrapper>
  )
})

export const ShareButton = ({ onClick }: { onClick?: () => void }) => {
  return (
    <ButtonWrapper onClick={onClick}>
      <Icon id="share" size={16} />
    </ButtonWrapper>
  )
}

export const SectionWrapper = ({
  show,
  title = '',
  subTitle,
  description,
  id,
  docsLinks = [],
  shareContent,
  fullscreenButton,
  tabs,
  activeTab,
  onTabClick,
  onShareClick,
  children,
  style,
}: {
  show?: boolean
  title?: string
  subTitle?: string | ReactNode
  description?: ReactNode
  id?: string
  docsLinks: string[]
  shareContent?: (mobileMode?: boolean) => ReactNode
  fullscreenButton?: boolean
  tabs?: string[]
  activeTab?: ChartTab
  onTabClick?: (tab: ChartTab) => void
  onShareClick?: () => void
  children?: React.ReactNode
  style?: React.CSSProperties
}) => {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const { chain } = useParams()
  const { data: token } = useKyberAIAssetOverview()
  const ref = useRef<HTMLDivElement>(null)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const [showText, setShowText] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isTextExceeded, setIsTexExceeded] = useState(false)
  const [fullscreenMode, setFullscreenMode] = useState(false)

  const descriptionRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (
      description &&
      descriptionRef.current &&
      descriptionRef.current.clientWidth < descriptionRef.current.scrollWidth
    ) {
      setIsTexExceeded(true)
      above768 && setShowText(true)
    }
  }, [description, descriptionRef, above768])

  const docsLink = activeTab === ChartTab.Second && !!docsLinks[1] ? docsLinks[1] : docsLinks[0]

  return (
    <StyledSectionWrapper show={show} ref={ref} id={id} style={{ height: 580, ...style }} className="section-wrapper">
      {above768 ? (
        <>
          {/* DESKTOP */}
          <SectionTitle>
            <RowBetween style={{ height: '16px' }}>
              <RowFit
                style={{
                  margin: '-16px',
                }}
                gap="4px"
              >
                {tabs ? (
                  <RowFit>
                    {tabs.map((item, index) => {
                      return (
                        <TabButton
                          key={item}
                          text={item}
                          active={activeTab === index}
                          onClick={() => onTabClick?.(index)}
                          style={{ padding: '16px', fontSize: '16px', lineHeight: '16px', height: '48px' }}
                        />
                      )
                    })}
                  </RowFit>
                ) : (
                  <>
                    <Text marginLeft="16px" style={{ whiteSpace: 'nowrap' }}>
                      {title}
                    </Text>
                    {docsLink && (
                      <ButtonWrapper onClick={() => window.open(docsLink, '_blank')}>
                        <Icon id="question" size={16} />
                      </ButtonWrapper>
                    )}
                  </>
                )}
              </RowFit>
              <RowFit color={theme.subText} gap="12px">
                {subTitle && (
                  <Text fontStyle="italic" fontSize="12px" lineHeight="16px" color={theme.subText} flexShrink={1}>
                    {subTitle}
                  </Text>
                )}
                {shareContent && !fullscreenMode && (
                  <ShareButton
                    onClick={() => {
                      onShareClick?.()
                      setShowShareModal(true)
                      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_SHARE_CHART_CLICK, {
                        token_name: token?.symbol?.toUpperCase(),
                        network: chain,
                        chart_name: id,
                      })
                    }}
                  />
                )}
                {fullscreenButton && (
                  <FullscreenButton
                    elementRef={ref}
                    onClick={() => {
                      setFullscreenMode(prev => !prev)
                      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_FULL_SCREEN_CLICK, {
                        token_name: token?.symbol?.toUpperCase(),
                        network: chain,
                        chart_name: id,
                      })
                    }}
                  />
                )}
              </RowFit>
            </RowBetween>
          </SectionTitle>
          {tabs && activeTab !== undefined && title && (
            <Row gap="4px">
              <Text fontSize="16px" lineHeight="20px" color={theme.text} fontWeight={500}>
                {tabs[activeTab] + ' ' + title}
              </Text>
              {docsLink && (
                <ButtonWrapper onClick={() => window.open(docsLink, '_blank')}>
                  <Icon id="question" size={16} />
                </ButtonWrapper>
              )}
            </Row>
          )}
          <Row gap="4px" align="center" style={{ marginBottom: '4px' }}>
            <SectionDescription show={showText} ref={descriptionRef}>
              {description}
              {showText && isTextExceeded && (
                <Text
                  as="span"
                  fontSize="14px"
                  color={theme.primary}
                  width="fit-content"
                  style={{ cursor: 'pointer', flexBasis: 'fit-content', whiteSpace: 'nowrap', marginLeft: '4px' }}
                  onClick={() => setShowText(prev => !prev)}
                >
                  <Trans>Hide</Trans>
                </Text>
              )}
            </SectionDescription>
            {!showText && isTextExceeded && (
              <Text
                as="span"
                fontSize="14px"
                lineHeight="21px"
                color={theme.primary}
                width="fit-content"
                style={{ cursor: 'pointer', flexBasis: 'fit-content', whiteSpace: 'nowrap' }}
                onClick={() => setShowText(prev => !prev)}
              >
                <Trans>Show more</Trans>
              </Text>
            )}
          </Row>
          {children || <></>}
        </>
      ) : (
        <>
          {/* MOBILE */}
          <SectionTitle>
            <Row
              style={{
                width: 'calc(100% + 32px)',
                margin: '-16px -16px 16px -16px',
              }}
            >
              {tabs &&
                tabs.map((item, index) => {
                  return (
                    <TabButton
                      key={item}
                      text={item}
                      active={activeTab === index}
                      onClick={() => onTabClick?.(index)}
                      style={{ flex: 1 }}
                    />
                  )
                })}
            </Row>
            <RowBetween marginBottom="8px">
              <MouseoverTooltip text={description}>
                <RowFit gap="4px">
                  <Text
                    style={{
                      fontSize: '14px',
                      textDecoration: `underline dotted ${theme.subText}`,
                      textUnderlineOffset: '6px',
                    }}
                  >
                    {(tabs ? tabs[activeTab || 0] + ' ' : '') + title}
                  </Text>
                  {docsLink && (
                    <ButtonWrapper onClick={() => window.open(docsLink, '_blank')}>
                      <Icon id="question" size={16} />
                    </ButtonWrapper>
                  )}
                </RowFit>
              </MouseoverTooltip>
              <RowFit color={theme.subText} gap="12px">
                {shareContent && !fullscreenMode && (
                  <ShareButton
                    onClick={() => {
                      onShareClick?.()
                      setShowShareModal(true)
                      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_SHARE_CHART_CLICK, {
                        token_name: token?.symbol?.toUpperCase(),
                        network: chain,
                        chart_name: id,
                      })
                    }}
                  />
                )}
                {fullscreenButton && (
                  <FullscreenButton
                    elementRef={ref}
                    onClick={() => {
                      setFullscreenMode(prev => !prev)
                      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_FULL_SCREEN_CLICK, {
                        token_name: token?.symbol?.toUpperCase(),
                        network: chain,
                        chart_name: id,
                      })
                    }}
                  />
                )}
              </RowFit>
            </RowBetween>
            <Row>
              <SectionDescription show={showText} ref={descriptionRef} style={{ fontSize: '12px' }}>
                {description}
                {showText && isTextExceeded && (
                  <Text
                    as="span"
                    fontSize="12px"
                    color={theme.primary}
                    width="fit-content"
                    style={{ cursor: 'pointer', flexBasis: 'fit-content', whiteSpace: 'nowrap', marginLeft: '4px' }}
                    onClick={() => setShowText(prev => !prev)}
                  >
                    <Trans>Hide</Trans>
                  </Text>
                )}
              </SectionDescription>
              {!showText && isTextExceeded && (
                <Text
                  as="span"
                  fontSize="12px"
                  lineHeight="21px"
                  color={theme.primary}
                  width="fit-content"
                  style={{ cursor: 'pointer', flexBasis: 'fit-content', whiteSpace: 'nowrap' }}
                  onClick={() => setShowText(prev => !prev)}
                >
                  <Trans>Show more</Trans>
                </Text>
              )}
            </Row>
          </SectionTitle>
          {children || <></>}
          {fullscreenMode && (
            <Modal isOpen={true} onDismiss={() => setFullscreenMode(false)} height="100vh">
              <Column padding="16px" height="100%" width="100%">
                <Row marginBottom="16px" justify="flex-end">
                  <CloseIcon onClick={() => setFullscreenMode(false)} />
                </Row>
                {children}
              </Column>
            </Modal>
          )}
        </>
      )}
      {shareContent && (
        <KyberAIShareModal
          title={tabs && activeTab !== undefined && title ? tabs[activeTab] + ' ' + title : title}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          content={shareContent}
          onShareClick={social =>
            mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SHARE_TOKEN_CLICK, {
              token_name: token?.symbol?.toUpperCase(),
              network: chain,
              source: MIXPANEL_KYBERAI_TAG.EXPLORE_SHARE_THIS_TOKEN,
              share_via: social,
            })
          }
        />
      )}
    </StyledSectionWrapper>
  )
}

// todo move to another file
export const Section = ({
  title = '',
  id,
  children,
  style,
  actions,
}: {
  title: ReactNode
  id?: string
  children: ReactNode
  style?: React.CSSProperties
  actions: ReactNode
}) => {
  const theme = useTheme()

  const ref = useRef<HTMLDivElement>(null)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <StyledSectionWrapper ref={ref} id={id} style={style} className="section-wrapper">
      {above768 ? (
        <>
          {/* DESKTOP */}
          <SectionTitle>
            <RowBetween style={{ height: '16px' }}>
              <RowFit
                style={{
                  margin: '-16px',
                }}
                gap="4px"
              >
                <Text marginLeft="16px" style={{ whiteSpace: 'nowrap' }}>
                  {title}
                </Text>
              </RowFit>
              <RowFit color={theme.subText} gap="12px">
                {actions}
              </RowFit>
            </RowBetween>
          </SectionTitle>
          {children}
        </>
      ) : (
        <>
          {/* MOBILE */}
          <SectionTitle>
            <RowBetween marginBottom="8px">
              <RowFit color={theme.subText} gap="12px">
                {actions}
              </RowFit>
            </RowBetween>
          </SectionTitle>
          {children}
        </>
      )}
    </StyledSectionWrapper>
  )
}
