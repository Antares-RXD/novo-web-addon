import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { Status } from '.';

interface Props {
  setStatus(status: Status): void;
}

export default ({ setStatus }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center mx-auto mt-5 gap-3_75 justify-evenly w-95">
      <div className="flex items-center px-2 text-2xl font-semibold h-13">{t('Add a new account')}</div>
      <Button
        size="large"
        type="default"
        className="mt-1_25 box w-115 default btn-settings"
        onClick={(e) => {
          setStatus('create');
        }}>
        <div className="flex items-center justify-between font-semibold text-4_5">
          <div className="flex flex-col text-left gap-2_5">
            <span>{t('Create a new account')}</span>
            <span className="font-normal opacity-60">{t('Generate a new address')}</span>
          </div>
          <div className="flex-grow"> </div>
          {/* <RightOutlined style={{transform: 'scale(1.2)', opacity: '80%'}}/> */}
        </div>
      </Button>

      <Button
        size="large"
        type="default"
        className="box w-115 default btn-settings"
        onClick={(e) => {
          setStatus('import');
        }}>
        <div className="flex items-center justify-between font-semibold text-4_5">
          <div className="flex flex-col text-left gap-2_5">
            <span>{t('Import Private Key')}</span>
            <span className="font-normal opacity-60">{t('Import an existing account')}</span>
          </div>
          <div className="flex-grow"> </div>
          {/* <RightOutlined style={{transform: 'scale(1.2)', opacity: '80%'}}/> */}
        </div>
      </Button>
    </div>
  );
};
