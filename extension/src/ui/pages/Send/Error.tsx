import { useTranslation } from 'react-i18next';
import { Status, Transaction } from './index';

interface Props {
  transaction: Transaction;
  fromAddress: string;
  toAmount: number;
  setStatus(status: Status): void;
}

export default ({ transaction, fromAddress, toAmount, setStatus }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center mx-auto mt-36 gap-2_5 w-110">
      <img src="./images/Delete.svg" alt="" />
      <span className="mt-6 text-2xl">{t('Payment Faild')}</span>
      <span className="text-error">{t('Your transaction had not succesfully sent')}</span>
    </div>
  );
};
