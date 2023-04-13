import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import JSBI from 'jsbi'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Info } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePrevious } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled, { DefaultTheme, keyframes } from 'styled-components'

import christmasImg from 'assets/images/christmas-decor2.svg'
import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import AddressInputPanel from 'components/AddressInputPanel'
import ApproveMessage from 'components/ApproveMessage'
import ArrowRotate from 'components/ArrowRotate'
import Banner from 'components/Banner'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { GreyCard } from 'components/Card'
import Column, { ColumnCenter } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import { SEOSwap } from 'components/SEO'
import SlippageWarningNote from 'components/SlippageWarningNote'
import { Label } from 'components/SwapForm/OutputCurrencyPanel'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import SlippageSettingGroup from 'components/SwapForm/SlippageSettingGroup'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokenWarningModal from 'components/TokenWarningModal'
import { MouseoverTooltip } from 'components/Tooltip'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import TutorialSwap from 'components/Tutorial/TutorialSwap'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import AdvancedSwapDetailsDropdown from 'components/swapv2/AdvancedSwapDetailsDropdown'
import ConfirmSwapModal from 'components/swapv2/ConfirmSwapModal'
import GasPriceTrackerPanel from 'components/swapv2/GasPriceTrackerPanel'
import LimitOrder from 'components/swapv2/LimitOrder'
import ListLimitOrder from 'components/swapv2/LimitOrder/ListOrder'
import { ListOrderHandle } from 'components/swapv2/LimitOrder/type'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import PairSuggestion, { PairSuggestionHandle } from 'components/swapv2/PairSuggestion'
import RefreshButton from 'components/swapv2/RefreshButton'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfoTab from 'components/swapv2/TokenInfoTab'
import TokenInfoV2 from 'components/swapv2/TokenInfoV2'
import TradePrice from 'components/swapv2/TradePrice'
import TradeTypeSelection from 'components/swapv2/TradeTypeSelection'
import {
  BottomGrouping,
  Container,
  Dots,
  InfoComponentsWrapper,
  LiveChartWrapper,
  PageWrapper,
  PriceImpactHigh,
  RoutesWrapper,
  SwapCallbackError,
  SwapFormWrapper,
  Tab,
  TabContainer,
  TabWrapper,
  Wrapper,
} from 'components/swapv2/styleds'
import { AGGREGATOR_WAITING_TIME, APP_PATHS, TIME_TO_REFRESH_SWAP_RATE } from 'constants/index'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens, useIsLoadedTokenDefault } from 'hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTradeV2 } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSwapV2Callback } from 'hooks/useSwapV2Callback'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { BodyWrapper } from 'pages/AppBody'
import HeaderRightMenu from 'pages/SwapV3/HeaderRightMenu'
import useUpdateSlippageInStableCoinSwap from 'pages/SwapV3/useUpdateSlippageInStableCoinSwap'
import { useWalletModalToggle } from 'state/application/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useEncodeSolana, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import {
  useDegenModeManager,
  useHolidayMode,
  useShowLiveChart,
  useShowTokenInfo,
  useShowTradeRoutes,
  useUserAddedTokens,
  useUserSlippageTolerance,
} from 'state/user/hooks'
import { CloseIcon } from 'theme'
import { formattedNum, getLimitOrderContract } from 'utils'
import { getTradeComposition } from 'utils/aggregationRouting'
import { Aggregator } from 'utils/aggregator'
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'
import { captureSwapError } from 'utils/sentry'
import { getSymbolSlug } from 'utils/string'
import { checkPairInWhiteList } from 'utils/tokenInfo'

const LiveChart = lazy(() => import('components/LiveChart'))
const Routing = lazy(() => import('components/TradeRouting'))

enum TAB {
  SWAP = 'swap',
  INFO = 'info',
  SETTINGS = 'settings',
  GAS_PRICE_TRACKER = 'gas_price_tracker',
  LIQUIDITY_SOURCES = 'liquidity_sources',
  LIMIT = 'limit',
}

const ChristmasDecor = styled.div`
  position: absolute;
  top: -20px;
  right: -8px;
  left: -8px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    top: -16px;
    right: -6px;
    left: -4px;
  `}
`
const highlight = (theme: DefaultTheme) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${theme.primary};
  }

  70% {
    box-shadow: 0 0 0 2px ${theme.primary};
  }

  100% {
    box-shadow: 0 0 0 0 ${theme.primary};
  }
`

const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 16px 16px 24px;
  margin-top: 0;

  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 2s 2 alternate ease-in-out;
  }
`

const SwitchLocaleLinkWrapper = styled.div`
  margin-bottom: 30px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  margin-bottom: 0px;
`}
`

const RoutingIconWrapper = styled(RoutingIcon)`
  height: 27px;
  width: 27px;
  margin-right: 10px;

  path {
    fill: ${({ theme }) => theme.subText} !important;
  }
`

const DegenBanner = styled(RowBetween)`
  padding: 10px 16px;
  background-color: ${({ theme }) => rgba(theme.warning, 0.3)};
  border-radius: 24px;
`

export default function Swap() {
  const navigateFn = useNavigate()
  const { account, chainId, networkInfo, isSolana, isEVM } = useActiveWeb3React()
  const [rotate, setRotate] = useState(false)
  const isShowLiveChart = useShowLiveChart()
  const [holidayMode] = useHolidayMode()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfoSetting = useShowTokenInfo()
  const qs = useParsedQueryString<{
    highlightBox: string
    outputCurrency: string
    inputCurrency: string
  }>()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()
  const { pathname } = useLocation()
  const [encodeSolana] = useEncodeSolana()

  const refSuggestPair = useRef<PairSuggestionHandle>(null)
  const refListLimitOrder = useRef<ListOrderHandle>(null)

  const [showingPairSuggestionImport, setShowingPairSuggestionImport] = useState<boolean>(false) // show modal import when click pair suggestion

  const shouldHighlightSwapBox = qs.highlightBox === 'true'

  const [isSelectCurrencyManually, setIsSelectCurrencyManually] = useState(false) // true when: select token input, output manualy or click rotate token.
  // else select via url

  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const [activeTab, setActiveTab] = useState<TAB>(isSwapPage ? TAB.SWAP : TAB.LIMIT)
  const { onSelectPair: onSelectPairLimit } = useLimitActionHandlers()
  const limitState = useLimitState()
  const currenciesLimit = useMemo(() => {
    return { [Field.INPUT]: limitState.currencyIn, [Field.OUTPUT]: limitState.currencyOut }
  }, [limitState.currencyIn, limitState.currencyOut])

  useEffect(() => {
    setActiveTab(isSwapPage ? TAB.SWAP : TAB.LIMIT)
  }, [isSwapPage])

  const refreshListOrder = useCallback(() => {
    if (isLimitPage) {
      refListLimitOrder.current?.refreshListOrder()
    }
  }, [isLimitPage])

  useDefaultsFromURLSearch()
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  const [isDegenMode] = useDegenModeManager()

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const {
    independentField,
    typedValue,
    recipient,
    feeConfig,
    [Field.INPUT]: INPUT,
    [Field.OUTPUT]: OUTPUT,
  } = useSwapState()

  const {
    onSwitchTokensV2,
    onCurrencySelection,
    onResetSelectCurrency,
    onUserInput,
    onChangeRecipient,
    onChangeTrade,
  } = useSwapActionHandlers()

  const {
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    onRefresh,
    loading: loadingAPI,
  } = useDerivedSwapInfoV2()

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Aggregator | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const currencyIn: Currency | undefined = currencies[Field.INPUT]
  const currencyOut: Currency | undefined = currencies[Field.OUTPUT]

  const urlLoadedTokens: Token[] = useMemo(
    () =>
      (isSwapPage ? [currencyIn, currencyOut] : [limitState.currencyIn, limitState.currencyOut])?.filter(
        (c): c is Token => c instanceof Token,
      ) ?? [],
    [isSwapPage, currencyIn, currencyOut, limitState.currencyIn, limitState.currencyOut],
  )
  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens)
    })

  const balanceIn: CurrencyAmount<Currency> | undefined = currencyBalances[Field.INPUT]
  const balanceOut: CurrencyAmount<Currency> | undefined = currencyBalances[Field.OUTPUT]

  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(currencyIn, currencyOut, typedValue)

  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP
  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) onUserInput(Field.INPUT, balanceIn?.toExact() ?? '')
  }, [balanceIn, isSolanaUnwrap, onUserInput, parsedAmount])

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const priceImpact = trade?.priceImpact
  const isPriceImpactInvalid = !!priceImpact && priceImpact === -1
  const isPriceImpactHigh = !!priceImpact && priceImpact > 2
  const isPriceImpactVeryHigh = !!priceImpact && priceImpact > 10

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }

  const { mixpanelHandler } = useMixpanel(currencies)

  // reset recipient
  useEffect(() => {
    onChangeRecipient(null)
  }, [onChangeRecipient, isDegenMode])

  useEffect(() => {
    // Save current trade to store
    onChangeTrade(trade)
  }, [trade, onChangeTrade])

  const handleRecipientChange = (value: string | null) => {
    if (recipient === null && value !== null) {
      mixpanelHandler(MIXPANEL_TYPE.ADD_RECIPIENT_CLICKED)
    }
    onChangeRecipient(value)
  }

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput],
  )
  const handleTypeOutput = useCallback((): void => {
    // ...
  }, [])

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    if (showingPairSuggestionImport) {
      setShowingPairSuggestionImport(false)
    } else {
      setDismissTokenWarning(true)
    }
  }, [showingPairSuggestionImport])

  const handleConfirmTokenWarning = useCallback(
    (tokens: Currency[]) => {
      handleDismissTokenWarning()
      if (showingPairSuggestionImport) {
        refSuggestPair.current?.onConfirmImportToken() // callback from children
      }
      if (isLimitPage) {
        onSelectPairLimit(tokens[0], tokens[1])
      }
    },
    [isLimitPage, onSelectPairLimit, showingPairSuggestionImport, handleDismissTokenWarning],
  )

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const userHasSpecifiedInputOutput = Boolean(
    currencyIn && currencyOut && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0)),
  )
  const noRoute = !trade?.swaps?.length

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTradeV2(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const handleRotateClick = useCallback(() => {
    setApprovalSubmitted(false) // reset 2 step UI for approvals
    setRotate(prev => !prev)
    onSwitchTokensV2()
    setIsSelectCurrencyManually(true)
  }, [onSwitchTokensV2])

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: string | undefined = useMemo(() => maxAmountSpend(balanceIn)?.toExact(), [balanceIn])
  const halfAmountInput: string | undefined = useMemo(() => halfAmountSpend(balanceIn)?.toExact(), [balanceIn])

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapV2Callback(trade)

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    mixpanelHandler(MIXPANEL_TYPE.SWAP_CONFIRMED, {
      gasUsd: trade?.gasUsd,
      inputAmount: trade?.inputAmount,
      priceImpact: trade?.priceImpact,
    })
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then(hash => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
      })
      .catch(error => {
        if (error?.code !== 4001 && error?.code !== 'ACTION_REJECTED') captureSwapError(error)
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [
    swapCallback,
    tradeToConfirm,
    showConfirm,
    mixpanelHandler,
    trade?.gasUsd,
    trade?.inputAmount,
    trade?.priceImpact,
  ])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non degen mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const tradeLoadedRef = useRef(0)
  useEffect(() => {
    tradeLoadedRef.current = Date.now()
  }, [trade])

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })

    // when open modal, trade is locked from to be updated
    // if user open modal too long, trade is outdated
    // need to refresh data on close modal
    if (Date.now() - tradeLoadedRef.current > TIME_TO_REFRESH_SWAP_RATE * 1000) {
      onRefresh(false, AGGREGATOR_WAITING_TIME)
    }

    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash, onRefresh])

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      setIsSelectCurrencyManually(true)
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection],
  )

  const handleMaxInput = useCallback(() => {
    onUserInput(Field.INPUT, maxAmountInput || '')
  }, [maxAmountInput, onUserInput])

  const handleHalfInput = useCallback(() => {
    !isSolanaUnwrap && onUserInput(Field.INPUT, halfAmountInput || '')
  }, [isSolanaUnwrap, halfAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => {
      setIsSelectCurrencyManually(true)
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection],
  )

  const isLoading = loadingAPI || ((!balanceIn || !balanceOut) && userHasSpecifiedInputOutput && !v2Trade)

  const mixpanelSwapInit = () => {
    mixpanelHandler(MIXPANEL_TYPE.SWAP_INITIATED, {
      gasUsd: trade?.gasUsd,
      inputAmount: trade?.inputAmount,
      priceImpact: trade?.priceImpact,
    })
  }

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => {
      if (isLimitPage) {
        onSelectPairLimit(fromToken, toToken, amount)
        return
      }
      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) handleTypeInput(amount)
    },
    [handleTypeInput, onCurrencySelection, onSelectPairLimit, isLimitPage],
  )

  const tokenImports: Token[] = useUserAddedTokens()
  const prevTokenImports = usePrevious(tokenImports)

  useEffect(() => {
    // when remove token imported
    if (!prevTokenImports) return
    const isRemoved = prevTokenImports?.length > tokenImports.length
    if (!isRemoved || prevTokenImports[0].chainId !== chainId) return

    const addressIn = currencyIn?.wrapped?.address
    const addressOut = currencyOut?.wrapped?.address
    // removed token => deselect input
    const tokenRemoved = prevTokenImports.filter(
      token => !tokenImports.find(token2 => token2.address === token.address),
    )

    tokenRemoved.forEach(({ address }: Token) => {
      if (address === addressIn || !currencyIn) {
        onResetSelectCurrency(Field.INPUT)
      }
      if (address === addressOut || !currencyOut) {
        onResetSelectCurrency(Field.OUTPUT)
      }
    })
  }, [tokenImports, chainId, prevTokenImports, currencyIn, currencyOut, onResetSelectCurrency])

  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectSuggestedPair, isSelectCurrencyManually, isLimitPage)
  const isLoadedTokenDefault = useIsLoadedTokenDefault()

  const [rawSlippage] = useUserSlippageTolerance()

  const isStableCoinSwap = Boolean(
    INPUT?.currencyId &&
      OUTPUT?.currencyId &&
      chainId &&
      STABLE_COINS_ADDRESS[chainId].includes(INPUT?.currencyId) &&
      STABLE_COINS_ADDRESS[chainId].includes(OUTPUT?.currencyId),
  )

  useUpdateSlippageInStableCoinSwap()

  const { isInWhiteList: isPairInWhiteList, canonicalUrl } = checkPairInWhiteList(
    chainId,
    getSymbolSlug(currencyIn),
    getSymbolSlug(currencyOut),
  )

  const onBackToSwapTab = () => setActiveTab(isLimitPage ? TAB.LIMIT : TAB.SWAP)

  const shouldRenderTokenInfo = isShowTokenInfoSetting && currencyIn && currencyOut && isPairInWhiteList && isSwapPage

  const isShowModalImportToken =
    isLoadedTokenDefault && importTokensNotInDefault.length > 0 && (!dismissTokenWarning || showingPairSuggestionImport)

  const isLargeSwap = useMemo((): boolean => {
    return false // todo: not used for current release yet
    // if these line is 6 months old, feel free to delete it
    /*
    if (!isSolana) return false
    if (!trade) return false
    try {
      return trade.swaps.some(swapPath =>
        swapPath.some(swap => {
          // return swapAmountInUsd / swap.reserveUsd > 1%
          //  =  (swap.swapAmount / 10**decimal * tokenIn.price) / swap.reserveUsd > 1%
          //  = swap.swapAmount * tokenIn.price / (10**decimal * swap.reserveUsd) > 1%
          //  = 10**decimal * swap.reserveUsd / (swap.swapAmount * tokenIn.price) < 100
          const tokenIn = trade.tokens[swap.tokenIn]
          if (!tokenIn || !tokenIn.decimals) return false

          return JSBI.lessThan(
            JSBI.divide(
              JSBI.multiply(
                JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(tokenIn.decimals + 20)),
                JSBI.BigInt(swap.reserveUsd * 10 ** 20),
              ),
              JSBI.multiply(JSBI.BigInt(tokenIn.price * 10 ** 20), JSBI.BigInt(Number(swap.swapAmount) * 10 ** 20)),
            ),
            JSBI.BigInt(100),
          )
        }),
      )
    } catch (e) {
      return false
    }
  }, [isSolana, trade])
  */
  }, [])

  const tradeRouteComposition = useMemo(() => {
    return getTradeComposition(chainId, trade?.inputAmount, trade?.tokens, trade?.swaps, defaultTokens)
  }, [chainId, defaultTokens, trade])

  const onClickTab = (tab: TAB) => {
    setActiveTab(tab)
    const isLimit = tab === TAB.LIMIT
    const { inputCurrency, outputCurrency, ...newQs } = qs
    navigateFn({
      pathname: `${isLimit ? APP_PATHS.LIMIT : APP_PATHS.SWAP}/${networkInfo.route}`,
      search: stringify(newQs),
    })
  }

  const [isShowDegenBanner, setShowDegenBanner] = useState(true)

  return (
    <>
      {/**
       * /swap/bnb/knc-to-usdt vs /swap/bnb/usdt-to-knc has same content
       * => add canonical link that specify which is main page, => /swap/bnb/knc-to-usdt
       */}
      <SEOSwap canonicalUrl={canonicalUrl} />
      <TutorialSwap />
      <TokenWarningModal
        isOpen={isShowModalImportToken}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      />
      <PageWrapper>
        <Banner />
        <Container>
          <SwapFormWrapper isShowTutorial={isShowTutorial}>
            <ColumnCenter gap="sm">
              <RowBetween>
                <TabContainer>
                  <TabWrapper>
                    <Tab onClick={() => onClickTab(TAB.SWAP)} isActive={isSwapPage}>
                      <Text fontSize={20} fontWeight={500}>
                        <Trans>Swap</Trans>
                      </Text>
                    </Tab>
                    {getLimitOrderContract(chainId) && (
                      <Tab id="limit-button" onClick={() => onClickTab(TAB.LIMIT)} isActive={isLimitPage}>
                        <Text fontSize={20} fontWeight={500}>
                          <Trans>Limit</Trans>
                        </Text>
                      </Tab>
                    )}
                  </TabWrapper>
                </TabContainer>

                <HeaderRightMenu activeTab={activeTab} setActiveTab={setActiveTab} />
              </RowBetween>
              <RowBetween>
                <Text fontSize={12} color={theme.subText}>
                  {isLimitPage ? (
                    <Trans>Buy or sell any token at a specific price</Trans>
                  ) : (
                    <Trans>Buy or sell any token instantly at the best price</Trans>
                  )}
                </Text>
              </RowBetween>
            </ColumnCenter>

            {isDegenMode && isShowDegenBanner && (
              <DegenBanner>
                <Text fontSize={12} fontWeight={400} color={theme.text}>
                  <Trans>You have turned on Degen Mode. Be cautious</Trans>
                </Text>
                <CloseIcon size={14} onClick={() => setShowDegenBanner(false)} />
              </DegenBanner>
            )}

            {!isSolana && (
              <RowBetween>
                <PairSuggestion
                  ref={refSuggestPair}
                  onSelectSuggestedPair={onSelectSuggestedPair}
                  setShowModalImportToken={setShowingPairSuggestionImport}
                />
              </RowBetween>
            )}

            <AppBodyWrapped data-highlight={shouldHighlightSwapBox} id={TutorialIds.SWAP_FORM}>
              {activeTab === TAB.SWAP && (
                <>
                  <Wrapper
                    id={TutorialIds.SWAP_FORM_CONTENT}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                  >
                    <ConfirmSwapModal
                      isOpen={showConfirm}
                      trade={trade}
                      originalTrade={tradeToConfirm}
                      attemptingTxn={attemptingTxn}
                      txHash={txHash}
                      allowedSlippage={allowedSlippage}
                      onConfirm={handleSwap}
                      swapErrorMessage={swapErrorMessage}
                      onDismiss={handleConfirmDismiss}
                      tokenAddToMetaMask={currencyOut}
                    />

                    <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
                      <CurrencyInputPanel
                        value={formattedAmounts[Field.INPUT]}
                        positionMax="top"
                        currency={currencyIn}
                        onUserInput={handleTypeInput}
                        onMax={handleMaxInput}
                        onHalf={isSolanaUnwrap ? null : handleHalfInput}
                        onCurrencySelect={handleInputSelect}
                        otherCurrency={currencyOut}
                        id="swap-currency-input"
                        showCommonBases={true}
                        estimatedUsd={
                          trade?.amountInUsd ? `${formattedNum(trade.amountInUsd.toString(), true)}` : undefined
                        }
                      />
                      <AutoRow justify="space-between">
                        <Flex alignItems="center">
                          {!showWrap && (
                            <>
                              <RefreshButton isConfirming={showConfirm} trade={trade} onRefresh={onRefresh} />
                              <TradePrice price={trade?.executionPrice} />
                            </>
                          )}
                        </Flex>

                        <ArrowRotate rotate={rotate} onClick={handleRotateClick} />
                      </AutoRow>
                      <Box sx={{ position: 'relative' }}>
                        <CurrencyInputPanel
                          disabledInput
                          value={formattedAmounts[Field.OUTPUT]}
                          onUserInput={handleTypeOutput}
                          onMax={null}
                          onHalf={null}
                          currency={currencyOut}
                          onCurrencySelect={handleOutputSelect}
                          otherCurrency={currencyIn}
                          id="swap-currency-output"
                          showCommonBases={true}
                          estimatedUsd={
                            trade?.amountOutUsd ? `${formattedNum(trade.amountOutUsd.toString(), true)}` : undefined
                          }
                          label={
                            isEVM ? (
                              <Label>
                                <MouseoverTooltip
                                  placement="right"
                                  width="200px"
                                  text={
                                    <Text fontSize={12}>
                                      <Trans>
                                        This is the estimated output amount. Do review the actual output amount in the
                                        confirmation screen.
                                      </Trans>
                                    </Text>
                                  }
                                >
                                  <Trans>Est. Output</Trans>
                                </MouseoverTooltip>
                              </Label>
                            ) : (
                              ''
                            )
                          }
                          positionLabel="in"
                        />
                      </Box>

                      {isDegenMode && isEVM && !showWrap && (
                        <AddressInputPanel id="recipient" value={recipient} onChange={handleRecipientChange} />
                      )}

                      <SlippageSettingGroup isWrapOrUnwrap={showWrap} isStablePairSwap={isStableCoinSwap} />

                      <TrendingSoonTokenBanner
                        currencyIn={currencyIn}
                        currencyOut={currencyOut}
                        style={{ marginTop: '24px' }}
                      />
                    </Flex>

                    <TradeTypeSelection />

                    {!showWrap && <SlippageWarningNote rawSlippage={rawSlippage} isStablePairSwap={isStableCoinSwap} />}

                    <PriceImpactNote priceImpact={trade?.priceImpact} isDegenMode={isDegenMode} />

                    {isLargeSwap && (
                      <PriceImpactHigh>
                        <AlertTriangle color={theme.warning} size={24} style={{ marginRight: '8px' }} />
                        <Trans>
                          Your transaction may not be successful. We recommend increasing the slippage for this trade
                        </Trans>
                      </PriceImpactHigh>
                    )}

                    <ApproveMessage
                      routerAddress={trade?.routerAddress}
                      isCurrencyInNative={Boolean(currencyIn?.isNative)}
                    />

                    <BottomGrouping>
                      {!account ? (
                        <ButtonLight onClick={toggleWalletModal}>
                          <Trans>Connect Wallet</Trans>
                        </ButtonLight>
                      ) : showWrap ? (
                        <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                          {wrapInputError ??
                            (wrapType === WrapType.WRAP ? (
                              <Trans>Wrap</Trans>
                            ) : wrapType === WrapType.UNWRAP ? (
                              <Trans>Unwrap</Trans>
                            ) : null)}
                        </ButtonPrimary>
                      ) : noRoute && userHasSpecifiedInputOutput ? (
                        <ButtonPrimary disabled={true} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                There was an issue while trying to find a price for these tokens. Please try again.
                                Otherwise, you may select some other tokens to swap
                              </Trans>
                            }
                          >
                            <Info size={14} />
                          </MouseoverTooltip>
                          <Text>
                            <Trans>Swap Disabled</Trans>
                          </Text>
                        </ButtonPrimary>
                      ) : showApproveFlow ? (
                        <>
                          <RowBetween>
                            <ButtonConfirmed
                              onClick={approveCallback}
                              disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                              width="48%"
                              altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                              confirmed={approval === ApprovalState.APPROVED}
                            >
                              {approval === ApprovalState.PENDING ? (
                                <AutoRow gap="6px" justify="center">
                                  <Trans>Approving</Trans> <Loader stroke="white" />
                                </AutoRow>
                              ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                                <Trans>Approved</Trans>
                              ) : (
                                <Trans>Approve ${currencyIn?.symbol}</Trans>
                              )}
                            </ButtonConfirmed>
                            <ButtonError
                              onClick={() => {
                                // TODO check this button, it will never run, is it?
                                // console.error('This will never be run')
                                mixpanelSwapInit()
                                if (isDegenMode) {
                                  handleSwap()
                                } else {
                                  setSwapState({
                                    tradeToConfirm: trade,
                                    attemptingTxn: false,
                                    swapErrorMessage: undefined,
                                    showConfirm: true,
                                    txHash: undefined,
                                  })
                                }
                              }}
                              width="48%"
                              id="swap-button"
                              disabled={!!swapInputError || approval !== ApprovalState.APPROVED}
                              backgroundColor={
                                isPriceImpactVeryHigh || isPriceImpactInvalid
                                  ? theme.red
                                  : isPriceImpactHigh
                                  ? theme.warning
                                  : undefined
                              }
                              color={isPriceImpactHigh || isPriceImpactInvalid ? theme.white : undefined}
                            >
                              <Text fontSize={16} fontWeight={500}>
                                {isPriceImpactVeryHigh ? <Trans>Swap Anyway</Trans> : <Trans>Swap</Trans>}
                              </Text>
                            </ButtonError>
                          </RowBetween>
                          <Column style={{ marginTop: '1rem' }}>
                            <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
                          </Column>
                        </>
                      ) : isLoading ? (
                        <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }}>
                          <Text color={theme.subText} fontSize="14px">
                            <Dots>
                              <Trans>Calculating best route</Trans>
                            </Dots>
                          </Text>
                        </GreyCard>
                      ) : (
                        <ButtonError
                          onClick={() => {
                            mixpanelSwapInit()
                            setSwapState({
                              tradeToConfirm: trade,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: true,
                              txHash: undefined,
                            })
                          }}
                          id="swap-button"
                          disabled={
                            !!swapInputError ||
                            !!swapCallbackError ||
                            approval !== ApprovalState.APPROVED ||
                            (!isDegenMode && (isPriceImpactVeryHigh || isPriceImpactInvalid)) ||
                            (isDegenMode && isSolana && !encodeSolana)
                          }
                          style={{
                            position: 'relative',
                            border: 'none',
                            ...(!(
                              !!swapInputError ||
                              !!swapCallbackError ||
                              approval !== ApprovalState.APPROVED ||
                              (!isDegenMode && (isPriceImpactVeryHigh || isPriceImpactInvalid)) ||
                              (isDegenMode && isSolana && !encodeSolana)
                            ) &&
                            (isPriceImpactVeryHigh || isPriceImpactInvalid)
                              ? {
                                  background: isPriceImpactVeryHigh || isPriceImpactInvalid ? theme.red : theme.warning,
                                  color: theme.textReverse,
                                }
                              : {}),
                          }}
                        >
                          <Text fontWeight={500}>
                            {swapInputError ? (
                              swapInputError
                            ) : approval !== ApprovalState.APPROVED ? (
                              <Dots>
                                <Trans>Checking allowance</Trans>
                              </Dots>
                            ) : isDegenMode && isSolana && !encodeSolana ? (
                              <Dots>
                                <Trans>Checking accounts</Trans>
                              </Dots>
                            ) : !isDegenMode && (isPriceImpactVeryHigh || isPriceImpactInvalid) ? (
                              <Flex alignItems="center" style={{ gap: '4px' }}>
                                <MouseoverTooltip
                                  text={
                                    isPriceImpactVeryHigh ? (
                                      <Trans>
                                        To ensure you dont lose funds due to very high price impact (≥10%), swap has
                                        been disabled for this trade. If you still wish to continue, you can turn on
                                        Degen Mode from Settings
                                      </Trans>
                                    ) : (
                                      <Trans>
                                        There was an issue while trying to find a price for these tokens. Please try
                                        again. Otherwise, you may select some other tokens to swap
                                      </Trans>
                                    )
                                  }
                                >
                                  <Info size={14} />
                                </MouseoverTooltip>
                                <Text>
                                  <Trans>Swap Disabled</Trans>
                                </Text>
                              </Flex>
                            ) : isDegenMode && (isPriceImpactVeryHigh || isPriceImpactInvalid) ? (
                              <Trans>Swap Anyway</Trans>
                            ) : (
                              <Trans>Swap</Trans>
                            )}
                          </Text>

                          {holidayMode && !swapInputError && (
                            <ChristmasDecor>
                              <img src={christmasImg} width="100%" alt="" />
                            </ChristmasDecor>
                          )}
                        </ButtonError>
                      )}

                      {isDegenMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                    </BottomGrouping>
                  </Wrapper>
                </>
              )}
              {activeTab === TAB.INFO && (
                <TokenInfoTab currencies={isSwapPage ? currencies : currenciesLimit} onBack={onBackToSwapTab} />
              )}
              {activeTab === TAB.SETTINGS && (
                <SettingsPanel
                  isLimitOrder={isLimitPage}
                  onBack={onBackToSwapTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                  onClickGasPriceTracker={() => setActiveTab(TAB.GAS_PRICE_TRACKER)}
                />
              )}
              {activeTab === TAB.GAS_PRICE_TRACKER && (
                <GasPriceTrackerPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIQUIDITY_SOURCES && (
                <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIMIT && (
                <LimitOrder
                  isSelectCurrencyManual={isSelectCurrencyManually}
                  setIsSelectCurrencyManual={setIsSelectCurrencyManually}
                  refreshListOrder={refreshListOrder}
                />
              )}
              {isSwapPage && <AdvancedSwapDetailsDropdown trade={trade} feeConfig={feeConfig} />}
            </AppBodyWrapped>
          </SwapFormWrapper>

          {(isShowLiveChart || isShowTradeRoutes || shouldRenderTokenInfo || isLimitPage) && (
            <InfoComponentsWrapper>
              {isShowLiveChart && (
                <LiveChartWrapper>
                  <Suspense
                    fallback={
                      <Skeleton
                        height="100%"
                        baseColor={theme.background}
                        highlightColor={theme.buttonGray}
                        borderRadius="1rem"
                      />
                    }
                  >
                    <LiveChart currencies={isSwapPage ? currencies : currenciesLimit} />
                  </Suspense>
                </LiveChartWrapper>
              )}
              {isShowTradeRoutes && isSwapPage && (
                <RoutesWrapper isOpenChart={isShowLiveChart}>
                  <Flex flexDirection="column" width="100%">
                    <Flex alignItems={'center'}>
                      <RoutingIconWrapper />
                      <Text fontSize={20} fontWeight={500} color={theme.subText}>
                        <Trans>Your trade route</Trans>
                      </Text>
                    </Flex>
                    <Suspense
                      fallback={
                        <Skeleton
                          height="100px"
                          baseColor={theme.background}
                          highlightColor={theme.buttonGray}
                          borderRadius="1rem"
                        />
                      }
                    >
                      <Routing
                        tradeComposition={tradeRouteComposition}
                        currencyIn={currencyIn}
                        currencyOut={currencyOut}
                        inputAmount={trade?.inputAmount}
                        outputAmount={trade?.outputAmount}
                      />
                    </Suspense>
                  </Flex>
                </RoutesWrapper>
              )}
              {isLimitPage && <ListLimitOrder ref={refListLimitOrder} />}
              {shouldRenderTokenInfo && <TokenInfoV2 currencyIn={currencyIn} currencyOut={currencyOut} />}
            </InfoComponentsWrapper>
          )}
        </Container>
        <Flex justifyContent="center">
          <SwitchLocaleLinkWrapper>
            <SwitchLocaleLink />
          </SwitchLocaleLinkWrapper>
        </Flex>
      </PageWrapper>
    </>
  )
}
