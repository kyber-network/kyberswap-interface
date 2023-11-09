import { Trans } from '@lingui/macro'
import { stringify } from 'querystring'

import { useLocation, useNavigate } from 'react-router-dom'
import { Text } from 'rebass'

import { Tab, TabContainer, TabWrapper } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import LimitTab from 'pages/SwapV3/Tabs/LimitTab'

const Tabs: React.FC = () => {
  const navigateFn = useNavigate()
  const { networkInfo } = useActiveWeb3React()

  const qs = useParsedQueryString<{
    outputCurrency: string
    inputCurrency: string
  }>()

  const { pathname } = useLocation()


  const onClickTabSwap = () => {
    if (isSwapPage) {

  const isParnerSwap = pathname.startsWith(APP_PATHS.PARTNER_SWAP)

  const [searchParams] = useSearchParams()
  let features = (searchParams.get('features') || '')
    .split(',')
    .filter(item => [TAB.SWAP, TAB.LIMIT, TAB.CROSS_CHAIN].includes(item))
  if (!features.length) features = [TAB.SWAP, TAB.LIMIT, TAB.CROSS_CHAIN]

  const show = (tab: TAB) => (isParnerSwap ? features.includes(tab) : true)

  const onClickTab = (tab: TAB) => {
    if (activeTab === tab) {
      return
    }
    if (isParnerSwap) {
      setActiveTab(tab)

      return
    }

    const { inputCurrency, outputCurrency, ...newQs } = qs
    navigateFn({

      pathname:
        tab === TAB.CROSS_CHAIN
          ? APP_PATHS.CROSS_CHAIN
          : `${tab === TAB.LIMIT ? APP_PATHS.LIMIT : APP_PATHS.SWAP}/${networkInfo.route}`,

      search: stringify(newQs),
    })
  }

  return (
    <TabContainer>
      <TabWrapper>

        <Tab onClick={onClickTabSwap} isActive={isSwapPage}>
          <Text fontSize={20} fontWeight={500}>
            <Trans>Swap</Trans>
          </Text>
        </Tab>
        <LimitTab />

        {show(TAB.SWAP) && (
          <Tab onClick={() => onClickTab(TAB.SWAP)} isActive={TAB.SWAP === activeTab}>
            <Text fontSize={20} fontWeight={500}>
              <Trans>Swap</Trans>
            </Text>
          </Tab>
        )}
        {show(TAB.LIMIT) && isSupportLimitOrder(chainId) && (
          <LimitTab onClick={() => onClickTab(TAB.LIMIT)} active={activeTab === TAB.LIMIT} />
        )}
        {show(TAB.CROSS_CHAIN) && CHAINS_SUPPORT_CROSS_CHAIN.includes(chainId) && (
          <Tab
            onClick={() => onClickTab(TAB.CROSS_CHAIN)}
            isActive={activeTab === TAB.CROSS_CHAIN}
            data-testid="cross-chain-tab"
          >
            <Text fontSize={20} fontWeight={500}>
              <Trans>Cross-Chain</Trans>
            </Text>
          </Tab>
        )}

      </TabWrapper>
    </TabContainer>
  )
}

export default Tabs

