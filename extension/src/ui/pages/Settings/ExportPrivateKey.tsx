import { KEYRING_TYPE } from '@/shared/constant';
import CHeader from '@/ui/components/CHeader';
import { FooterBackButton } from '@/ui/components/FooterBackButton';
import { useGlobalState } from '@/ui/state/state';
import { copyToClipboard, useWallet } from '@/ui/utils';
import { Button, Input, Layout, message } from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type Status = '' | 'error' | 'warning' | undefined;

export default () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(true);

  const [privateKey, setPrivateKey] = useState('');
  const [status, setStatus] = useState<Status>('');
  const [error, setError] = useState('');
  const wallet = useWallet();
  const [accountsList] = useGlobalState('accountsList');
  const [currentAccount] = useGlobalState('currentAccount');
  const btnClick = async () => {
    try {
      const account = await wallet.getCurrentAccount();
      const _res = await wallet.getPrivateKey(password, account);
      setPrivateKey(_res);
    } catch (e) {
      setStatus('error');
      setError((e as any).message);
    }
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key) {
      btnClick();
    }
  };

  useEffect(() => {
    setDisabled(true);
    if (password) {
      setDisabled(false);
      setStatus('');
      setError('');
    }
  }, [password]);

  function copy(str: string) {
    copyToClipboard(str).then(() => {
      message.success({
        duration: 3,
        content: t('copied')
      });
    });
  }
  return (
    <Layout className="h-full">
      <Header className="border-white  border-opacity-10">
        <CHeader />
      </Header>
      <Content style={{ backgroundColor: '#1C1919' }}>
        <div className="flex flex-col items-center mx-auto mt-5 justify-evenly w-95">
          <div className="flex items-center px-2 text-2xl font-semibold h-13">{t('Export Private Key')}</div>
          {privateKey == '' ? (
            <div className="flex flex-col items-center mx-auto text-center gap-3_75 justify-evenly w-95">
              <div className="text-warn box w380">{t('Type your Paragon password')}</div>
              <div className="mt-1_25">
                <Input.Password
                  className="box w380"
                  status={status}
                  placeholder={t('Password')}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  onKeyUp={(e) => handleOnKeyUp(e)}
                />
              </div>
              {error ? <div className="text-base text-error">{error}</div> : <></>}
              <div>
                <Button disabled={disabled} size="large" type="primary" className="box w380 content" onClick={btnClick}>
                  {t('Show Private Key')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 mx-auto text-center justify-evenly w-95">
              <div className="text-base text-soft-white">
                {t('If you ever change browsers or move computers')}, {t('you will need this Private Key to access this account')}.{t('Save it somewhere safe and secret')}.
              </div>
              <div
                className="grid w-full grid-cols-6 p-5 select-text box default hover text-4_5 leading-6_5"
                onClick={(e) => {
                  copy(privateKey);
                }}>
                <div className="flex items-center">
                  <img src="./images/copy-solid.svg" alt="" />
                </div>
                <div className="flex items-center col-span-5 overflow-hidden font-semibold text-soft-white overflow-ellipsis">{privateKey}</div>
              </div>
              {currentAccount?.type == KEYRING_TYPE.HdKeyring ? (
                <div className="text-soft-white -mt-2_5">
                  Derivation Path::m/44'/0'/0'/0/{accountsList.filter((v) => v.type == KEYRING_TYPE.HdKeyring).findIndex((v) => v.address == currentAccount?.address)}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Content>
      <FooterBackButton />
    </Layout>
  );
};
