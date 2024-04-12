import { CURRENCIES } from '@/shared/constant';
import CHeader from '@/ui/components/CHeader';
import { FooterBackButton } from '@/ui/components/FooterBackButton';
import { useGlobalState } from '@/ui/state/state';
import { useWallet } from '@/ui/utils';
import { Button, Layout } from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const wallet = useWallet();

  const [currency, setCurrency] = useGlobalState('currency');

  const onBtnSetCurrency = async (code: string) => {
    await wallet.setCurrency(code);
    setCurrency(code);
    window.history.go(-1);
  };

  return (
    <Layout className="h-full">
      <Header className="border-white  border-opacity-10">
        <CHeader />
      </Header>
      <Content style={{ backgroundColor: '#1C1919' }}>
        <div className="flex flex-col items-center mx-auto mt-5 gap-3_75 justify-evenly w-95">
          <div className="flex items-center px-2 text-2xl font-semibold h-13">{t('Currency')}</div>

          {CURRENCIES.map((v) => (
            <Button
              key={v.code}
              size="large"
              type="default"
              className="box w-115 default"
              onClick={(e) => {
                onBtnSetCurrency(v.code);
              }}>
              <div className="flex items-center justify-between text-base font-semibold">
                <div className="flex-grow text-left">{`${t(v.name)} (${v.code})`}</div>
                {currency == v.code ? (
                  <span className="w-4 h-4">
                    <img src="./images/check.svg" alt="" />
                  </span>
                ) : (
                  <></>
                )}
              </div>
            </Button>
          ))}
        </div>
      </Content>
      <FooterBackButton />
    </Layout>
  );
};
