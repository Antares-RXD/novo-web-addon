import {
  contactBookService,
  keyringService,
  notificationService,
  openapiService,
  pageStateCacheService,
  permissionService,
  preferenceService,
  sessionService
} from '@/background/service';
import i18n from '@/background/service/i18n';
import { DisplayedKeryring, Keyring, KEYRING_CLASS } from '@/background/service/keyring';
import { CacheState } from '@/background/service/pageStateCache';
import { openIndexPage } from '@/background/webapi/tab';
import { BRAND_ALIAN_TYPE_TEXT, CHAINS_ENUM, COIN_NAME, COIN_SYMBOL, KEYRING_TYPE } from '@/shared/constant';
import { HdKeyring } from '@paragon-wallet/novo-hd-keyring';
import * as novo from '@paragon-wallet/novocore-lib';
import { Wallet } from '@paragon-wallet/novojs-wallet';
import { cloneDeep, groupBy } from 'lodash';
import { ContactBookItem } from '../service/contactBook';
import { NovoBalance, OpenApiService } from '../service/openapi';
import { ConnectedSite } from '../service/permission';
import { Account } from '../service/preference';
import { TxComposer } from '../utils/tx-utils';
import BaseController from './base';
const stashKeyrings: Record<string, Keyring> = {};

function novoToSatoshis(amount: number) {
  return Math.ceil(amount * 10000);
}

function satoshisToNovo(amount: number) {
  return amount / 10000;
}

export type AccountAsset = {
  name: string;
  symbol: string;
  amount: string;
  value: string;
};

export class WalletController extends BaseController {
  openapi: OpenApiService = openapiService;

  /* wallet */
  boot = (password) => keyringService.boot(password);
  isBooted = () => keyringService.isBooted();
  hasVault = () => keyringService.hasVault();
  verifyPassword = (password: string) => keyringService.verifyPassword(password);
  changePassword = (password: string, newPassword: string) => keyringService.changePassword(password, newPassword);
  getApproval = notificationService.getApproval;
  resolveApproval = notificationService.resolveApproval;
  rejectApproval = notificationService.rejectApproval;

  initAlianNames = async () => {
    await preferenceService.changeInitAlianNameStatus();
    const contacts = await this.listContact();
    const keyrings = await keyringService.getAllTypedAccounts();
    const catergoryGroupAccount = keyrings.map((item) => ({
      type: item.type,
      accounts: item.accounts
    }));
    if (keyrings.length > 0) {
      const catergories = groupBy(
        catergoryGroupAccount.filter((group) => group.type !== 'WalletConnect'),
        'type'
      );
      const result = Object.keys(catergories)
        .map((key) =>
          catergories[key].map((item) =>
            item.accounts.map((acc) => ({
              address: acc.address,
              type: key
            }))
          )
        )
        .map((item) => item.flat(1));
      result.forEach((group) =>
        group.forEach((acc, index) => {
          this.updateAlianName(acc?.address, `${BRAND_ALIAN_TYPE_TEXT[acc?.type]} ${index + 1}`);
        })
      );
    }
    if (contacts.length !== 0 && keyrings.length !== 0) {
      const allAccounts = keyrings.map((item) => item.accounts).flat();
      const sameAddressList = contacts.filter((item) => allAccounts.find((contact) => contact.address == item.address));
      if (sameAddressList.length > 0) {
        sameAddressList.forEach((item) => this.updateAlianName(item.address, item.name));
      }
    }
  };

  isReady = () => {
    if (contactBookService.store) {
      return true;
    } else {
      return false;
    }
  };

  unlock = async (password: string) => {
    const alianNameInited = preferenceService.getInitAlianNameStatus();
    const alianNames = contactBookService.listAlias();
    await keyringService.submitPassword(password);
    sessionService.broadcastEvent('unlock');
    if (!alianNameInited && alianNames.length === 0) {
      this.initAlianNames();
    }
  };
  isUnlocked = () => {
    return keyringService.memStore.getState().isUnlocked;
  };

  lockWallet = async () => {
    await keyringService.setLocked();
    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
  };
  setPopupOpen = (isOpen: boolean) => {
    preferenceService.setPopupOpen(isOpen);
  };
  openIndexPage = openIndexPage;

  hasPageStateCache = () => pageStateCacheService.has();
  getPageStateCache = () => {
    if (!this.isUnlocked()) return null;
    return pageStateCacheService.get();
  };
  clearPageStateCache = () => {
    pageStateCacheService.clear();
  };
  setPageStateCache = (cache: CacheState) => {
    pageStateCacheService.set(cache);
  };

  getAddressBalance = async (address: string) => {
    const data = await openapiService.getAddressBalance(address);
    preferenceService.updateAddressBalance(address, data);
    return data;
  };
  getAddressCacheBalance = (address: string | undefined): NovoBalance => {
    const defaultBalance: NovoBalance = {
      confirm_amount: '0',
      pending_amount: '0',
      amount: '0',
      usd_value: '0'
    };
    if (!address) return defaultBalance;
    return preferenceService.getAddressBalance(address) || defaultBalance;
  };

  getAddressHistory = async (address: string) => {
    const data = await openapiService.getAddressRecentHistory(address);
    preferenceService.updateAddressHistory(address, data);
    return data;
  };
  getAddressCacheHistory = (address: string | undefined) => {
    if (!address) return [];
    return preferenceService.getAddressHistory(address);
  };

  getExternalLinkAck = () => {
    preferenceService.getExternalLinkAck();
  };

  setExternalLinkAck = (ack) => {
    preferenceService.setExternalLinkAck(ack);
  };

  getLocale = () => {
    return preferenceService.getLocale();
  };

  setLocale = (locale: string) => {
    preferenceService.setLocale(locale);
  };

  getExchangeRate = () => this.openapi.getExchangeRate();

  getCurrency = () => {
    return preferenceService.getCurrency();
  };

  setCurrency = (currency: string) => {
    preferenceService.setCurrency(currency);
  };

  /* connectedSites */

  getConnectedSite = permissionService.getConnectedSite;
  getSite = permissionService.getSite;
  getConnectedSites = permissionService.getConnectedSites;
  setRecentConnectedSites = (sites: ConnectedSite[]) => {
    permissionService.setRecentConnectedSites(sites);
  };
  getRecentConnectedSites = () => {
    return permissionService.getRecentConnectedSites();
  };
  getCurrentSite = (tabId: number): ConnectedSite | null => {
    const { origin, name, icon } = sessionService.getSession(tabId) || {};
    if (!origin) {
      return null;
    }
    const site = permissionService.getSite(origin);
    if (site) {
      return site;
    }
    return {
      origin,
      name,
      icon,
      chain: CHAINS_ENUM.NOVO,
      isConnected: false,
      isSigned: false,
      isTop: false
    };
  };
  getCurrentConnectedSite = (tabId: number) => {
    const { origin } = sessionService.getSession(tabId) || {};
    return permissionService.getWithoutUpdate(origin);
  };
  setSite = (data: ConnectedSite) => {
    permissionService.setSite(data);
    if (data.isConnected) {
      sessionService.broadcastEvent(
        'chainChanged',
        {
          networkVersion: '0x01'
        },
        data.origin
      );
    }
  };
  updateConnectSite = (origin: string, data: ConnectedSite) => {
    permissionService.updateConnectSite(origin, data);
    sessionService.broadcastEvent(
      'chainChanged',
      {
        networkVersion: '0x01'
      },
      data.origin
    );
  };
  removeAllRecentConnectedSites = () => {
    const sites = permissionService.getRecentConnectedSites().filter((item) => !item.isTop);
    sites.forEach((item) => {
      this.removeConnectedSite(item.origin);
    });
  };
  removeConnectedSite = (origin: string) => {
    sessionService.broadcastEvent('accountsChanged', [], origin);
    permissionService.removeConnectedSite(origin);
  };
  getSitesByDefaultChain = permissionService.getSitesByDefaultChain;
  topConnectedSite = (origin: string) => {
    return permissionService.topConnectedSite(origin);
  };
  unpinConnectedSite = (origin: string) => {
    return permissionService.unpinConnectedSite(origin);
  };

  /* keyrings */

  clearKeyrings = () => keyringService.clearKeyrings();

  getPrivateKey = async (password: string, { address, type }: { address: string; type: string }) => {
    await this.verifyPassword(password);
    const keyring = await keyringService.getKeyringForAccount(address, type);
    if (!keyring) return null;
    return await keyring.exportAccount(address);
  };

  getMnemonics = async (password: string) => {
    await this.verifyPassword(password);
    const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC);
    const serialized = await keyring.serialize();
    const seedWords = serialized.mnemonic;

    return seedWords;
  };

  importPrivateKey = async (data: string, alianName?: string) => {
    const error = new Error(i18n.t('the private key is invalid'));
    try {
      const key = new novo.PrivateKey(data);
      if (key.toString() != data) {
        throw error;
      }
    } catch {
      throw error;
    }

    const keyring = await keyringService.importPrivateKey(data);
    const accounts = await keyring.getAccounts();
    if (alianName) this.updateAlianName(accounts[0], alianName);
    return this._setCurrentAccountFromKeyring(keyring, 0, alianName);
  };

  // json format is from "https://github.com/SilentCicero/ethereumjs-accounts"
  // or "https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition"
  // for example: https://www.myetherwallet.com/create-wallet
  importJson = async (content: string, password: string) => {
    try {
      JSON.parse(content);
    } catch {
      throw new Error(i18n.t('the input file is invalid'));
    }

    const wallet = await Wallet.fromV3(content, password);

    const privateKey = wallet.getPrivateKeyString();
    const keyring = await keyringService.importPrivateKey(privateKey);
    return this._setCurrentAccountFromKeyring(keyring);
  };

  getPreMnemonics = () => keyringService.getPreMnemonics();
  generatePreMnemonic = () => keyringService.generatePreMnemonic();
  removePreMnemonics = () => keyringService.removePreMnemonics();
  createKeyringWithMnemonics = async (mnemonic: string) => {
    const keyring = await keyringService.createKeyringWithMnemonics(mnemonic);
    keyringService.removePreMnemonics();
    return this._setCurrentAccountFromKeyring(keyring, 0);
  };

  removeAddress = async (address: string, type: string, brand?: string) => {
    await keyringService.removeAccount(address, type, brand);
    if (!(await keyringService.hasAddress(address))) {
      contactBookService.removeAlias(address);
    }
    preferenceService.removeAddressBalance(address);
    const current = preferenceService.getCurrentAccount();
    if (current?.address === address && current.type === type && current.brandName === brand) {
      this.resetCurrentAccount();
    }
  };

  resetCurrentAccount = async () => {
    const [account] = await this.getAccounts();
    if (account) {
      preferenceService.setCurrentAccount(account);
    } else {
      preferenceService.setCurrentAccount(null);
    }
  };

  generateKeyringWithMnemonic = (mnemonic: string) => {
    if (!novo.Mnemonic.isValid(mnemonic)) {
      throw new Error(i18n.t('mnemonic phrase is invalid'));
    }

    const Keyring = keyringService.getKeyringClassForType(KEYRING_CLASS.MNEMONIC);

    const keyring = new Keyring({ mnemonic });

    const stashId = Object.values(stashKeyrings).length;
    stashKeyrings[stashId] = keyring;

    return stashId;
  };

  addKyeringToStash = (keyring: Keyring) => {
    const stashId = Object.values(stashKeyrings).length;
    stashKeyrings[stashId] = keyring;

    return stashId;
  };

  addKeyring = async (keyringId: string) => {
    const keyring = stashKeyrings[keyringId];
    if (keyring) {
      await keyringService.addKeyring(keyring);
      this._setCurrentAccountFromKeyring(keyring);
    } else {
      throw new Error('failed to addKeyring, keyring is undefined');
    }
  };

  getKeyringByType = (type: string) => {
    return keyringService.getKeyringByType(type);
  };

  checkHasMnemonic = () => {
    try {
      const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC) as HdKeyring;
      return !!keyring.mnemonic;
    } catch (e) {
      return false;
    }
  };

  deriveNewAccountFromMnemonic = async (alianName?: string) => {
    const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC);

    const result = await keyringService.addNewAccount(keyring);
    if (alianName) this.updateAlianName(result[0], alianName);
    this._setCurrentAccountFromKeyring(keyring, -1, alianName);
    return result;
  };

  getAccountsCount = async () => {
    const accounts = await keyringService.getAccounts();
    return accounts.filter((x) => x).length;
  };

  getTypedAccounts = async (type: string) => {
    return Promise.all(keyringService.keyrings.filter((keyring) => !type || keyring.type === type).map((keyring) => keyringService.displayForKeyring(keyring)));
  };

  getAllVisibleAccounts = async (): Promise<DisplayedKeryring[]> => {
    const typedAccounts = await keyringService.getAllTypedVisibleAccounts();

    return typedAccounts.map((account) => ({
      ...account,
      keyring: account.keyring
    }));
  };

  getAllVisibleAccountsArray = async (): Promise<Account[]> => {
    const _accounts = await keyringService.getAllVisibleAccountsArray();
    const accounts: Account[] = [];
    _accounts.forEach((v) => {
      accounts.push({
        type: v.type,
        address: v.address,
        brandName: v.brandName,
        alianName: this.getAlianName(v.address)
      });
    });
    return accounts;
  };

  getAllClassAccounts = async () => {
    const typedAccounts = await keyringService.getAllTypedAccounts();

    return typedAccounts.map((account) => ({
      ...account,
      keyring: account.keyring
    }));
  };

  changeAccount = (account: Account) => {
    preferenceService.setCurrentAccount(account);
  };

  signTransaction = async (type: string, from: string, novoTx: novo.Transaction) => {
    const keyring = await keyringService.getKeyringForAccount(from, type);
    return keyringService.signTransaction(keyring, novoTx, from);
  };

  requestKeyring = (type: string, methodName: string, keyringId: number | null, ...params) => {
    let keyring;
    if (keyringId !== null && keyringId !== undefined) {
      keyring = stashKeyrings[keyringId];
    } else {
      try {
        keyring = this._getKeyringByType(type);
      } catch {
        const Keyring = keyringService.getKeyringClassForType(type);
        keyring = new Keyring();
      }
    }
    if (keyring[methodName]) {
      return keyring[methodName].call(keyring, ...params);
    }
  };

  getTransactionHistory = async (address: string) => {
    const result = await openapiService.getAddressRecentHistory(address);
    return result;
  };

  private _getKeyringByType = (type: string): Keyring => {
    const keyring = keyringService.getKeyringsByType(type)[0];

    if (keyring) {
      return keyring;
    }

    throw new Error(`No ${type} keyring found`);
  };

  addContact = (data: ContactBookItem) => {
    contactBookService.addContact(data);
  };

  updateContact = (data: ContactBookItem) => {
    contactBookService.updateContact(data);
  };

  removeContact = (address: string) => {
    contactBookService.removeContact(address);
  };

  listContact = (includeAlias = true) => {
    const list = contactBookService.listContacts();
    if (includeAlias) {
      return list;
    } else {
      return list.filter((item) => !item.isAlias);
    }
  };

  getContactsByMap = () => {
    return contactBookService.getContactsByMap();
  };

  getContactByAddress = (address: string) => {
    return contactBookService.getContactByAddress(address);
  };

  getNewAccountAlianName = async (type: string, index = 0) => {
    const sameTypeAccounts = await this.getTypedAccounts(type);
    let accountLength = 0;
    if (type == KEYRING_TYPE.HdKeyring) {
      if (sameTypeAccounts.length > 0) {
        accountLength = sameTypeAccounts[0]?.accounts?.length;
      }
    } else if (type == KEYRING_TYPE.SimpleKeyring) {
      accountLength = sameTypeAccounts.length;
    }
    if (index == 0) {
      index = accountLength;
    }
    const alianName = `${BRAND_ALIAN_TYPE_TEXT[type]} ${index}`;
    return alianName;
  };

  getNextAccountAlianName = async (type: string) => {
    const sameTypeAccounts = await this.getTypedAccounts(type);
    let accountLength = 0;
    if (type == KEYRING_TYPE.HdKeyring) {
      if (sameTypeAccounts.length > 0) {
        accountLength = sameTypeAccounts[0]?.accounts?.length;
      }
    } else if (type == KEYRING_TYPE.SimpleKeyring) {
      accountLength = sameTypeAccounts.length;
    }

    const alianName = `${BRAND_ALIAN_TYPE_TEXT[type]} ${accountLength + 1}`;
    return alianName;
  };

  private _setCurrentAccountFromKeyring = async (keyring: Keyring, index = 0, alianName?: string) => {
    const accounts = await keyring.getAccounts();
    const account = accounts[index < 0 ? index + accounts.length : index];

    if (!account) {
      throw new Error('the current account is empty');
    }

    alianName = alianName || this.getAlianName(account) || (await this.getNewAccountAlianName(keyring.type));

    const _account: Account = {
      address: account,
      type: keyring.type,
      brandName: keyring.type,
      alianName,
      index
    };
    preferenceService.setCurrentAccount(_account);

    return [_account];
  };

  getHighlightWalletList = () => {
    return preferenceService.getWalletSavedList();
  };

  updateHighlightWalletList = (list) => {
    return preferenceService.updateWalletSavedList(list);
  };

  getAlianName = (address: string) => {
    const contactName = contactBookService.getContactByAddress(address)?.name;
    return contactName;
  };

  updateAlianName = (address: string, name: string) => {
    contactBookService.updateAlias({
      name,
      address
    });
  };

  getAllAlianName = () => {
    return contactBookService.listAlias();
  };

  getInitAlianNameStatus = () => {
    return preferenceService.getInitAlianNameStatus();
  };

  updateInitAlianNameStatus = () => {
    preferenceService.changeInitAlianNameStatus();
  };

  getIsFirstOpen = () => {
    return preferenceService.getIsFirstOpen();
  };

  updateIsFirstOpen = () => {
    return preferenceService.updateIsFirstOpen();
  };

  listChainAssets = async (address: string) => {
    const balance = await openapiService.getAddressBalance(address);
    const assets: AccountAsset[] = [{ name: COIN_NAME, symbol: COIN_SYMBOL, amount: balance.amount, value: balance.usd_value }];
    return assets;
  };

  reportErrors = (error: string) => {
    console.error('report not implemented');
  };

  sendNovo = async ({ to, amount }: { to: string; amount: number }) => {
    const account = await preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const txComposer = new TxComposer();
    const utxos = await openapiService.getAddressUtxo(account.address);

    const network = 'mainnet';

    const accountAddress = new novo.Address(account.address, network);
    const receiverAddress = new novo.Address(to, network);
    utxos.forEach((utxo) => {
      txComposer.appendP2PKHInput({
        address: accountAddress,
        satoshis: utxo.satoshis,
        txId: utxo.txId,
        outputIndex: utxo.outputIndex
      });
    });
    const outputIndex = txComposer.appendP2PKHOutput({
      address: receiverAddress,
      satoshis: novoToSatoshis(amount)
    });
    txComposer.appendChangeOutput(accountAddress);

    const unlockSize = txComposer.getTx().inputs.length * 108;
    const fee = Math.ceil((txComposer.getTx().toBuffer().length + unlockSize) * 8);
    const leftAmount = txComposer.getUnspentValue();
    if (leftAmount < fee) {
      txComposer.getOutput(outputIndex).satoshis -= fee - leftAmount;
    }

    await this.signTransaction(account.type, account.address, txComposer.getTx());

    return {
      fee: satoshisToNovo(txComposer.getUnspentValue()),
      rawtx: txComposer.getRawHex(),
      toAmount: satoshisToNovo(txComposer.getOutput(outputIndex).satoshis)
    };
  };

  pushTx = async (rawtx: string) => {
    const txid = await this.openapi.pushTx(rawtx);
    return txid;
  };

  getAccounts = async () => {
    const accounts: Account[] = await keyringService.getAllVisibleAccountsArray();
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      account.alianName = this.getAlianName(account.address) || (await this.getNewAccountAlianName(account.type, i + 1));
    }

    return accounts;
  };

  getCurrentAccount = async () => {
    let account = preferenceService.getCurrentAccount();
    if (account) {
      const accounts = await this.getAccounts();
      const matchAcct = accounts.find((acct) => account!.address === acct.address);
      if (!matchAcct) account = undefined;
    }

    if (!account) {
      [account] = await this.getAccounts();
      if (!account) return null;
      preferenceService.setCurrentAccount(account);
    }

    return cloneDeep(account) as Account;
  };
}

export default new WalletController();
