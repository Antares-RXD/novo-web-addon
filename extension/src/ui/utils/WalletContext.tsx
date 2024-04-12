import { AccountAsset } from '@/background/controller/wallet';
import { ContactBookItem, ContactBookStore } from '@/background/service/contactBook';
import { DisplayedKeryring } from '@/background/service/keyring';
import DisplayKeyring from '@/background/service/keyring/display';
import { ExchangeRate, NovoBalance, TxHistoryItem } from '@/background/service/openapi';
import { CacheState } from '@/background/service/pageStateCache';
import { Account } from '@/background/service/preference';
import * as novo from '@paragon-wallet/novocore-lib';
import React, { createContext, ReactNode, useContext } from 'react';
export type WalletController = {
  openapi?: {
    [key: string]: (...params: any) => Promise<any>;
  };

  boot(password: string): Promise<void>;
  isBooted(): Promise<boolean>;
  hasVault(): Promise<boolean>;
  verifyPassword(password: string): Promise<void>;
  changePassword: (password: string, newPassword: string) => Promise<void>;
  unlock(password: string): Promise<void>;
  isUnlocked(): Promise<boolean>;
  lockWallet(): Promise<void>;
  setPopupOpen(isOpen: boolean): void;
  isReady(): Promise<boolean>;

  getApproval: () =>
    | {
        state: number;
        params?: any;
        origin?: string | undefined;
        approvalComponent: string;
        requestDefer?: Promise<any> | undefined;
        approvalType: string;
      }
    | undefined;
  resolveApproval: (data?: any, forceReject?: boolean) => void;
  rejectApproval: (err?: string | undefined, stay?: boolean, isInternal?: boolean) => Promise<void>;

  openIndexPage(): Promise<number>;
  hasPageStateCache(): boolean;
  getPageStateCache(): CacheState;
  clearPageStateCache(): void;
  setPageStateCache(cache: CacheState): void;

  getAddressBalance(address: string): Promise<NovoBalance>;
  getAddressCacheBalance(address: string): Promise<NovoBalance>;

  getAddressHistory: (address: string) => Promise<TxHistoryItem[]>;
  getAddressCacheHistory: (address: string) => Promise<TxHistoryItem[]>;

  listChainAssets: (address: string) => Promise<AccountAsset[]>;
  getTransactionHistory: (address: string) => Promise<TxHistoryItem[]>;

  getLocale(): Promise<string>;
  setLocale(locale: string): Promise<void>;

  getExchangeRate(): Promise<ExchangeRate>;

  getCurrency(): Promise<string>;
  setCurrency(currency: string): Promise<void>;

  clearKeyrings(): Promise<void>;
  getPrivateKey(password: string, account: { address: string; type: string }): Promise<string>;
  getMnemonics(password: string): Promise<string>;
  importPrivateKey(data: string, alianName?: string): Promise<Account[]>;
  getPreMnemonics(): Promise<any>;
  generatePreMnemonic(): Promise<string>;
  removePreMnemonics(): void;
  createKeyringWithMnemonics(mnemonic: string): Promise<{ address: string; type: string }[]>;
  removeAddress(address: string, type: string): Promise<void>;
  resetCurrentAccount(): Promise<void>;
  generateKeyringWithMnemonic(mnemonic: string): number;
  checkHasMnemonic(): boolean;
  deriveNewAccountFromMnemonic(alianName?: string): Promise<string[]>;
  getAccountsCount(): Promise<number>;
  getTypedAccounts(type: string): Promise<DisplayedKeryring[]>;
  getAllVisibleAccounts(): Promise<DisplayedKeryring[]>;
  getAllAlianName: () => (ContactBookItem | undefined)[];
  getContactsByMap: () => ContactBookStore;
  getAllVisibleAccountsArray(): Promise<Account>;
  getAllClassAccounts(): Promise<DisplayedKeryring & { keyring: DisplayKeyring }[]>;
  updateAlianName: (address: string, name: string) => Promise<void>;

  changeAccount(account: Account): Promise<void>;
  getCurrentAccount(): Promise<Account>;
  getAccounts(): Promise<Account[]>;
  getNewAccountAlianName: (type: string) => Promise<string>;
  getNextAccountAlianName: (type: string) => Promise<string>;

  signTransaction(type: string, from: string, novoTx: novo.Transaction): Promise<novo.Transaction>;
  sendNovo(data: { to: string; amount: number }): Promise<{ fee: number; rawtx: string; toAmount: number }>;
  pushTx(rawtx: string): Promise<string>;
};

const WalletContext = createContext<{
  wallet: WalletController;
} | null>(null);

const WalletProvider = ({ children, wallet }: { children?: ReactNode; wallet: WalletController }) => <WalletContext.Provider value={{ wallet }}>{children}</WalletContext.Provider>;

const useWallet = () => {
  const { wallet } = useContext(WalletContext) as {
    wallet: WalletController;
  };

  return wallet;
};

export { WalletProvider, useWallet };
