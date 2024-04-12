import * as novo from "@paragon-wallet/novocore-lib";
import { EventEmitter } from "events";
const type = "Simple Key Pair";

export class SimpleKeyring extends EventEmitter {
  static type = type;
  type = type;
  network: "mainnet" | "testnet" = "mainnet";
  wallets: novo.PrivateKey[] = [];
  constructor(opts: any) {
    super();
    if (opts) {
      this.deserialize(opts);
    }
  }

  async serialize(): Promise<any> {
    return this.wallets.map((privateKey) => privateKey.toWIF());
  }

  async deserialize(opts: any) {
    let wifs = opts as string[];
    this.wallets = wifs.map((wif) => novo.PrivateKey.fromWIF(wif));
  }

  async addAccounts(n = 1) {
    const newWallets: novo.PrivateKey[] = [];
    for (let i = 0; i < n; i++) {
      newWallets.push(novo.PrivateKey.fromRandom());
    }
    this.wallets = this.wallets.concat(newWallets);
    const hexWallets = newWallets.map(({ publicKey }) =>
      publicKey.toAddress(this.network).toString()
    );
    return hexWallets;
  }

  async getAccounts() {
    return this.wallets.map(({ publicKey }) =>
      publicKey.toAddress(this.network).toString()
    );
  }

  async signTransaction(address: string, tx: novo.Transaction) {
    const privKey = this._getPrivateKeyFor(address);
    const sigtype = novo.crypto.Signature.SIGHASH_ALL;
    tx.inputs.forEach((input, inputIndex) => {
      const sig = new novo.Transaction.Signature({
        publicKey: privKey.toPublicKey(),
        prevTxId: input.prevTxId,
        outputIndex: input.outputIndex,
        inputIndex,
        signature: novo.Transaction.Sighash.sign(
          tx,
          privKey,
          sigtype,
          inputIndex,
          input.output.script,
          input.output.satoshisBN
        ),
        sigtype,
      });
      input.setScript(
        novo.Script.buildPublicKeyHashIn(
          sig.publicKey,
          sig.signature.toDER(),
          sig.sigtype
        )
      );
    });
    return tx;
  }

  async signMessage(address: string, message: string) {
    const privKey = this._getPrivateKeyFor(address);
    const sig = novo.Message.sign(message, privKey);
    return sig;
  }

  async verifyMessage(withAccount: string, message: string, sig: string) {
    return novo.Message.verify(message, withAccount, sig);
  }

  private _getPrivateKeyFor(address: string) {
    if (!address) {
      throw new Error("Must specify address.");
    }
    const wallet = this._getWalletForAccount(address);
    return wallet;
  }

  async exportAccount(address: string) {
    const wallet = this._getWalletForAccount(address);
    return wallet.toString();
  }

  removeAccount(address: string) {
    if (
      !this.wallets
        .map(({ publicKey }) => publicKey.toAddress(this.network).toString())
        .includes(address)
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }

    this.wallets = this.wallets.filter(
      ({ publicKey }) =>
        publicKey.toAddress(this.network).toString() !== address
    );
  }

  private _getWalletForAccount(address: string) {
    let wallet = this.wallets.find(
      ({ publicKey }) => publicKey.toAddress(this.network).toString() == address
    );
    if (!wallet) {
      throw new Error("Simple Keyring - Unable to find matching address.");
    }
    return wallet;
  }
}
