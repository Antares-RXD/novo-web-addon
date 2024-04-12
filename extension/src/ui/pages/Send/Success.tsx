import { shortAddress } from '@/ui/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Status, Transaction } from './index';

interface Props {
  transaction: Transaction;
  fromAddress: string;
  toAddress: string;
  toAmount: number;
  setStatus(status: Status): void;
}

export default ({ transaction, fromAddress, toAddress, toAmount, setStatus }: Props) => {
  const { t } = useTranslation();
  const [result, setResult] = useState('sending');

  const sending = () => {
    return new Promise((resolve, reject) => {
      // sending
      setTimeout(() => {
        setResult('success');
      }, 3000);
    });
  };

  useEffect(() => {
    sending();
  }, []);

  useEffect(() => {
    if (result == 'sending') {
      // do something
    } else if (result == 'success') {
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [result]);

  return (
    <div className="flex flex-col items-center mx-auto mt-36 gap-2_5 w-110">
      <span className="w-24 h-24">
        <img src="./images/Success.svg" alt="" />
      </span>
      <span className="mt-6 text-2xl">{t('Payment Sent')}</span>
      <span className="text-soft-white">{t('Your transaction has been succesfully sent')}</span>
      <div className="justify-between w-full box nobor text-soft-white mt-2_5">
        <span>{shortAddress(toAddress)}</span>
        <div className="flex">
          <span className="font-semibold text-warn">-&nbsp;</span>
          <span className="font-semibold text-white">{transaction.changeAmount}</span>&nbsp;Novo
        </div>
      </div>
      <div className="flex items-center text-white opacity-60 hover:opacity-100">
        <img src="./images/eye.svg" alt="" />
        <a className="font-semibold text-white cursor-pointer hover:text-white" href={`https://novoexplorer.com/tx/${transaction.txid}`} target="_blank" rel="noreferrer">
          &nbsp;{t('View on Block Explorer')}
        </a>
      </div>
    </div>
  );
};
