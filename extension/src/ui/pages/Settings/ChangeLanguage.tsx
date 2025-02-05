import { LANGS } from '@/shared/constant';
import CHeader from '@/ui/components/CHeader';
import { FooterBackButton } from '@/ui/components/FooterBackButton';
import { useGlobalState } from '@/ui/state/state';
import { useWallet } from '@/ui/utils';
import i18n, { addResourceBundle } from '@/ui/utils/i18n';
import { Button, Layout } from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
export default () => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const navigate = useNavigate();
  const [locale, setLocale] = useGlobalState('locale');

  const handleSwitchLang = async (value: string) => {
    await wallet.setLocale(value);
    setLocale(value);
    await addResourceBundle(value);
    i18n.changeLanguage(value);
    navigate('/dashboard');
    window.location.reload();
  };

  return (
    <Layout className="h-full">
      <Header className="border-white border-opacity-10">
        <CHeader />
      </Header>
      <Content style={{ backgroundColor: '#1C1919' }}>
        <div className="flex flex-col items-center mx-auto mt-5 gap-3_75 justify-evenly w-95">
          <div className="flex items-center px-2 text-2xl font-semibold h-13">{t('Language')}</div>
          {LANGS.map((item, index) => {
            return (
              <Button
                key={index}
                size="large"
                type="default"
                className="box w-115 default"
                onClick={() => {
                  handleSwitchLang(item.value);
                }}>
                <div className="flex items-center justify-between text-base font-semibold">
                  <div className="flex-grow text-left">{t(item.label)}</div>
                  {item.value == locale ? (
                    <span className="w-4 h-4">
                      <img src="./images/check.svg" alt="" />
                    </span>
                  ) : (
                    <></>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </Content>
      <FooterBackButton />
    </Layout>
  );
};
