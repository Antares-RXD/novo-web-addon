import { AccountAsset } from '@/background/controller/wallet';
import { ExchangeRate, NovoBalance, TxHistoryItem } from '@/background/service/openapi';
import { Account } from '@/background/service/preference';
import { createGlobalState } from 'react-hooks-global-state';

export type GlobalModelState = {
  newAccountMode: 'create' | 'import';
  accountsList: Account[];
  currentAccount?: Account;
  accountBalance: NovoBalance;
  accountAssets: AccountAsset[];
  accountHistory: TxHistoryItem[];
  currency: string;
  exchangeRate: ExchangeRate;
  locale: string;
  tab: 'home' | 'history' | 'settings';
};

// app state
const initialState: GlobalModelState = {
  newAccountMode: 'create',
  accountsList: [],
  currentAccount: undefined,
  accountBalance: {
    confirm_amount: '0',
    pending_amount: '0',
    amount: '',
    usd_value: '0'
  },
  accountAssets: [],
  accountHistory: [],
  currency: 'USD',
  exchangeRate: {
    EUR: 1,
    JPY: 1,
    GBP: 1,
    CHF: 1,
    CAD: 1
  },
  locale: 'English',
  tab: 'home'
};

export const { useGlobalState, getGlobalState, setGlobalState } = createGlobalState(initialState);
