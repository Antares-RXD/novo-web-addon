import { useApproval, useWallet, useWalletRequest } from '@/ui/utils';
import { Button, Input, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const [, resolveApproval] = useApproval();

  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(true);

  const [run] = useWalletRequest(wallet.unlock, {
    onSuccess() {
      resolveApproval();
    },
    onError(err) {
      message.error(t('PASSWORD ERROR'));
    }
  });

  const btnClick = () => {
    run(password);
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && 'Enter' == e.key) {
      btnClick();
    }
  };

  useEffect(() => {
    if (password) {
      setDisabled(false);
    }
  }, [password]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center">
        <div className="flex justify-center mb-15 gap-x-4 w-70">
          {/* <img className="select-none w-15 h-12_5" src="./images/Diamond.svg" /> */}
          {/* <img src="./images/Paragon.svg" className="select-none" alt="" /> */}
          <img src="./images/Logo.svg" className="w-64 h-12 select-none" alt="" />
        </div>
        <div className="grid gap-5">
          <div className="text-2xl font-semibold text-center text-white">{t('Enter your password')}</div>
          <div>
            <Input.Password placeholder="Password" onChange={(e) => setPassword(e.target.value)} onKeyUp={(e) => handleOnKeyUp(e)} />
          </div>
          <div>
            <Button disabled={disabled} size="large" type="primary" className="font-semibold box w380 content" onClick={btnClick}>
              {t('Unlock')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
