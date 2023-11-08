import { Trans, t } from '@lingui/macro'
import { AnimatePresence, Reorder, motion, useAnimationControls, useDragControls } from 'framer-motion'
import debounce from 'lodash/debounce'
import { CSSProperties, memo, useEffect, useRef, useState } from 'react'
import { Check, Plus, X } from 'react-feather'
import { useDispatch } from 'react-redux'
import { Text } from 'rebass'
import styled, { css, useTheme } from 'styled-components'

import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import { useShowConfirm } from 'components/ConfirmModal'
import Divider from 'components/Divider'
import Icon from 'components/Icons/Icon'
import AnimatedSpinLoader from 'components/Loader/AnimatedSpinLoader'
import Modal from 'components/Modal'
import Popover from 'components/Popover'
import Row, { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'

import { WATCHLIST_MAX_LIMIT } from '../constants'
import kyberAIApi, {
  useAddToWatchlistMutation,
  useCreateCustomWatchlistMutation,
  useDeleteCustomWatchlistMutation,
  useGetWatchlistInformationQuery,
  useRemoveFromWatchlistMutation,
  useUpdateCustomizedWatchlistsPrioritiesMutation,
  useUpdateWatchlistsNameMutation,
} from '../hooks/useKyberAIData'
import { ICustomWatchlists } from '../types'
import SimpleTooltip from './SimpleTooltip'
import { StarWithAnimation } from './WatchlistStar'

const MenuWrapper = styled(Column)`
  width: fit-content;
  gap: 20px;
  padding: 20px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
`

const ModalWrapper = styled(Column)`
  padding: 20px;
  border-radius: 20px;
  gap: 24px;
  width: 100%;
  transition: all 0.3s;
`

const MenuOption = styled(Row)`
  gap: 6px;
  cursor: pointer;
  :hover {
    color: ${({ theme }) => theme.text};
  }
`
const ReorderWrapper = styled.div`
  gap: 16px;
  height: 280px;

  ::-webkit-scrollbar {
    -webkit-appearance: button;
    width: 7px;
  }
  ::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.5);
    -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
  }

  ul {
    margin: 0;
    padding: 0;
  }
  li {
    color: ${({ theme }) => theme.subText};
    background-color: ${({ theme }) => theme.buttonBlack};
    border-radius: 16px;
    border: 1px solid ${({ theme }) => theme.border};
    gap: 4px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    user-select: none;
    position: relative;
  }
  li:not(:last-child) {
    margin-bottom: 16px;
  }
`
const GrabButton = styled.div`
  color: ${({ theme }) => theme.subText + '80'};
  transition: all 0.1s;
  :hover {
    color: ${({ theme }) => theme.subText + 'dd'};
  }
`
const InlineInput = styled(motion.input)`
  background-color: transparent;
  color: ${({ theme }) => theme.text};
  font-size: unset;
  outline: none;
  border: none;
  ::placeholder {
    font-style: italic;
  }
`

function WatchlistsItem({
  item,
  watchlistsCount,
  wrapperRef,
}: {
  item: ICustomWatchlists
  watchlistsCount: number
  wrapperRef: React.RefObject<HTMLDivElement>
}) {
  const controls = useDragControls()
  const theme = useTheme()
  const showConfirm = useShowConfirm()

  const [isEditting, setIsEditting] = useState(false)

  const [updateWatchlistsName] = useUpdateWatchlistsNameMutation()
  const [deleteCustomWatchlist, { isLoading: isDeleting }] = useDeleteCustomWatchlistMutation()

  const ref = useRef<HTMLInputElement>(null)

  const handleStartEdit = () => {
    setIsEditting(true)
  }

  const handleExitEdit = () => {
    setIsEditting(false)
  }

  const handleUpdateWatchlists = () => {
    setIsEditting(false)
    updateWatchlistsName({ userWatchlistId: item.id, name: ref.current?.value || '' })
  }

  const handleRemoveWatchlists = () => {
    showConfirm({
      isOpen: true,
      content: (
        <Text padding="1em 0">
          <Trans>
            Do you want to remove{' '}
            <strong style={{ color: theme.text }}>
              {item.name} ({item.assetNumber})
            </strong>
          </Trans>
        </Text>
      ),
      title: t`Remove Watchlist`,
      confirmText: t`Yes`,
      cancelText: t`No, go back`,
      onConfirm: () => deleteCustomWatchlist({ ids: item.id.toString() }),
    })
  }

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      const element = e.target as HTMLInputElement
      if (e.key === 'Enter') {
        e.preventDefault() // Prevent line break
        handleUpdateWatchlists()
      }
      if (e.key === 'Escape') {
        handleExitEdit()
        element.value = item.name
      }
    }
    const element = ref.current
    if (isEditting && element) {
      element.focus()
      element.setAttribute('value', item.name)
      element.setSelectionRange(item.name.length, item.name.length)
      element.addEventListener('keydown', keydownHandler)
    }
    return () => {
      element?.removeEventListener('keydown', keydownHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditting, item])

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      dragConstraints={wrapperRef}
      dragElastic={0}
      initial={{ opacity: 0, scale: 1 }}
      animate={{
        opacity: 1,
        transition: { duration: 0.2 },
      }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      whileDrag={{ boxShadow: '2px 5px 10px rgba(0,0,0,0.3)', scale: 1.02 }}
    >
      <RowBetween gap="4px">
        <Row gap="2px">
          <GrabButton onPointerDown={e => controls.start(e)} style={{ cursor: 'grab' }}>
            <Icon id="drag-indicator" />
          </GrabButton>
          {isEditting ? (
            <InlineInput ref={ref} maxLength={30} />
          ) : (
            <div style={{ flex: 1 }}>
              {item.name} ({item.assetNumber})
            </div>
          )}
        </Row>
        <RowFit gap="2px" flexShrink={0}>
          {isEditting ? (
            <>
              <ButtonAction onClick={handleUpdateWatchlists}>
                <Check size={16} color={theme.primary} strokeWidth="3px" />
              </ButtonAction>
              <ButtonAction onClick={handleExitEdit}>
                <X size={16} color={theme.red} strokeWidth="3px" />
              </ButtonAction>
            </>
          ) : (
            <ButtonAction onClick={handleStartEdit} sx={{ ':hover': { color: theme.text } }}>
              <Icon id="pencil" size={16} />
            </ButtonAction>
          )}
          {isDeleting ? (
            <AnimatedSpinLoader size={20} />
          ) : (
            <ButtonAction
              disabled={watchlistsCount <= 1}
              onClick={handleRemoveWatchlists}
              sx={{
                ':hover': { color: theme.text },
                ':disabled': {
                  pointerEvents: 'none',
                  filter: 'brightness(0.5)',
                },
              }}
            >
              <Icon id="trash" size={16} />
            </ButtonAction>
          )}
        </RowFit>
      </RowBetween>
    </Reorder.Item>
  )
}

const CreateListWrapper = styled(motion.div)<{ $disabled: boolean }>`
  color: ${({ theme }) => theme.subText};
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  gap: 4px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  user-select: none;
  position: relative;
  height: 40px;
  :hover {
    border: 1px solid ${({ theme }) => theme.text + 'aa'};
  }
  :has(input:focus) {
    border: 1px solid ${({ theme }) => theme.primary};
  }
  ${({ $disabled }) =>
    $disabled &&
    css`
      cursor: unset;
      user-select: none;
      pointer-events: none;
      filter: opacity(0.4);
    `}
`

const CreateListButtonWrapper = styled(RowFit)`
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  transition: all 0.1s;
  gap: 4px;
  :hover {
    filter: brightness(1.2);
  }
`

const CreateListInput = ({
  watchlistsCount,
  watchlists,
}: {
  watchlistsCount: number
  watchlists: ICustomWatchlists[]
}) => {
  const theme = useTheme()
  const [value, setValue] = useState<string>('')
  const [isError, setIsError] = useState(false)
  const [createCustomWatchlist] = useCreateCustomWatchlistMutation()
  const inputControls = useAnimationControls()

  const ref = useRef<HTMLInputElement>(null)
  const touchedRef = useRef<boolean>(false)

  const checkExist = (name: string) => watchlists.some(watchlists => watchlists.name === name)

  const onSubmit = async (e: any) => {
    e.stopPropagation()
    const newListName = value ? value : generateNewListName(watchlistsCount + 1)
    setValue(newListName)
    if (checkExist(newListName)) {
      inputControls.start({ x: [-6, 7, 0] }, { type: 'spring', damping: 10, stiffness: 3000 })
      inputControls.start({ color: [theme.red, theme.white] }, { duration: 1.5 })
      touchedRef.current = true
      setIsError(true)
    } else {
      touchedRef.current = false
      setIsError(false)
      if (newListName) {
        createCustomWatchlist({ name: newListName })
      }
      setValue('')
    }
  }

  const disabled = watchlistsCount >= 5

  return (
    <SimpleTooltip
      text={t`You can only create up to 5 custom watchlists.`}
      disabled={!disabled}
      delay={100}
      width="200px"
    >
      <CreateListWrapper
        $disabled={!!disabled}
        onClick={() => {
          ref.current?.focus()
        }}
      >
        <RowBetween>
          <InlineInput
            ref={ref}
            animate={inputControls}
            initial={{ color: theme.text }}
            value={value}
            onChange={e => {
              if (touchedRef.current) {
                setIsError(checkExist(e.target.value))
              }
              setValue(e.target.value)
            }}
            placeholder={disabled ? t`Reached max limit.` : generateNewListName(watchlistsCount + 1)}
            maxLength={25}
            style={{ zIndex: 2 }}
          />
          <AnimatePresence>
            {isError && (
              <motion.div
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 5, opacity: 0 }}
                style={{ position: 'absolute', fontSize: '12px', top: -20, left: 0, color: theme.red, zIndex: 1 }}
              >
                <Trans>Watchlists name exist!</Trans>
              </motion.div>
            )}
          </AnimatePresence>
          <CreateListButtonWrapper onClick={onSubmit}>
            <Plus size={16} />
            <Text fontSize="14px">
              <Trans>Create list</Trans>
            </Text>
          </CreateListButtonWrapper>
        </RowBetween>
      </CreateListWrapper>
    </SimpleTooltip>
  )
}

const generateNewListName = (number: number) => {
  const ordinalStrings: { [key: number]: string } = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th' }
  return `My ${ordinalStrings[number]} Watchlist`
}

export const ManageListModal = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) => {
  const { data } = useGetWatchlistInformationQuery()
  const watchlists = data?.watchlists || []
  const numberOfWatchlists = watchlists?.length || 0
  const dispatch = useDispatch()
  const [updateWatchlistsPriorities] = useUpdateCustomizedWatchlistsPrioritiesMutation()
  const reorderWrapperRef = useRef<HTMLDivElement>(null)
  const handleReorder = (newOrders: ICustomWatchlists[]) => {
    const orderedIds = newOrders.map(item => item.id).join(',')
    dispatch(
      kyberAIApi.util.updateQueryData('getWatchlistInformation', undefined, draft => {
        const order = orderedIds.split(',')
        draft.watchlists = draft.watchlists.sort((a, b) => {
          return order.indexOf(a.id.toString()) - order.indexOf(b.id.toString())
        })
        return draft
      }),
    )
    debounce(() => updateWatchlistsPriorities({ orderedIds }), 1000)
  }

  const onDismiss = () => setIsOpen(false)

  return (
    <Modal isOpen={isOpen} width="380px" onDismiss={onDismiss}>
      <ModalWrapper onClick={e => e.stopPropagation()}>
        <RowBetween>
          <Text>Manage Watchlists</Text>
          <ButtonAction onClick={onDismiss}>
            <X />
          </ButtonAction>
        </RowBetween>
        <CreateListInput watchlistsCount={numberOfWatchlists} watchlists={watchlists} />
        <ReorderWrapper ref={reorderWrapperRef}>
          <Reorder.Group axis="y" values={watchlists} onReorder={handleReorder}>
            <AnimatePresence>
              {watchlists?.map(item => (
                <WatchlistsItem
                  wrapperRef={reorderWrapperRef}
                  watchlistsCount={numberOfWatchlists}
                  key={item.id}
                  item={item}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </ReorderWrapper>
      </ModalWrapper>
    </Modal>
  )
}

function WatchlistButton({
  assetId,
  symbol,
  size,
  wrapperStyle,
}: {
  assetId?: string
  symbol?: string
  size?: number
  wrapperStyle?: CSSProperties
}) {
  const theme = useTheme()

  const mixpanelHandler = useMixpanelKyberAI()

  const [openMenu, setOpenMenu] = useState(false)
  const [openManageModal, setOpenManageModal] = useState(false)

  const { data } = useGetWatchlistInformationQuery()
  const watchlists = data?.watchlists || []

  const isReachMaxLimit = (data?.totalUniqueAssetNumber || 0) >= WATCHLIST_MAX_LIMIT
  const isWatched = !!assetId && !!watchlists && watchlists?.some(item => item.assetIds?.includes(+assetId))

  const [addToWatchlist] = useAddToWatchlistMutation()
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation()

  const ref = useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => {
    setOpenMenu(false)
  })

  const handleAddtoWatchlist = (id: number) => {
    if (id && assetId) {
      addToWatchlist({ userWatchlistId: id, assetId: +assetId })
      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_ADD_TOKEN_TO_WATCHLIST, {
        token_name: symbol?.toUpperCase(),
        option: 'add',
      })
    }
  }

  const handleRemoveFromWatchlist = (id: number) => {
    if (id && assetId) {
      removeFromWatchlist({ userWatchlistId: id, assetId: +assetId })
      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_ADD_TOKEN_TO_WATCHLIST, {
        token_name: symbol?.toUpperCase(),
        option: 'remove',
      })
    }
  }

  const onSelect = (watchlist: ICustomWatchlists, watched: boolean) => {
    watched ? handleRemoveFromWatchlist(watchlist.id) : handleAddtoWatchlist(watchlist.id)
  }

  const btnStar = (
    <MouseoverTooltip
      text={t`You can only watch up to ${WATCHLIST_MAX_LIMIT} tokens`}
      disableTooltip={isWatched || !isReachMaxLimit}
    >
      <StarWithAnimation
        stopPropagation
        loading={false}
        active={isWatched}
        onClick={() => {
          ;(isWatched || !isReachMaxLimit) && setOpenMenu(true)
        }}
        wrapperStyle={wrapperStyle}
        size={size}
      />
    </MouseoverTooltip>
  )

  return (
    <div onClick={e => e.stopPropagation()} ref={ref}>
      <Popover
        show={openMenu}
        style={{ backgroundColor: theme.tableHeader, borderRadius: '20px' }}
        content={
          <MenuWrapper>
            {watchlists?.map((watchlists: ICustomWatchlists) => {
              const watched = !!assetId && !!watchlists.assetIds && watchlists.assetIds.includes(+assetId)
              return (
                <MenuOption
                  key={watchlists.id}
                  onClick={() => {
                    onSelect(watchlists, watched)
                  }}
                >
                  <StarWithAnimation active={watched} size={16} />
                  {watchlists.name} ({watchlists.assetNumber})
                </MenuOption>
              )
            })}

            <Divider />
            <MenuOption
              justify="center"
              onClick={() => {
                setOpenManageModal(true)
                setOpenMenu(false)
              }}
            >
              <Icon id="assignment" size={20} /> <Trans>Manage Lists</Trans>
            </MenuOption>
          </MenuWrapper>
        }
        opacity={1}
        placement="bottom-start"
        noArrow={true}
      >
        {btnStar}
      </Popover>
      <ManageListModal isOpen={openManageModal} setIsOpen={setOpenManageModal} />
    </div>
  )
}

export default memo(WatchlistButton)
