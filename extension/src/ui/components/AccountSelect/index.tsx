import { KEYRING_CLASS } from '@/shared/constant'
import { useGlobalState } from '@/ui/state/state'
import { shortAddress } from '@/ui/utils'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import './index.less'
const AccountSelect = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [currentAccount] = useGlobalState('currentAccount')

  return (
    <div
      className="px-5 account-select-container"
      onClick={(e) => {
        navigate('/settings/account')
      }}>
      <span className="icon-profile">
        <img src="./images/user-solid.svg" alt="" />
      </span>
      <div className="account">
        <div className='text-lg font-semibold whitespace-nowrap'>{shortAddress(currentAccount?.alianName, 8)}</div>
        {currentAccount?.type == KEYRING_CLASS.PRIVATE_KEY ? (
          <div className="rounded bg-primary-active py-1_25 px-2_5">
            <div className="text-xs font-medium">
              <span>IMPORTED</span>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
      <span className="icon-drop">
        <img src="./images/chevron-down-solid.svg" alt="" />
      </span>
    </div>
  )
}

export default AccountSelect
