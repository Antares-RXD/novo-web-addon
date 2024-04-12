import { CURRENCIES, KEYRING_TYPE, LANGS } from '@/shared/constant';
import { useGlobalState } from '@/ui/state/state';
import { shortAddress, useWallet } from '@/ui/utils';
import { RightOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { t } from 'i18next';
import VirtualList from 'rc-virtual-list';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigateFunction, useNavigate } from 'react-router-dom';

interface Setting {
  label?: string;
  value?: string;
  desc?: string;
  danger?: boolean;
  action: string;
  route: string;
  right: boolean;
  keyringType?: string;
}

const SettingList: Setting[] = [
  {
    label: t('Language'),
    value: t('English'),
    desc: '',
    action: 'language',
    route: 'language',
    right: true
  },
  {
    label: t('Currency'),
    value: 'US Dollar',
    desc: '',
    action: 'currency',
    route: 'currency',
    right: true
  },
  {
    label: t('Change Password'),
    value: t('Change your lockscreen password'),
    desc: '',
    action: 'password',
    route: 'password',
    right: true
  },
  {
    label: '',
    value: '',
    danger: true,
    desc: t('Remove Account'),
    action: 'remove-account',
    route: 'remove-account',
    right: false,
    keyringType: KEYRING_TYPE.SimpleKeyring
  },
  {
    label: '',
    value: '',
    desc: t('Show Secret Recovery Phrase'),
    action: 'export-mnemonics',
    route: 'export-mnemonics',
    right: false
  },
  {
    label: '',
    value: '',
    desc: t('Export Private Key'),
    action: 'export-privatekey',
    route: 'export-privatekey',
    right: false
  }
];

type MyItemProps = {
  key: number;
  item: Setting;
  navigate: NavigateFunction;
  currency: string;
};

const MyItem: React.FC<MyItemProps> = forwardRef(({ item, key, navigate, currency }, ref) => {
  return (
    <Button
      ref={ref as any}
      key={key}
      danger={item.danger}
      type={item.danger ? 'text' : 'default'}
      size="large"
      className={`mb-3_75 box w-115 ${item.danger ? item.danger : 'default'} ${item.right ? 'btn-settings' : ''}`}
      onClick={(e) => {
        navigate(`/settings/${item.route}`);
      }}>
      <div className="flex items-center justify-between font-semibold text-4_5">
        <div className="flex flex-col text-left gap-2_5">
          <span>{item.label}</span>
          <span className="font-normal opacity-60">{item.action == 'currency' ? (t(CURRENCIES.find((v) => v.code == currency)?.name || '') as string) : item.value}</span>
        </div>
        <div className="flex-grow">{item.desc}</div>
        {item.right ? <RightOutlined style={{ transform: 'scale(1.2)', color:'#AAA' }} /> : <></>}
      </div>
    </Button>
  );
});

export type ScrollAlign = 'top' | 'bottom' | 'auto';

export type ScrollConfig =
  | {
      index: number;
      align?: ScrollAlign;
      offset?: number;
    }
  | {
      key: React.Key;
      align?: ScrollAlign;
      offset?: number;
    };

export type ScrollTo = (arg: number | ScrollConfig) => void;

type ListRef = {
  scrollTo: ScrollTo;
};

export default () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const wallet = useWallet();
  const [editable, setEditable] = useState(false);
  const html = document.getElementsByTagName('html')[0];
  let virtualListHeight = 485;
  if (html && getComputedStyle(html).fontSize) {
    virtualListHeight = (virtualListHeight * parseFloat(getComputedStyle(html).fontSize)) / 16;
  }

  const [currentAccount] = useGlobalState('currentAccount');
  const [accountsList, setAccountsList] = useGlobalState('accountsList');
  const [currency] = useGlobalState('currency');
  const [locale] = useGlobalState('locale');

  const addressInput = useRef<any>(null);

  const handleChangeAlianName = () => {
    setEditable(true);
  };

  const [name, setName] = useState('');

  useEffect(() => {
    setName(currentAccount?.alianName ?? '');
  }, [currentAccount]);

  useEffect(() => {
    if (editable) {
      addressInput.current!.focus({ cursor: 'end' });
    }
  }, [editable]);

  const handleOnBlur = async (e) => {
    let alianName = currentAccount?.alianName ?? '';
    if (currentAccount && e.target.value) {
      alianName = e.target.value;
      await wallet.updateAlianName(currentAccount.address, alianName);
      currentAccount.alianName = alianName;
      const inListAccount = accountsList.find((v) => v.address == currentAccount.address);
      if (inListAccount) {
        inListAccount.alianName = alianName;
      }
      setAccountsList(accountsList);

      await wallet.changeAccount(currentAccount);
    }
    setName(alianName);
    setEditable(false);
  };

  const toRenderSettings = SettingList.filter((v) => {
    if (v.action == 'language') {
      v.value = t(LANGS.find((v) => v.value == locale)?.label || '');
    }
    if (v.keyringType) {
      if (currentAccount?.type == v.keyringType) {
        return true;
      }
    } else {
      return true;
    }
  });

  return (
    <div className="flex flex-col items-center h-full gap-5justify-evenly">
      <div className="mt-5">
        <div
          className={`grid items-center justify-center grid-cols-6 p-5 mt-5 h-15_5 box text-white border-0 border-white rounded-lg  hover w380 ${
            editable ? 'bg-primary-active border-opacity-60' : 'bg-soft-black border-opacity-20'
          }`}>
          {editable ? (
            <Input
              ref={addressInput}
              className="col-span-5 font-semibold rounded-none p0 hover hover:cursor-text disabled:color-soft-white"
              bordered={false}
              status="error"
              placeholder="Recipient’s NOVO address"
              defaultValue={name}
              onBlur={(e) => handleOnBlur(e)}
              onPressEnter={(e) => handleOnBlur(e)}
            />
          ) : (
            <span
              className="col-span-5 font-semibold p0 hover hover:cursor-text opacity-60"
              onClick={(e) => {
                handleChangeAlianName();
              }}>
              {name}
            </span>
          )}
          <div className={`flex items-center justify-end cursor-pointer hover:opacity-100 ${editable ? 'opacity-100' : 'opacity-60'}`}>
            <img
              className="w-4_5 h-4_5"
              src="./images/Name.svg"
              onClick={(e) => {
                setName('');
                handleChangeAlianName();
              }}
              title={t('Clear the inputted')}
            />
          </div>
        </div>

        <div className="w-full text-center text-soft-white mt-2_5">{shortAddress(currentAccount?.address || '')}</div>
      </div>
      <div className="h-121_25 mt-3_75">
        <VirtualList
          data={toRenderSettings}
          data-id="list"
          height={virtualListHeight}
          itemHeight={20}
          itemKey={(item) => item.action}
          style={{
            boxSizing: 'border-box'
          }}>
          {(item, index) => <MyItem key={index} navigate={navigate} item={item} currency={currency} />}
        </VirtualList>
      </div>
    </div>
  );
};
