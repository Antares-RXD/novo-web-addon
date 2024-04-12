import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalState } from '../state/state';

const CFooter = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useGlobalState('tab');
  const [hover, setHover] = useState('');

  return (
    <div className="grid w-full h-full grid-cols-3 text-2xl border-white bg-soft-black border-opacity-10">
      <div
        className={`cursor-pointer flex items-center justify-center h-full text-center ${tab == 'home' ? 'text-primary' : ''}`}
        onClick={(e) => {
          setTab('home');
        }}
        onMouseOver={(e) => {
          setHover('home');
        }}
        onMouseLeave={(e) => {
          setHover('');
        }}>
        <img src={`./images/wallet-solid${tab == 'home' ? '-active' : hover == 'home' ? '-hover' : ''}.svg`} alt="" className="h-6 drop-shadow-footer" />
      </div>
      {/* <div className={`cursor-pointer flex items-center justify-center h-full text-center ${panel == 'nft' ? 'text-primary' : ''}`}>
        <img src={`./images/list-solid${panel == 'nft' ? '-active' : ''}.svg`} alt="" />
      </div> */}
      <div
        className={`cursor-pointer flex items-center justify-center h-full text-center ${tab == 'history' ? 'text-primary' : ''}`}
        onClick={(e) => {
          setTab('history');
        }}
        onMouseOver={(e) => {
          setHover('transaction');
        }}
        onMouseLeave={(e) => {
          setHover('');
        }}>
        <img src={`./images/clock-solid${tab == 'history' ? '-active' : hover == 'history' ? '-hover' : ''}.svg`} alt="" className="h-6 drop-shadow-footer" />
      </div>
      <div
        className={`cursor-pointer flex items-center justify-center h-full text-center ${tab == 'settings' ? 'text-primary' : ''}`}
        onClick={(e) => {
          setTab('settings');
        }}
        onMouseOver={(e) => {
          setHover('settings');
        }}
        onMouseLeave={(e) => {
          setHover('');
        }}>
        <img src={`./images/gear-solid${tab == 'settings' ? '-active' : hover == 'settings' ? '-hover' : ''}.svg`} alt="" className="h-6 drop-shadow-footer" />
      </div>
    </div>
  );
};

export default CFooter;
