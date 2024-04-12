import { COIN_DUST } from '@/shared/constant';
import CHeader from '@/ui/components/CHeader';
import { FooterBackButton } from '@/ui/components/FooterBackButton';
import { useGlobalState } from '@/ui/state/state';
import { isValidAddress, sleep, useWallet } from '@/ui/utils';
import { Layout, message } from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SendConfirm from './Confirm';
import SendCreate from './Create';
import Error from './Error';
import Sending from './Sending';
import Success from './Success';

export interface Transaction {
  rawtx: string;
  txid: string;
  changeAmount: number;
  toAddress: string;
  toAmount: number;
}

export type Status = 'create' | 'confirm' | 'sending' | 'success' | 'error';

const SendIndex = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentAccount] = useGlobalState('currentAccount');

  const [fromAddress, setFromAddress] = useState(currentAccount?.address || '');
  const [accountBalance] = useGlobalState('accountBalance');
  const [toAddress, setToAddress] = useState('');
  const [toAmount, setToAmount] = useState(0);
  const [fee, setFee] = useState(0);
  const wallet = useWallet();
  const ref = useRef<Transaction>({
    rawtx: '',
    txid: '',
    changeAmount: 0,
    toAddress: '',
    toAmount: 0
  });

  const refTmp = useRef<{ jobId: number }>({
    jobId: 0
  });

  const [status, setStatus] = useState<Status>('create');
  const [error, setError] = useState('');

  const sendTx = useCallback(async () => {
    try {
      setStatus('sending');
      const txid = await wallet.pushTx(ref.current.rawtx);
      ref.current.txid = txid;
      await sleep(3);
      setStatus('success');
    } catch (e) {
      message.error((e as any).message);
      setStatus('error');
    }
  }, [ref.current.rawtx]);

  useEffect(() => {
    setError('');
    if (!isValidAddress(toAddress)) {
      return;
    }
    if (toAmount <= COIN_DUST || toAmount > parseFloat(accountBalance.amount)) {
      return;
    }
    const run = async () => {
      if (!isValidAddress(toAddress)) {
        setError('Invalid address');
        return;
      }
      if (toAmount < COIN_DUST || toAmount > parseFloat(accountBalance.amount)) {
        setError('Invalid amount');
        return;
      }
      if (toAddress == ref.current.toAddress && toAmount == ref.current.toAmount) {
        //Prevent repeated triggering caused by setAmount
        return;
      }

      const jobId = ++refTmp.current.jobId;
      setTimeout(async () => {
        if (jobId != refTmp.current.jobId) return;
        const result = await wallet.sendNovo({ to: toAddress, amount: toAmount });
        setFee(result.fee);
        setToAmount(result.toAmount);
        ref.current.rawtx = result.rawtx;
        ref.current.changeAmount = (fromAddress == toAddress ? 0 : toAmount) + result.fee;
        ref.current.toAddress = toAddress;
        ref.current.toAmount = result.toAmount;
      }, 200);
    };

    run();
  }, [toAddress + toAmount]);

  return (
    <Layout className="h-full">
      <Header className=" border-white border-opacity-10">
        <CHeader />
      </Header>
      <Content style={{ backgroundColor: '#1C1919' }}>
        {status == 'create' ? (
          <SendCreate
            transaction={ref.current}
            fee={fee}
            setToAddress={setToAddress}
            setToAmount={setToAmount}
            setStatus={setStatus}
            toAddress={toAddress}
            toAmount={toAmount}
            setError={setError}
            error={error}
          />
        ) : status == 'confirm' ? (
          <SendConfirm transaction={ref.current} fromAddress={fromAddress} toAddress={toAddress} toAmount={toAmount} fee={fee} setStatus={setStatus} sendTx={sendTx} />
        ) : status == 'sending' ? (
          <Sending />
        ) : status == 'success' ? (
          <Success transaction={ref.current} fromAddress={fromAddress} toAddress={toAddress} toAmount={toAmount} setStatus={setStatus} />
        ) : (
          <Error transaction={ref.current} fromAddress={fromAddress} toAmount={toAmount} setStatus={setStatus} />
        )}
      </Content>
      {status !== 'sending' ? (
        <FooterBackButton
          onClick={(e) => {
            if (status == 'create') {
              window.history.go(-1);
            } else if (status == 'confirm') {
              setStatus('create');
            } else if (status == 'success') {
              window.history.go(-1);
            } else {
              setStatus('create');
            }
          }}
        />
      ) : (
        <></>
      )}
    </Layout>
  );
};

export default SendIndex;
