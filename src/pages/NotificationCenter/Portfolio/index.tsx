import { Trans, t } from '@lingui/macro'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Plus, Save, X } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useCreatePortfolioMutation, useGetPortfoliosQuery } from 'services/portfolio'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import Toggle from 'components/Toggle'
import { MouseoverTooltip } from 'components/Tooltip'
import { Tabs } from 'components/WalletPopup/Transactions/Tab'
import { EMPTY_ARRAY, RTK_QUERY_TAGS } from 'constants/index'
import { useInvalidateTagPortfolio } from 'hooks/useInvalidateTags'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import CreatePortfolioModal from 'pages/NotificationCenter/Portfolio/Modals/CreatePortfolioModal'
import PortfolioItem from 'pages/NotificationCenter/Portfolio/PortfolioItem'
import { ButtonCancel, ButtonSave } from 'pages/NotificationCenter/Portfolio/buttons'
import { Portfolio, PortfolioSetting } from 'pages/NotificationCenter/Portfolio/type'
import WarningSignMessage from 'pages/NotificationCenter/Profile/WarningSignMessage'
import { useNotify } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'

const ActionsWrapper = styled.div`
  display: flex;
  gap: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: space-between;
    gap: 12px;
  `}
`
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 24px;
  padding-bottom: 16px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-bottom: 16px;
  `}
`

const Header = styled.div`
  justify-content: space-between;
  display: flex;
  align-items: center;
  cursor: pointer;
  transform: translateX(-4px);
`

const PortfolioStat = styled(Row)`
  gap: 16px;
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    justify-content: space-between;
  `}
`

const Divider = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  border-top: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-left: 16px;
    padding-right: 16px;
  `}
`
const THRESHOLD_OPTIONS = [1, 10, 100].map(el => ({ value: el, title: `< ${el}` }))

const maximumPortfolio = 2

const SettingWrapper = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 24px;
  `};
`
const BalanceThreshold = styled(Row)`
  gap: 16px;
  justify-content: flex-end;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 8px;
    width: 100%;
    align-items: flex-start;
  `};
`

const settings: PortfolioSetting = { isHideDust: true, dustThreshold: 1 }
export default function PortfolioSettings() {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [showCreate, setShowCreate] = useState(false)
  const { data, isLoading } = useGetPortfoliosQuery()
  const loading = useShowLoadingAtLeastTime(isLoading, 1000)
  const portfolios: Portfolio[] = data || EMPTY_ARRAY

  const { userInfo } = useSessionInfo()
  const invalidateTags = useInvalidateTagPortfolio()
  useEffect(() => {
    try {
      invalidateTags([RTK_QUERY_TAGS.GET_LIST_PORTFOLIO, RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO])
    } catch (error) {}
  }, [userInfo?.identityId, invalidateTags])

  const showModalCreatePortfolio = () => {
    setShowCreate(true)
  }
  const hideModalCreatePortfolio = () => {
    setShowCreate(false)
  }

  const theme = useTheme()

  const [threshold, setThreshold] = useState<string | number>(THRESHOLD_OPTIONS[0].value)
  const [hideSmallBalance, setHideSmallBalance] = useState(true)

  const resetSetting = useCallback(() => {
    setHideSmallBalance(settings.isHideDust)
    setThreshold(settings.dustThreshold)
  }, [])

  useEffect(() => {
    resetSetting()
  }, [resetSetting])

  const savePortfolioSetting = () => {
    alert('in dev, wait for Dungz')
  }

  const hasChangeSettings = settings?.dustThreshold !== threshold || settings?.isHideDust !== hideSmallBalance
  const disableBtnSave = loading || !hasChangeSettings
  const canCreatePortfolio = portfolios.length < maximumPortfolio && !loading

  const [createPortfolio] = useCreatePortfolioMutation()
  const notify = useNotify()
  const addPortfolio = async (data: { name: string }) => {
    try {
      await createPortfolio(data).unwrap()
      notify({
        type: NotificationType.SUCCESS,
        title: t`Portfolio created`,
        summary: t`Your portfolio have been successfully created`,
      })
    } catch (error) {
      notify({
        type: NotificationType.ERROR,
        title: t`Portfolio create failed`,
        summary: t`Create portfolio failed, please try again.`,
      })
    }
  }

  return (
    <Wrapper>
      <Header>
        {!upToMedium && (
          <Text fontWeight={'500'} fontSize="24px">
            <Trans>Portfolios</Trans>
          </Text>
        )}
        <PortfolioStat>
          <Text fontWeight={'500'} fontSize="14px" color={theme.subText}>
            <Trans>
              Portfolios count:{' '}
              <Text as={'span'} color={portfolios.length < maximumPortfolio ? theme.text : theme.warning}>
                {portfolios.length}/{maximumPortfolio}
              </Text>
            </Trans>
          </Text>
          <MouseoverTooltip
            text={canCreatePortfolio ? '' : t`You had added the maximum number of portfolio`}
            placement="top"
          >
            <ButtonPrimary
              height={'36px'}
              width={'fit-content'}
              disabled={!canCreatePortfolio}
              onClick={canCreatePortfolio ? showModalCreatePortfolio : undefined}
            >
              <Plus />
              &nbsp;
              <Trans>Create Portfolio</Trans>
            </ButtonPrimary>
          </MouseoverTooltip>
        </PortfolioStat>
      </Header>
      <WarningSignMessage
        outline
        msg={t`To enable more seamless DeFi experience, you can link your wallet to your profile by signing-in.`}
      />
      <Divider />

      <Column style={{ minHeight: '46px', gap: '24px', justifyContent: 'center' }}>
        {loading ? (
          <Skeleton height="46px" baseColor={theme.background} highlightColor={theme.buttonGray} borderRadius="1rem" />
        ) : !portfolios.length ? (
          <Text color={theme.subText} width={'100%'} textAlign={'center'}>
            <Trans>You don&apos;t have any portfolio.</Trans>
          </Text>
        ) : (
          portfolios.map((item, i) => (
            <Fragment key={item.id}>
              <PortfolioItem portfolio={item} />
              {i !== portfolios.length - 1 && <Divider />}
            </Fragment>
          ))
        )}
      </Column>
      <Divider />
      <SettingWrapper>
        <Row gap="16px" justify={upToMedium ? 'space-between' : undefined}>
          <Text fontSize={'14px'} color={theme.subText}>
            <Trans>Hide small token balances</Trans>
          </Text>
          <Toggle
            backgroundColor={theme.buttonBlack}
            isActive={hideSmallBalance}
            toggle={() => setHideSmallBalance(v => !v)}
          />
        </Row>
        <BalanceThreshold>
          <Text fontSize={'14px'} color={theme.subText} sx={{ whiteSpace: 'nowrap' }}>
            <Trans>Small balances threshold</Trans>
          </Text>
          <Tabs<number | string>
            tabs={THRESHOLD_OPTIONS}
            style={{ width: upToSmall ? '100%' : 200 }}
            activeTab={threshold}
            setActiveTab={setThreshold}
          />
        </BalanceThreshold>
      </SettingWrapper>
      <ActionsWrapper>
        <ButtonSave onClick={savePortfolioSetting} disabled={disableBtnSave}>
          <Save size={16} style={{ marginRight: '4px' }} />
          {loading ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
        </ButtonSave>
        <ButtonCancel onClick={resetSetting}>
          <X size={16} style={{ marginRight: '4px' }} />
          Cancel
        </ButtonCancel>
      </ActionsWrapper>
      <CreatePortfolioModal
        isOpen={showCreate}
        onDismiss={hideModalCreatePortfolio}
        onConfirm={addPortfolio}
        defaultName={!portfolios.length ? t`My 1st Portfolio` : ''}
      />
    </Wrapper>
  )
}
