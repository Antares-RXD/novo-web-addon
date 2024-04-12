import { SimpleKeyring } from "@paragon-wallet/novo-simple-keyring";
import * as novo from "@paragon-wallet/novocore-lib";
const hdPathString = "m/44'/0'/0'/0";
const type = "HD Key Tree";

interface DeserializeOption {
  hdPath?: string;
  mnemonic?: string;
  activeIndexes?: number[];
}

export class HdKeyring extends SimpleKeyring {
  static type = type;

  type = type;
  mnemonic: string = null;
  phrase: string;
  network: "mainnet" | "testnet";

  hdPath = hdPathString;
  root: novo.HDPrivateKey = null;
  hdWallet?: novo.Mnemonic;
  wallets: novo.PrivateKey[] = [];
  private _index2wallet: Record<number, [string, novo.PrivateKey]> = {};
  activeIndexes: number[] = [];
  page = 0;
  perPage = 5;

  /* PUBLIC METHODS */
  constructor(opts: any) {
    super(null);
    this.deserialize(opts);
  }

  async serialize(): Promise<DeserializeOption> {
    return {
      mnemonic: this.mnemonic,
      activeIndexes: this.activeIndexes,
      hdPath: this.hdPath,
    };
  }

  async deserialize(_opts: any = {}) {
    let opts = _opts as DeserializeOption;
    this.wallets = [];
    this.mnemonic = null;
    this.root = null;
    this.hdPath = opts.hdPath || hdPathString;

    if (opts.mnemonic) {
      this.initFromMnemonic(opts.mnemonic);
    }

    if (opts.activeIndexes) {
      this.activeAccounts(opts.activeIndexes);
    }
  }

  initFromMnemonic(mnemonic: string) {
    this.mnemonic = mnemonic;
    this._index2wallet = {};

    this.hdWallet = novo.Mnemonic.fromString(mnemonic);
    this.root = this.hdWallet
      .toHDPrivateKey(this.phrase, this.network)
      .deriveChild(this.hdPath);
  }

  addAccounts(numberOfAccounts = 1) {
    if (!this.root) {
      this.initFromMnemonic(novo.Mnemonic.fromRandom().toString());
    }

    let count = numberOfAccounts;
    let currentIdx = 0;
    const newWallets: novo.PrivateKey[] = [];

    while (count) {
      const [, wallet] = this._addressFromIndex(currentIdx);
      if (this.wallets.includes(wallet)) {
        currentIdx++;
      } else {
        this.wallets.push(wallet);
        newWallets.push(wallet);
        this.activeIndexes.push(currentIdx);
        count--;
      }
    }

    const hexWallets = newWallets.map((w) => {
      return w.toAddress(this.network).toString();
    });

    return Promise.resolve(hexWallets);
  }

  activeAccounts(indexes: number[]) {
    const accounts: string[] = [];
    for (const index of indexes) {
      const [address, wallet] = this._addressFromIndex(index);
      this.wallets.push(wallet);
      this.activeIndexes.push(index);

      accounts.push(address);
    }

    return accounts;
  }

  getFirstPage() {
    this.page = 0;
    return this.__getPage(1);
  }

  getNextPage() {
    return this.__getPage(1);
  }

  getPreviousPage() {
    return this.__getPage(-1);
  }

  getAddresses(start: number, end: number) {
    const from = start;
    const to = end;
    const accounts: { address: string; index: number }[] = [];
    for (let i = from; i < to; i++) {
      const [address] = this._addressFromIndex(i);
      accounts.push({
        address,
        index: i + 1,
      });
    }
    return accounts;
  }

  async __getPage(increment: number) {
    this.page += increment;

    if (!this.page || this.page <= 0) {
      this.page = 1;
    }

    const from = (this.page - 1) * this.perPage;
    const to = from + this.perPage;

    const accounts: { address: string; index: number }[] = [];

    for (let i = from; i < to; i++) {
      const [address] = this._addressFromIndex(i);
      accounts.push({
        address,
        index: i + 1,
      });
    }

    return accounts;
  }

  async getAccounts() {
    return this.wallets.map((w) => {
      return w.toAddress(this.network).toString();
    });
  }

  getIndexByAddress(address: string) {
    for (const key in this._index2wallet) {
      if (this._index2wallet[key][0] === address) {
        return Number(key);
      }
    }
    return null;
  }

  private _addressFromIndex(i: number): [string, novo.PrivateKey] {
    if (!this._index2wallet[i]) {
      const child = this.root!.deriveChild(i);
      const privateKey = child.privateKey;
      const address = privateKey.toAddress(this.network).toString();
      this._index2wallet[i] = [address, privateKey];
    }

    return this._index2wallet[i];
  }
}
