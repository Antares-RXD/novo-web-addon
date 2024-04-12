import { KEYRING_CLASS } from '@/shared/constant';
import { useWallet } from '@/ui/utils';
import { Button, Input, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Status } from '.';

type InputStatus = '' | 'error' | 'warning' | undefined;

interface Props {
  setStatus(status: Status): void;
}

export default ({ setStatus }: Props) => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [privateKey, setPrivateKey] = useState('');
  const [inputError, setInputError] = useState('');
  const [inputStatus, setInputStatus] = useState<InputStatus>('');
  const [disabled, setDisabled] = useState(true);
  const { t } = useTranslation();
  const verify = async () => {
    try {
      const alianName = await wallet.getNextAccountAlianName(KEYRING_CLASS.PRIVATE_KEY);
      await wallet.importPrivateKey(privateKey, alianName);
      message.success({
        content: t('Successfully imported')
      });

      navigate('/dashboard');
    } catch (e) {
      setInputStatus('error');
      setInputError((e as any).message);
    }
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key) {
      verify();
    }
  };

  useEffect(() => {
    if (privateKey) {
      setDisabled(false);
      return;
    }
    setInputStatus('');
    setInputError('');
    setDisabled(true);
  }, [privateKey]);

  return (
    <div className="flex flex-col items-center mx-auto mt-5 gap-3_75 justify-evenly w-95">
      <div className="flex flex-col items-center px-2 text-2xl font-semibold">
        {t('Import Private Key')}
        <div className="text-base text-soft-white mt-2_5">{t('Imported accounts will not be associated with your originally created Paragon account Secret Recovery Phrase')}.</div>
      </div>
      <Input
        className="font-semibold text-white mt-1_25 h-15_5"
        status={inputStatus}
        placeholder={t('Private Key')}
        onKeyUp={(e) => handleOnKeyUp(e)}
        onChange={(e) => {
          setPrivateKey(e.target.value);
        }}
      />
      {inputError ? <div className="text-base text-error">{inputError}</div> : <></>}
      <Button
        disabled={disabled}
        size="large"
        type="primary"
        className="box w380"
        onClick={(e) => {
          verify();
        }}>
        <div className="flex items-center justify-center text-lg font-semibold">{t('Import Private Key')}</div>
      </Button>
    </div>
  );
};
