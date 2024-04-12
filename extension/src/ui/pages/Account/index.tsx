import CHeader from '@/ui/components/CHeader';
import { FooterBackButton } from '@/ui/components/FooterBackButton';
import { Layout } from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AccountAdd from './Add';
import AccountCreate from './Create';
import AccountImport from './Import';
import AccountSwitch from './Switch';

export type Status = 'switch' | 'add' | 'import' | 'create';

const SendIndex = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>('switch');

  const statusBack = () => {
    if (status == 'import' || status == 'create') {
      setStatus('add');
    } else if (status == 'add') {
      setStatus('switch');
    } else {
      window.history.go(-1);
    }
  };

  return (
    <Layout className="h-full">
      <Header className=" border-white border-opacity-10">
        <CHeader />
      </Header>
      <Content style={{ backgroundColor: '#1C1919' }}>
        {status == 'switch' ? (
          <AccountSwitch setStatus={setStatus} />
        ) : status == 'add' ? (
          <AccountAdd setStatus={setStatus} />
        ) : status == 'import' ? (
          <AccountImport setStatus={setStatus} />
        ) : status == 'create' ? (
          <AccountCreate setStatus={setStatus} />
        ) : (
          <div>error</div>
        )}
      </Content>
      <FooterBackButton
        onClick={(e) => {
          statusBack();
        }}
      />
    </Layout>
  );
};

export default SendIndex;
