import CHeader from '@/ui/components/CHeader';
import { FooterBackButton } from '@/ui/components/FooterBackButton';
import { copyToClipboard, useWallet } from '@/ui/utils';
import { Button, Input, Layout, message } from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type Status = '' | 'error' | 'warning' | undefined;

export default () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(true);

  const [mnemonic, setMnemonic] = useState('');
  const [status, setStatus] = useState<Status>('');
  const [error, setError] = useState('');
  const wallet = useWallet();
  const btnClick = async () => {
    try {
      const _res = await wallet.getMnemonics(password);
      setMnemonic(_res);
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
        <div className="flex flex-col items-center mx-auto mt-5 text-center justify-evenly w-95">
          <div className="flex items-center px-2 text-2xl font-semibold h-13">{t('Secret Recovery Phrase')}</div>
          {mnemonic == '' ? (
            <div className="flex flex-col items-center mx-auto text-center gap-3_75 justify-evenly w-95">
              <div className=" text-warn box w380">{t('Type your Paragon password')}</div>
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
                  {t('Show Secret Recovery Phrase')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center mx-auto text-center gap-3_75 justify-evenly w-95">
              <div className="text-base text-warn box w380">
                {t('This phrase is the ONLY way to')} <br />
                {t('recover your wallet')}. {t('Do NOT share it with anyone')}!
                <br /> ({t('click to copy')})
              </div>
              <div>{/* margin */} </div>
              <div
                className="p-5 font-semibold select-text box default text-4_5 w380 leading-6_5"
                onClick={(e) => {
                  copy(mnemonic);
                }}>
                {mnemonic}
              </div>
            </div>
          )}
        </div>
      </Content>
      <FooterBackButton />
    </Layout>
  );
};
