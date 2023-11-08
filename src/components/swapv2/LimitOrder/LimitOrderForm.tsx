import { Currency, CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Repeat } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useCreateOrderMutation, useGetLOConfigQuery, useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import ArrowRotate from 'components/ArrowRotate'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import InfoHelper from 'components/InfoHelper'
import NumericalInput from 'components/NumericalInput'
import { RowBetween } from 'components/Row'
import Select from 'components/Select'
import Tooltip, { MouseoverTooltip } from 'components/Tooltip'
import ActionButtonLimitOrder from 'components/swapv2/LimitOrder/ActionButtonLimitOrder'
import DeltaRate, { useGetDeltaRateLimitOrder } from 'components/swapv2/LimitOrder/DeltaRate'
import { SummaryNotifyOrderPlaced } from 'components/swapv2/LimitOrder/ListOrder/SummaryNotify'
import ConfirmOrderModal from 'components/swapv2/LimitOrder/Modals/ConfirmOrderModal'
import TradePrice from 'components/swapv2/LimitOrder/TradePrice'
import useSignOrder from 'components/swapv2/LimitOrder/useSignOrder'
import useValidateInputError from 'components/swapv2/LimitOrder/useValidateInputError'
import useWarningCreateOrder from 'components/swapv2/LimitOrder/useWarningCreateOrder'
import useWrapEthStatus from 'components/swapv2/LimitOrder/useWrapEthStatus'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { Z_INDEXS } from 'constants/styles'
import { useTokenAllowance } from 'data/Allowances'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import useWrapCallback from 'hooks/useWrapCallback'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { useNotify } from 'state/application/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { subscribeNotificationOrderCancelled, subscribeNotificationOrderExpired } from 'utils/firebase'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import ExpirePicker from './ExpirePicker'
import { DEFAULT_EXPIRED, getExpireOptions } from './const'
import {
  calcInvert,
  calcOutput,
  calcRate,
  calcUsdPrices,
  formatAmountOrder,
  getErrorMessage,
  getPayloadCreateOrder,
  parseFraction,
  removeTrailingZero,
} from './helpers'
import { CreateOrderParam, EditOrderInfo, LimitOrder, RateInfo } from './type'

export const Label = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`
const Set2Market = styled(Label)`
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  user-select: none;
  margin: 0;
`
const INPUT_HEIGHT = 28

type Props = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  defaultInputAmount?: string
  defaultOutputAmount?: string
  defaultActiveMakingAmount?: string
  defaultExpire?: Date
  setIsSelectCurrencyManual?: (val: boolean) => void
  note?: string
  orderInfo?: LimitOrder
  flowState: TransactionFlowState
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
  zIndexToolTip?: number
  defaultRate?: RateInfo
  editOrderInfo?: EditOrderInfo
}

const InputWrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 12px;
  flex: 1;
  padding: 12px;
  flex-direction: column;
  gap: 0.5rem;
  display: flex;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`
const ExpiredInput = styled(InputWrapper)`
  max-width: 30%;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: unset;
  `}
`
export type LimitOrderFormHandle = {
  hasChangedOrderInfo: () => boolean
}
const LimitOrderForm = forwardRef<LimitOrderFormHandle, Props>(function LimitOrderForm(
  {
    currencyIn,
    currencyOut,
    defaultInputAmount = '',
    defaultOutputAmount = '',
    defaultActiveMakingAmount = '',
    defaultExpire,
    defaultRate = { rate: '', invertRate: '', invert: false },
    setIsSelectCurrencyManual,
    note = '',
    orderInfo,
    flowState,
    setFlowState,
    zIndexToolTip = Z_INDEXS.TOOL_TIP_ERROR_INPUT_SWAP_FORM,
    editOrderInfo,
  },
  ref,
) {
  const isEdit = editOrderInfo?.isEdit || false // else create
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()
  const notify = useNotify()
  const { mixpanelHandler } = useMixpanel()

  const {
    setCurrencyIn,
    setCurrencyOut,
    switchCurrency,
    removeOrderNeedCreated,
    resetState,
    setOrderEditing,
    setInputValue: setInputValueGlobal,
  } = useLimitActionHandlers()
  const { ordersNeedCreated, inputAmount: inputAmountGlobal } = useLimitState()

  const [inputAmount, setInputAmount] = useState(defaultInputAmount)
  const [outputAmount, setOutputAmount] = useState(defaultOutputAmount)

  const [rateInfo, setRateInfo] = useState<RateInfo>(defaultRate)
  const displayRate = rateInfo.invert ? rateInfo.invertRate : rateInfo.rate

  const [expire, setExpire] = useState(DEFAULT_EXPIRED)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDateExpire, setCustomDateExpire] = useState<Date | undefined>(defaultExpire)

  const [approvalSubmitted, setApprovalSubmitted] = useState(false)
  const { library } = useWeb3React()

  const { loading: loadingTrade, tradeInfo } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut)
  const deltaRate = useGetDeltaRateLimitOrder({ marketPrice: tradeInfo, rateInfo })

  const { data: activeOrderMakingAmount = defaultActiveMakingAmount, refetch: getActiveMakingAmount } =
    useGetTotalActiveMakingAmountQuery(
      { chainId, tokenAddress: currencyIn?.wrapped.address ?? '', account: account ?? '' },
      { skip: !currencyIn || !account },
    )

  const { execute: onWrap, inputError: wrapInputError } = useWrapCallback(currencyIn, currencyOut, inputAmount, true)
  const showWrap = !!currencyIn?.isNative

  const onSetRate = (rate: string, invertRate: string) => {
    if (!currencyIn || !currencyOut) return
    const newRate: RateInfo = { ...rateInfo, rate, invertRate, rateFraction: parseFraction(rate) }
    if (!rate && !invertRate) {
      setRateInfo(newRate)
      return
    }

    if (rate) {
      if (inputAmount) {
        const output = calcOutput(inputAmount, newRate.rateFraction || rate, currencyOut.decimals)
        setOutputAmount(output)
      }
      if (!invertRate) {
        newRate.invertRate = calcInvert(rate)
      }
      setRateInfo(newRate)
      return
    }
    if (invertRate) {
      newRate.rate = calcInvert(invertRate)
      newRate.rateFraction = parseFraction(invertRate).invert()
      if (inputAmount) {
        const output = calcOutput(inputAmount, newRate.rateFraction, currencyOut.decimals)
        setOutputAmount(output)
      }
      setRateInfo(newRate)
      return
    }
  }

  const onSetOutput = (output: string) => {
    if (inputAmount && parseFloat(inputAmount) !== 0 && currencyOut && output) {
      const rate = calcRate(inputAmount, output, currencyOut?.decimals)
      setRateInfo({
        ...rateInfo,
        rate,
        rateFraction: parseFraction(rate),
        invertRate: calcInvert(rate),
      })
    }
    setOutputAmount(output)
  }

  const setPriceRateMarket = () => {
    try {
      mixpanelHandler(MIXPANEL_TYPE.LO_ENTER_DETAIL, 'set price')
      if (loadingTrade || !tradeInfo) return
      onSetRate(
        removeTrailingZero(tradeInfo.marketRate.toFixed(16)) ?? '',
        removeTrailingZero(tradeInfo.invertRate.toFixed(16)) ?? '',
      )
    } catch (error) {}
  }

  const onChangeRate = (val: string) => {
    if (currencyOut) {
      onSetRate(rateInfo.invert ? '' : val, rateInfo.invert ? val : '')
    }
  }

  const onSetInput = useCallback(
    (input: string) => {
      setInputAmount(input)
      if (rateInfo.rate && currencyIn && currencyOut && input) {
        setOutputAmount(calcOutput(input, rateInfo.rateFraction || rateInfo.rate, currencyOut.decimals))
      }
    },
    [rateInfo, currencyIn, currencyOut],
  )

  const onInvertRate = (invert: boolean) => {
    setRateInfo({ ...rateInfo, invert })
  }

  const handleInputSelect = useCallback(
    (currency: Currency, resetRate = true) => {
      if (currencyOut && currency?.equals(currencyOut)) {
        switchCurrency()
        return
      }
      setCurrencyIn(currency)
      setIsSelectCurrencyManual?.(true)
      resetRate && setRateInfo(rateInfo => ({ ...rateInfo, invertRate: '', rate: '', rateFraction: undefined }))
    },
    [currencyOut, setCurrencyIn, setIsSelectCurrencyManual, switchCurrency],
  )

  const switchToWeth = useCallback(() => {
    handleInputSelect(currencyIn?.wrapped as Currency, false)
  }, [currencyIn, handleInputSelect])

  const { isWrappingEth, setTxHashWrapped } = useWrapEthStatus(switchToWeth)

  const handleOutputSelect = (currency: Currency) => {
    if (currencyIn && currency?.equals(currencyIn)) {
      switchCurrency()
      return
    }
    setCurrencyOut(currency)
    setIsSelectCurrencyManual?.(true)
    setRateInfo({ ...rateInfo, invertRate: '', rate: '', rateFraction: undefined })
  }

  const [rotate, setRotate] = useState(false)
  const handleRotateClick = () => {
    if (isEdit) return
    setRotate(prev => !prev)
    switchCurrency()
    setIsSelectCurrencyManual?.(true)
  }

  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  const { currentData } = useGetLOConfigQuery(chainId)
  const limitOrderContract = currentData?.contract

  const currentAllowance = useTokenAllowance(
    currencyIn as Token,
    account ?? undefined,
    limitOrderContract,
  ) as CurrencyAmount<Currency>

  const parsedActiveOrderMakingAmount = useMemo(() => {
    try {
      if (currencyIn && activeOrderMakingAmount) {
        const value = TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(activeOrderMakingAmount))
        if (isEdit && orderInfo) {
          return value.subtract(TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(orderInfo.makingAmount)))
        }
        return value
      }
    } catch (error) {}
    return undefined
  }, [currencyIn, activeOrderMakingAmount, isEdit, orderInfo])

  const balance = useCurrencyBalance(currencyIn)
  const maxAmountInput = useMemo(() => {
    return maxAmountSpend(balance)
  }, [balance])

  const handleMaxInput = useCallback(() => {
    if (!parsedActiveOrderMakingAmount || !maxAmountInput || !currencyIn) return
    try {
      const rest = maxAmountInput.subtract(parsedActiveOrderMakingAmount)
      onSetInput(rest.greaterThan(CurrencyAmount.fromRawAmount(currencyIn, 0)) ? rest?.toExact() : '0')
    } catch (error) {}
  }, [maxAmountInput, onSetInput, parsedActiveOrderMakingAmount, currencyIn])

  const enoughAllowance = useMemo(() => {
    try {
      const allowanceSubtracted = parsedActiveOrderMakingAmount
        ? currentAllowance?.subtract(parsedActiveOrderMakingAmount)
        : undefined
      return Boolean(
        currencyIn?.isNative ||
          (parseInputAmount &&
            (allowanceSubtracted?.greaterThan(parseInputAmount) || allowanceSubtracted?.equalTo(parseInputAmount))),
      )
    } catch (error) {
      return false
    }
  }, [currencyIn?.isNative, currentAllowance, parseInputAmount, parsedActiveOrderMakingAmount])

  const [approval, approveCallback] = useApproveCallback(
    parseInputAmount,
    limitOrderContract || undefined,
    !enoughAllowance,
  )

  const { inputError, outPutError } = useValidateInputError({
    inputAmount,
    outputAmount,
    balance,
    displayRate,
    parsedActiveOrderMakingAmount,
    currencyIn,
    wrapInputError,
    showWrap,
    currencyOut,
  })

  const hasInputError = Boolean(inputError || outPutError)
  const checkingAllowance =
    !(currencyIn && parsedActiveOrderMakingAmount?.currency?.equals(currencyIn)) ||
    !(currencyIn && currentAllowance?.currency?.equals(currencyIn))

  const isNotFillAllInput = [outputAmount, inputAmount, currencyIn, currencyOut, displayRate].some(e => !e)

  const expiredAt = customDateExpire?.getTime() || Date.now() + expire * 1000

  const showPreview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !displayRate) return
    setFlowState({ ...TRANSACTION_STATE_DEFAULT, showConfirm: true })
    if (!isEdit)
      mixpanelHandler(MIXPANEL_TYPE.LO_CLICK_REVIEW_PLACE_ORDER, {
        from_token: currencyIn.symbol,
        to_token: currencyOut.symbol,
        from_network: chainId,
        trade_qty: inputAmount,
      })
  }

  const hidePreview = useCallback(() => {
    setFlowState(state => ({ ...state, showConfirm: false }))
  }, [setFlowState])

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker)
  }

  const onChangeExpire = (val: Date | number) => {
    if (typeof val === 'number') {
      setExpire(val)
      setCustomDateExpire(undefined)
      mixpanelHandler(MIXPANEL_TYPE.LO_ENTER_DETAIL, 'choose date')
    } else {
      setCustomDateExpire(val)
    }
  }

  const onResetForm = () => {
    setInputAmount(defaultInputAmount)
    setOutputAmount(defaultOutputAmount)
    setRateInfo(defaultRate)
    setExpire(DEFAULT_EXPIRED)
    setCustomDateExpire(undefined)
    refreshActiveMakingAmount()
    resetState()
  }

  const handleError = useCallback(
    (error: any) => {
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage: getErrorMessage(error),
      }))
    },
    [setFlowState],
  )

  const signOrder = useSignOrder(setFlowState)

  const [submitOrder] = useCreateOrderMutation()
  const onSubmitCreateOrder = async (params: CreateOrderParam) => {
    try {
      const { currencyIn, currencyOut, account, inputAmount, outputAmount, expiredAt } = params
      if (!library || !currencyIn || !currencyOut || !account || !inputAmount || !outputAmount || !expiredAt) {
        throw new Error('wrong input')
      }

      const { signature, salt } = await signOrder(params)
      const payload = getPayloadCreateOrder(params)
      setFlowState(state => ({ ...state, pendingText: t`Placing order` }))
      const response = await submitOrder({ ...payload, salt, signature }).unwrap()
      setFlowState(state => ({ ...state, showConfirm: false }))

      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Order Placed`,
          summary: <SummaryNotifyOrderPlaced {...{ currencyIn, currencyOut, inputAmount, outputAmount }} />,
        },
        10000,
      )
      onResetForm()
      return response?.id
    } catch (error) {
      handleError(error)
      return
    }
  }

  const onWrapToken = async () => {
    try {
      if (isNotFillAllInput || wrapInputError || isWrappingEth || hasInputError) return
      const amount = formatAmountOrder(inputAmount)
      setFlowState(state => ({
        ...state,
        attemptingTxn: true,
        showConfirm: true,
        pendingText: t`Wrapping ${amount} ${currencyIn?.symbol} to ${amount} ${WETH[chainId].symbol}`,
      }))
      const hash = await onWrap?.()
      hash && setTxHashWrapped(hash)
      setFlowState(state => ({ ...state, showConfirm: false }))
    } catch (error) {
      handleError(error)
    }
  }

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  const refreshActiveMakingAmount = useCallback(() => {
    try {
      getActiveMakingAmount()
    } catch (error) {}
  }, [getActiveMakingAmount])

  useEffect(() => {
    if (!isEdit || !orderInfo?.id) return
    setOrderEditing({
      orderId: orderInfo.id,
      account,
      chainId,
      currencyIn,
      currencyOut,
      inputAmount,
      outputAmount,
      expiredAt,
    })
  }, [
    setOrderEditing,
    account,
    chainId,
    currencyIn,
    currencyOut,
    inputAmount,
    outputAmount,
    expiredAt,
    orderInfo?.id,
    isEdit,
  ])

  // use ref to prevent too many api call when firebase update status
  const refSubmitCreateOrder = useRef(onSubmitCreateOrder)
  refSubmitCreateOrder.current = onSubmitCreateOrder

  useEffect(() => {
    if (!account) return
    // call when cancel expired/cancelled
    const unsubscribeCancelled = subscribeNotificationOrderCancelled(account, chainId, data => {
      data?.orders.forEach(order => {
        const findInfo = ordersNeedCreated.find(e => e.orderId === order.id)
        if (!findInfo?.orderId) return
        removeOrderNeedCreated(findInfo.orderId)
        // when cancel order success => create a new order
        if (order.isSuccessful && !isEdit) {
          refSubmitCreateOrder.current(findInfo)
        }
      })
      refreshActiveMakingAmount()
    })
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, refreshActiveMakingAmount)
    return () => {
      unsubscribeCancelled?.()
      unsubscribeExpired?.()
    }
  }, [account, chainId, ordersNeedCreated, removeOrderNeedCreated, refreshActiveMakingAmount, isEdit])

  useEffect(() => {
    if (inputAmountGlobal) {
      onSetInput(inputAmountGlobal)
      setInputValueGlobal('')
    }
  }, [inputAmountGlobal, onSetInput, setInputValueGlobal]) // when redux state change, ex: type and swap

  useEffect(() => {
    return () => {
      resetState()
    }
  }, [resetState])

  const trackingTouchInput = useCallback(() => {
    mixpanelHandler(MIXPANEL_TYPE.LO_ENTER_DETAIL, 'touch enter amount box')
  }, [mixpanelHandler])

  const trackingTouchSelectToken = useCallback(() => {
    mixpanelHandler(MIXPANEL_TYPE.LO_ENTER_DETAIL, 'touch enter token box')
  }, [mixpanelHandler])

  const trackingPlaceOrder = (type: MIXPANEL_TYPE, data = {}) => {
    mixpanelHandler(type, {
      from_token: currencyIn?.symbol,
      to_token: currencyOut?.symbol,
      from_network: networkInfo.name,
      trade_qty: inputAmount,
      ...data,
    })
  }

  const onSubmitCreateOrderWithTracking = async () => {
    trackingPlaceOrder(MIXPANEL_TYPE.LO_CLICK_PLACE_ORDER)
    const order_id = await onSubmitCreateOrder({
      currencyIn,
      currencyOut,
      chainId,
      account,
      inputAmount,
      outputAmount,
      expiredAt,
    })
    if (order_id) trackingPlaceOrder(MIXPANEL_TYPE.LO_PLACE_ORDER_SUCCESS, { order_id })
  }

  const styleTooltip = { maxWidth: '250px', zIndex: zIndexToolTip }
  const estimateUSD = useMemo(() => {
    return calcUsdPrices({
      inputAmount,
      outputAmount,
      priceUsdIn: tradeInfo?.priceUsdIn,
      priceUsdOut: tradeInfo?.priceUsdOut,
      currencyIn,
      currencyOut,
    })
  }, [inputAmount, outputAmount, tradeInfo, currencyIn, currencyOut])

  const showApproveFlow =
    !checkingAllowance &&
    !showWrap &&
    !isNotFillAllInput &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      !enoughAllowance ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const warningMessage = useWarningCreateOrder({
    estimateUSD: estimateUSD.rawInput,
    currencyIn,
    outputAmount,
    displayRate,
    deltaRate,
  })

  useImperativeHandle(ref, () => ({
    hasChangedOrderInfo() {
      return (
        isEdit &&
        !hasInputError &&
        (defaultInputAmount !== inputAmount ||
          defaultRate?.rate !== rateInfo.rate ||
          defaultExpire?.getTime() !== expiredAt)
      )
    },
  }))

  const renderActionBtn = () => (
    <ActionButtonLimitOrder
      {...{
        currencyIn,
        currencyOut,
        approval,
        showWrap,
        isWrappingEth,
        isNotFillAllInput,
        approvalSubmitted,
        hasInputError,
        enoughAllowance,
        checkingAllowance,
        wrapInputError,
        approveCallback,
        onWrapToken,
        showPreview,
        showApproveFlow,
        showWarning: warningMessage.length > 0,
        editOrderInfo,
      }}
    />
  )
  const renderConfirmModal = (showConfirmContent = false) => (
    <ConfirmOrderModal
      flowState={flowState}
      onDismiss={hidePreview}
      onSubmit={onSubmitCreateOrderWithTracking}
      currencyIn={currencyIn}
      currencyOut={currencyOut}
      inputAmount={inputAmount}
      outputAmount={outputAmount}
      expireAt={expiredAt}
      rateInfo={rateInfo}
      marketPrice={tradeInfo}
      showConfirmContent={showConfirmContent}
      note={note}
      editOrderInfo={editOrderInfo}
      warningMessage={warningMessage}
      percentDiff={Number(deltaRate.rawPercent)}
    />
  )

  if (isEdit && flowState.showConfirm)
    return (
      <>
        {renderConfirmModal(true)}
        {renderActionBtn()}
      </>
    )
  return (
    <>
      <Flex flexDirection={'column'} style={{ gap: '1rem' }}>
        <Tooltip
          text={inputError}
          show={!!inputError}
          placement="top"
          style={styleTooltip}
          width="fit-content"
          dataTestId="error-message"
        >
          <CurrencyInputPanel
            error={!!inputError}
            value={inputAmount}
            positionMax="top"
            onUserInput={onSetInput}
            onMax={handleMaxInput}
            onHalf={null}
            otherCurrency={currencyOut}
            estimatedUsd={estimateUSD.input}
            onFocus={trackingTouchInput}
            onCurrencySelect={handleInputSelect}
            currency={currencyIn}
            showCommonBases
            id="create-limit-order-input-tokena"
            dataTestId="limit-order-input-tokena"
            maxCurrencySymbolLength={6}
            filterWrap
            onClickSelect={trackingTouchSelectToken}
            lockIcon={showApproveFlow}
            disableCurrencySelect={isEdit}
            label={
              <Label>
                <Trans>You Sell</Trans>
              </Label>
            }
            positionLabel="in"
          />
        </Tooltip>

        <Tooltip text={outPutError} show={!!outPutError} placement="top" style={styleTooltip} width="fit-content">
          <CurrencyInputPanel
            maxLength={16}
            value={outputAmount}
            error={!!outPutError}
            currency={currencyOut}
            onUserInput={onSetOutput}
            otherCurrency={currencyIn}
            onMax={null}
            onHalf={null}
            estimatedUsd={estimateUSD.output}
            onFocus={trackingTouchInput}
            id="create-limit-order-input-tokenb"
            dataTestId="limit-order-input-tokenb"
            onCurrencySelect={handleOutputSelect}
            positionMax="top"
            showCommonBases
            maxCurrencySymbolLength={6}
            filterWrap
            onClickSelect={trackingTouchSelectToken}
            disableCurrencySelect={isEdit}
            label={
              <Label>
                <Trans>You Buy</Trans>
              </Label>
            }
            positionLabel="in"
          />
        </Tooltip>

        <RowBetween gap="1rem" flexDirection={upToSmall ? 'column' : 'row'}>
          <InputWrapper>
            <Flex justifyContent={'space-between'} alignItems="center">
              <DeltaRate
                invert={rateInfo.invert}
                symbol={(rateInfo.invert ? currencyOut?.symbol : currencyIn?.symbol) ?? ''}
                marketPrice={tradeInfo}
                rateInfo={rateInfo}
              />
              {tradeInfo && (
                <Set2Market onClick={setPriceRateMarket}>
                  <Trans>Market</Trans>
                </Set2Market>
              )}
            </Flex>
            <Flex alignItems={'center'} style={{ background: theme.buttonBlack, borderRadius: 12 }}>
              <NumericalInput
                maxLength={50}
                style={{ fontSize: 14, height: INPUT_HEIGHT }}
                data-testid="input-selling-rate"
                value={displayRate}
                onUserInput={onChangeRate}
                onFocus={trackingTouchInput}
              />
              {currencyIn && currencyOut && (
                <Flex style={{ gap: 6, cursor: 'pointer' }} onClick={() => onInvertRate(!rateInfo.invert)}>
                  <CurrencyLogo size={'18px'} currency={rateInfo.invert ? currencyIn : currencyOut} />
                  <Text fontSize={14} color={theme.subText} sx={{ userSelect: 'none' }}>
                    {rateInfo.invert ? currencyIn?.symbol : currencyOut?.symbol}
                  </Text>
                  <div>
                    <Repeat color={theme.subText} size={12} />
                  </div>
                </Flex>
              )}
            </Flex>
          </InputWrapper>
          <ExpiredInput>
            <Label>
              <Trans>Expires In</Trans>
              <InfoHelper
                color={theme.primary}
                text={t`Once an order expires, it will be cancelled automatically. No gas fees will be charged.`}
              />
            </Label>
            <Select
              value={expire}
              onChange={onChangeExpire}
              optionStyle={isEdit ? { paddingTop: 8, paddingBottom: 8 } : {}}
              menuStyle={{ left: upToSmall ? 'unset' : 0, ...(isEdit ? { paddingTop: 8, paddingBottom: 8 } : {}) }}
              style={{ width: '100%', padding: 0, height: INPUT_HEIGHT }}
              options={[...getExpireOptions(), { label: 'Custom', onSelect: toggleDatePicker }]}
              activeRender={item => {
                const displayTime = customDateExpire ? dayjs(customDateExpire).format('DD/MM/YYYY HH:mm') : item?.label
                return (
                  <MouseoverTooltip text={customDateExpire ? displayTime : ''} width="130px">
                    <Text color={theme.text} fontSize={14}>
                      {displayTime}
                    </Text>
                  </MouseoverTooltip>
                )
              }}
            />
          </ExpiredInput>
        </RowBetween>

        <RowBetween>
          {currencyIn && currencyOut ? (
            <TradePrice
              price={tradeInfo}
              style={{ width: 'fit-content', fontStyle: 'italic' }}
              color={theme.text}
              label={t`Est. Market Price:`}
              loading={loadingTrade}
              symbolIn={currencyIn?.symbol}
              symbolOut={currencyOut?.symbol}
            />
          ) : (
            <div />
          )}
          <ArrowRotate
            rotate={rotate}
            onClick={isEdit ? undefined : handleRotateClick}
            style={{ width: 25, height: 25, padding: 4, background: theme.buttonGray }}
          />
        </RowBetween>

        {warningMessage.map((mess, i) => (
          <ErrorWarningPanel type="warn" key={i} title={mess} />
        ))}

        {renderActionBtn()}
      </Flex>

      {renderConfirmModal()}

      <ExpirePicker
        defaultDate={customDateExpire}
        expire={expire}
        isOpen={showDatePicker}
        onDismiss={toggleDatePicker}
        onSetDate={onChangeExpire}
      />
    </>
  )
})

export default memo(LimitOrderForm)
