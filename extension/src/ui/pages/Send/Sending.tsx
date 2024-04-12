import { LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export default () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center mx-auto text-6xl mt-60 gap-3_75 w-95 text-primary">
      <LoadingOutlined />
      <span className="text-2xl text-white">{t('Sending')}</span>
    </div>
  );
};
