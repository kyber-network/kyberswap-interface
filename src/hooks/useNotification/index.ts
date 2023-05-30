import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  useBuildTelegramVerificationMutation,
  useCreateWatchWalletMutation,
  useGetSubscriptionTopicsQuery,
  useSubscribeTopicsMutation,
} from 'services/identity'

import { ELASTIC_POOL_TOPIC_ID, KYBER_AI_TOPIC_ID, PRICE_ALERT_TOPIC_ID } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { setLoadingNotification, setSubscribedNotificationTopic } from 'state/application/actions'
import { useSessionInfo } from 'state/authen/hooks'
import { pushUnique } from 'utils'

export enum TopicType {
  RESTRICT = 'restricted',
  NORMAL = 'common',
}

export type Topic = {
  id: number
  code: string
  description: string
  name: string
  isSubscribed: boolean
  topics: Topic[]
  priority: number
  type: TopicType
  isKyberAI: boolean
}

type SaveNotificationParam = {
  subscribeIds: number[]
  unsubscribeIds: number[]
  isEmail: boolean
  isTelegram?: boolean
}

const useNotification = () => {
  const { isLoading, topicGroups } = useSelector((state: AppState) => state.application.notification)
  const { userInfo } = useSessionInfo()

  const { account, chainId } = useActiveWeb3React()
  const dispatch = useDispatch()

  const setLoading = useCallback(
    (isLoading: boolean) => {
      dispatch(setLoadingNotification(isLoading))
    },
    [dispatch],
  )

  const { data: resp, refetch } = useGetSubscriptionTopicsQuery(undefined, { skip: !userInfo })

  useEffect(() => {
    if (!resp) return
    const topicGroups: Topic[] = (resp?.topicGroups ?? []).map((e: Topic, i: number) => ({
      ...e,
      id: Date.now() + i,
      isSubscribed: e?.topics?.every(e => e.isSubscribed),
      isKyberAI: e?.topics?.some(e => e.id + '' === KYBER_AI_TOPIC_ID),
    }))
    dispatch(setSubscribedNotificationTopic({ topicGroups }))
  }, [resp, dispatch])

  const refreshTopics = useCallback(() => {
    try {
      account && refetch()
    } catch (error) {}
  }, [refetch, account])

  useEffect(() => {
    refreshTopics()
  }, [userInfo?.identityId, refreshTopics])

  const [requestWatchWallet] = useCreateWatchWalletMutation()
  const [callSubscribeTopic] = useSubscribeTopicsMutation()
  const [buildTelegramVerification] = useBuildTelegramVerificationMutation()

  const saveNotification = useCallback(
    async ({ subscribeIds, unsubscribeIds, isEmail, isTelegram }: SaveNotificationParam) => {
      try {
        setLoading(true)
        if (isEmail) {
          let topicIds = topicGroups.reduce(
            (topics: number[], item) => [...topics, ...item.topics.filter(e => e.isSubscribed).map(e => e.id)],
            [],
          )
          if (unsubscribeIds.length) {
            topicIds = topicIds.filter(id => !unsubscribeIds.includes(id))
          }
          if (subscribeIds.length) {
            topicIds = topicIds.concat(subscribeIds)
          }
          if (
            (subscribeIds.includes(+PRICE_ALERT_TOPIC_ID) || subscribeIds.includes(+ELASTIC_POOL_TOPIC_ID)) &&
            account
          ) {
            await requestWatchWallet({ walletAddress: account }).unwrap()
          }
          await callSubscribeTopic({ topicIds: [...new Set(topicIds)] }).unwrap()
          return
        }
        if (isTelegram) {
          const data = await buildTelegramVerification({
            chainId: chainId + '',
            wallet: account ?? '',
            subscribe: subscribeIds,
            unsubscribe: unsubscribeIds,
          })
          return data
        }
        return
      } catch (e) {
        return Promise.reject(e)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, account, chainId, topicGroups, callSubscribeTopic, buildTelegramVerification, requestWatchWallet],
  )

  const unsubscribeAll = useCallback(() => {
    let unsubscribeIds: number[] = []
    topicGroups.forEach(topic => {
      if (!topic.isSubscribed) return
      topic.topics.forEach(topic => {
        unsubscribeIds = pushUnique(unsubscribeIds, topic.id)
      })
    })
    if (!unsubscribeIds.length) return
    saveNotification({ isEmail: true, unsubscribeIds, subscribeIds: [] })
    setTimeout(() => {
      refreshTopics()
    }, 500)
  }, [topicGroups, saveNotification, refreshTopics])

  return {
    topicGroups,
    isLoading,
    saveNotification,
    refreshTopics,
    unsubscribeAll,
  }
}

export default useNotification
