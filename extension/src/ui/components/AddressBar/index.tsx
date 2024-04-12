import { KEYRING_CLASS } from '@/shared/constant';
import { useGlobalState } from '@/ui/state/state';
import { copyToClipboard, shortAddress } from '@/ui/utils';
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MouseEventHandler, useState } from 'react';
import { useTranslation } from 'react-i18next';
// import './index.less';
export const AddressBar: React.FC<{ onClick?: MouseEventHandler<HTMLElement> }> = ({ onClick }) => {
  const { t } = useTranslation();
  const [currentAccount] = useGlobalState('currentAccount');
  const [isCopied, setIsCopied] = useState(false);

  return (
    <>
      {isCopied ? (
        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded flex-nowrap bg-custom-green">
          {/* <FontAwesomeIcon className="check-icon h-4_5" icon={faCheck}/> */}
          <img src="./images/check.svg" className="h-4_5 w-4_5"/>
          <span className="text-lg">{t('copied')}</span>
        </div>
      ) : (
        <div
          className="flex items-center justify-center gap-2 px-4 py-2 rounded cursor-pointer flex-nowrap opacity-80 hover:opacity-100"
          onClick={(e) => {
            copyToClipboard(currentAccount?.address ?? '').then(() => {
              setIsCopied(true);
              setTimeout(() => {
                setIsCopied(false);
              }, 3000);
            });
          }}>
          <img src="./images/copy-solid.svg" alt="" className="h-4_5 hover:opacity-100"/>
          <span  className="text-lg text-white">{shortAddress(currentAccount?.address)}</span>
        </div>
      )}
    </>
  );
};
