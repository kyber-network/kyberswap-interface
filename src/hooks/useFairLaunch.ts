import { BigNumber } from 'ethers'
import { useCallback } from 'react'

import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { useFairLaunchRadingContract, useFairLaunchSigningContract } from 'hooks/useContract'
import { Farm, Reward } from 'state/farms/classic/types'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionExtraInfoHarvestFarm } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'
import { getFullDisplayBalance } from 'utils/formatBalance'

const getTransactionExtraInfo = (farm: Farm | null, farmRewards: Reward[]): TransactionExtraInfoHarvestFarm => {
  return {
    contract: farm?.id,
    tokenAddressIn: farm?.token0?.address,
    tokenAddressOut: farm?.token1?.address,
    tokenSymbolIn: farm?.token0?.symbol,
    tokenSymbolOut: farm?.token1?.symbol,
    rewards: farmRewards
      .filter(rw => rw.amount.toString() !== '0')
      .map(reward => ({
        tokenSymbol: reward.token.symbol ?? '',
        tokenAmount: getFullDisplayBalance(reward.amount, reward.token.decimals),
        tokenAddress: reward.token.address,
      })),
  }
}

const useFairLaunch = (address: string) => {
  const addTransactionWithType = useTransactionAdder()
  const fairLaunchContract = useFairLaunchSigningContract(address)
  const fairLaunchContractReading = useFairLaunchRadingContract(address)

  const getPoolLength = useCallback(async () => {
    try {
      const poolLength = await fairLaunchContractReading?.poolLength()

      return poolLength
    } catch (err) {
      console.error(err)
      return err
    }
  }, [fairLaunchContractReading])

  const getPoolInfo = useCallback(
    async (pid: number) => {
      try {
        const poolInfo = await fairLaunchContractReading?.getPoolInfo(pid)

        return poolInfo
      } catch (err) {
        console.error(err)
        return err
      }
    },
    [fairLaunchContractReading],
  )

  const getRewardTokens = useCallback(async (): Promise<string[]> => {
    try {
      const rewardTokens = await fairLaunchContractReading?.getRewardTokens()

      return rewardTokens
    } catch (err) {
      console.error(err)
      return []
    }
  }, [fairLaunchContractReading])

  // Deposit
  const deposit = useCallback(
    async (pid: number, amount: BigNumber, name: string, shouldHaverst = false) => {
      if (!fairLaunchContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await fairLaunchContract.estimateGas.deposit(pid, amount, shouldHaverst)
      const tx = await fairLaunchContract.deposit(pid, amount, shouldHaverst, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.STAKE,
        extraInfo: {
          tokenAddress: '',
          tokenSymbol: `${name} Tokens`,
          tokenAmount: getFullDisplayBalance(amount),
        },
      })

      return tx.hash
    },
    [addTransactionWithType, fairLaunchContract],
  )

  // Withdraw
  const withdraw = useCallback(
    async (pid: number, amount: BigNumber, name: string) => {
      if (!fairLaunchContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await fairLaunchContract.estimateGas.withdraw(pid, amount)
      const tx = await fairLaunchContract.withdraw(pid, amount, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.UNSTAKE,
        extraInfo: {
          tokenAddress: '',
          tokenSymbol: `${name} Tokens`,
          tokenAmount: getFullDisplayBalance(amount),
        },
      })

      return tx.hash
    },
    [addTransactionWithType, fairLaunchContract],
  )

  const harvest = useCallback(
    async (pid: number, farm: Farm, farmRewards: Reward[]) => {
      if (!fairLaunchContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await fairLaunchContract.estimateGas.harvest(pid)
      const tx = await fairLaunchContract.harvest(pid, {
        gasLimit: calculateGasMargin(estimateGas),
      })

      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.HARVEST,
        extraInfo: getTransactionExtraInfo(farm, farmRewards),
      })

      return tx.hash
    },
    [addTransactionWithType, fairLaunchContract],
  )

  const harvestMultiplePools = useCallback(
    async (pids: number[], farmRewards: Reward[]) => {
      if (!fairLaunchContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await fairLaunchContract.estimateGas.harvestMultiplePools(pids)
      const tx = await fairLaunchContract.harvestMultiplePools(pids, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.HARVEST,
        extraInfo: getTransactionExtraInfo(null, farmRewards),
      })

      return tx.hash
    },
    [addTransactionWithType, fairLaunchContract],
  )

  return {
    getPoolLength,
    getPoolInfo,
    getRewardTokens,
    deposit,
    withdraw,
    harvest,
    harvestMultiplePools,
  }
}

export default useFairLaunch
