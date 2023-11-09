import { Navigate, useParams } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

import CreatePool from './index'

const OLD_PATH_STRUCTURE = /^(0x[a-fA-F0-9]{40})-(0x[a-fA-F0-9]{40})$/
export default function RedirectCreatePool() {
  const { currencyIdA, currencyIdB } = useParams()

  const { networkInfo } = useActiveWeb3React()
  if (currencyIdA?.toLowerCase() === currencyIdB?.toLowerCase()) {
    return <Navigate to={`/${networkInfo.route}${APP_PATHS.CLASSIC_CREATE_POOL}/${currencyIdA}`} replace />
  }

  // Support old format
  const match = currencyIdA?.match(OLD_PATH_STRUCTURE)
  if (match?.length && !currencyIdB) {
    return <Navigate to={`/${networkInfo.route}${APP_PATHS.CLASSIC_CREATE_POOL}/${match[1]}/${match[2]}`} replace />
  }

  return <CreatePool />
}
