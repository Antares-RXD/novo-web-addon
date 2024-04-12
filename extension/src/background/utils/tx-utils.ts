import * as novo from '@paragon-wallet/novocore-lib';
const Signature = novo.crypto.Signature;
export const sighashType = Signature.SIGHASH_ALL;
const P2PKH_UNLOCK_SIZE = 1 + 1 + 71 + 1 + 33;
const P2PKH_DUST_AMOUNT = 1;
export class TxComposer {
  tx: novo.Transaction;
  changeOutputIndex = -1;
  constructor(tx?: novo.Transaction) {
    this.tx = tx || new novo.Transaction();
  }

  static fromObject(composerObj: any) {
    const txObj = composerObj.tx;
    const tx = new novo.Transaction();
    txObj.inputs.forEach((v) => {
      tx.addInput(new novo.Transaction.Input(v));
    });
    txObj.outputs.forEach((v) => {
      tx.addOutput(new novo.Transaction.Output(v));
    });
    tx.nLockTime = txObj.nLockTime;
    tx.version = txObj.version;

    const txComposer = new TxComposer(tx);
    txComposer.changeOutputIndex = composerObj.changeOutputIndex;
    return txComposer;
  }

  getRawHex() {
    return this.tx.serialize(true);
  }

  getTx() {
    return this.tx;
  }
  getTxId() {
    return this.tx.id;
  }

  getInput(inputIndex: number) {
    return this.tx.inputs[inputIndex];
  }

  getOutput(outputIndex: number) {
    return this.tx.outputs[outputIndex];
  }

  appendP2PKHInput(utxo: { address: novo.Address; satoshis: number; txId: string; outputIndex: number }) {
    this.tx.addInput(
      new novo.Transaction.Input.PublicKeyHash({
        output: new novo.Transaction.Output({
          script: novo.Script.buildPublicKeyHashOut(utxo.address),
          satoshis: utxo.satoshis
        }),
        prevTxId: utxo.txId,
        outputIndex: utxo.outputIndex,
        script: novo.Script.empty()
      })
    );
    const inputIndex = this.tx.inputs.length - 1;
    return inputIndex;
  }

  appendInput(input: { txId: string; outputIndex: number; lockingScript?: novo.Script; satoshis?: number }) {
    this.tx.addInput(
      new novo.Transaction.Input({
        output: new novo.Transaction.Output({
          script: input.lockingScript,
          satoshis: input.satoshis
        }),
        prevTxId: input.txId,
        outputIndex: input.outputIndex,
        script: novo.Script.empty()
      })
    );
    const inputIndex = this.tx.inputs.length - 1;
    return inputIndex;
  }

  appendP2PKHOutput(output: { address: novo.Address; satoshis: number }) {
    this.tx.addOutput(
      new novo.Transaction.Output({
        script: new novo.Script(output.address),
        satoshis: output.satoshis
      })
    );
    const outputIndex = this.tx.outputs.length - 1;
    return outputIndex;
  }

  appendOutput(output: { lockingScript: novo.Script; satoshis: number }) {
    this.tx.addOutput(
      new novo.Transaction.Output({
        script: output.lockingScript,
        satoshis: output.satoshis
      })
    );
    const outputIndex = this.tx.outputs.length - 1;
    return outputIndex;
  }

  appendOpReturnOutput(opreturnData: any) {
    this.tx.addOutput(
      new novo.Transaction.Output({
        script: novo.Script.buildSafeDataOut(opreturnData),
        satoshis: 0
      })
    );
    const outputIndex = this.tx.outputs.length - 1;
    return outputIndex;
  }

  clearChangeOutput() {
    if (this.changeOutputIndex != -1) {
      this.tx.outputs.splice(this.changeOutputIndex, 1);
      this.changeOutputIndex = 0;
    }
  }
  appendChangeOutput(changeAddress: novo.Address, feeb = 8, extraSize = 0) {
    //Calculate the fee and determine whether to change
    //If there is change, it will be output in the last item
    const unlockSize = this.tx.inputs.filter((v) => v.output?.script.isPublicKeyHashOut()).length * P2PKH_UNLOCK_SIZE;
    const fee = Math.ceil((this.tx.toBuffer().length + unlockSize + extraSize + novo.Transaction.CHANGE_OUTPUT_MAX_SIZE) * feeb);

    const changeAmount = this.getUnspentValue() - fee;
    if (changeAmount >= P2PKH_DUST_AMOUNT) {
      this.changeOutputIndex = this.appendP2PKHOutput({
        address: changeAddress,
        satoshis: changeAmount
      });
    } else {
      this.changeOutputIndex = -1;
    }
    return this.changeOutputIndex;
  }

  unlockP2PKHInput(privateKey: novo.PrivateKey, inputIndex: number, sigtype = sighashType) {
    const tx = this.tx;
    const sig = new novo.Transaction.Signature({
      publicKey: privateKey.publicKey,
      prevTxId: tx.inputs[inputIndex].prevTxId,
      outputIndex: tx.inputs[inputIndex].outputIndex,
      inputIndex,
      signature: novo.Transaction.Sighash.sign(
        tx,
        privateKey,
        sigtype,
        inputIndex,
        (tx.inputs[inputIndex].output as novo.Transaction.Output).script,
        (tx.inputs[inputIndex].output as novo.Transaction.Output).satoshisBN
      ),
      sigtype
    });

    tx.inputs[inputIndex].setScript(novo.Script.buildPublicKeyHashIn(sig.publicKey, sig.signature.toDER(), sig.sigtype));
  }

  getUnspentValue() {
    const inputAmount = this.tx.inputs.reduce((pre, cur) => (cur.output as novo.Transaction.Output).satoshis + pre, 0);
    const outputAmount = this.tx.outputs.reduce((pre, cur) => cur.satoshis + pre, 0);

    const unspentAmount = inputAmount - outputAmount;
    return unspentAmount;
  }

  getFeeRate() {
    const unspent = this.getUnspentValue();
    const txSize = this.tx.toBuffer().length;
    return unspent / txSize;
  }
}
