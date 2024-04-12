import { KEYRING_CLASS } from '@/shared/constant';
import { useWallet } from '@/ui/utils';
import { Button, Input, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Status } from '.';

interface Props {
  setStatus(status: Status): void;
}

export default ({ setStatus }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const wallet = useWallet();

  const [alianName, setAlianName] = useState('');
  const [defaultName, setDefaultName] = useState('');
  const handleOnClick = async () => {
    if (wallet.checkHasMnemonic()) {
      await wallet.deriveNewAccountFromMnemonic(alianName || defaultName);
      message.success({
        content: t('Successfully created')
      });

      navigate('/dashboard');
    }
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key) {
      handleOnClick();
    }
  };

  const init = async () => {
    const accountName = await wallet.getNextAccountAlianName(KEYRING_CLASS.MNEMONIC);
    setDefaultName(accountName);
  };
  useEffect(() => {
    init();
  }, []);

  return (
    <div className="flex flex-col items-center mx-auto mt-5 gap-3_75 justify-evenly w-95">
      <div className="flex items-center px-2 text-2xl font-semibold h-13">{t('Create a new account')}</div>
      <Input
        className="font-semibold text-white mt-1_25 h-15_5 box default focus:active"
        placeholder={defaultName}
        onChange={(e) => {
          setAlianName(e.target.value);
        }}
        onKeyUp={(e) => handleOnKeyUp(e)}
      />
      <Button
        size="large"
        type="primary"
        className="box w380"
        onClick={(e) => {
          handleOnClick();
        }}>
        <div className="flex items-center justify-center text-lg font-semibold">{t('Create Account')}</div>
      </Button>
    </div>
  );
};
