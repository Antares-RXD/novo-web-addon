import { CURRENCIES } from '@/shared/constant';
import AccountSelect from '@/ui/components/AccountSelect';
import { AddressBar } from '@/ui/components/AddressBar';
import { useGlobalState } from '@/ui/state/state';
import { faArrowRightArrowLeft, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Statistic } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './index.less';
const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentAccount] = useGlobalState('currentAccount');
  const [accountAssets] = useGlobalState('accountAssets');
  const [currency] = useGlobalState('currency');
  const [exchangeRate] = useGlobalState('exchangeRate');
  const [accountBalance] = useGlobalState('accountBalance');

  const getCurrencyValueString = (usd_value) => {
    let value = 0;
    if (accountBalance) {
      if (currency == 'USD') {
        value = parseFloat(usd_value);
      } else {
        value = parseFloat(usd_value) * exchangeRate[currency];
      }
    }
    const symbol = CURRENCIES.find((v) => v.code == currency)?.symbol;
    return symbol + ' ' + value.toFixed(2);
  };
  return (
    <div className="flex flex-col items-center gap-5 mt-5 justify-evenly">
      <div>
        <AccountSelect />
      </div>
      <div className="flex items-center p-8 font-semibold text-11">
        <Statistic className="text-white" value={getCurrencyValueString(accountBalance?.usd_value)} valueStyle={{ fontSize: '2.75rem' }} />
      </div>
      <AddressBar />
      <div className="operator-container">
        <div
          className="operator-button"
          onClick={(e) => {
            navigate(`/receive?address=${'quires'}`);
          }}>
          <span>
            <FontAwesomeIcon icon={faQrcode} style={{ height: '1.1rem'}} className="text-soft-white" />
          </span>
          <span>{t('Receive')}</span>
        </div>
        <div
          className="operator-button"
          onClick={(e) => {
            navigate('/send/index');
          }}>
          <span>
            <FontAwesomeIcon icon={faArrowRightArrowLeft} style={{ height: '1.1rem' }} className="text-soft-white"/>
          </span>
          <span>{t('Send')}</span>
        </div>
      </div>
      <div className="mt-2">
        {accountAssets?.map((asset, index) => (
          <div className="p-6 box nobor w-116" key={index} style={{ backgroundColor: '#2A2626' }}>
            <div style={{ width: '3.2rem', height: '3.2rem' }}>
              <img src={`./images/${asset.name}.svg`} alt="" />
            </div>
            <div className="flex flex-col flex-grow" style={{ paddingLeft: '1.125rem', paddingRight: '1.125rem' }}>
              <div className="font-semibold">{Number(asset.amount)?.toLocaleString('en', { minimumFractionDigits: 4 })}</div>
              <div className="text-soft-white" style={{ fontSize: '1.125rem' }}>
                {asset.symbol}
              </div>
            </div>
            <div className="font-semibold">{getCurrencyValueString(asset.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
