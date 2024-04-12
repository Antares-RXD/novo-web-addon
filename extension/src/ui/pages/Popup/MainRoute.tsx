import { HashRouter, Route, Routes } from 'react-router-dom';
import SetAccount from '../Account';
import Dashboard from '../Dashboard';
import Receive from '../Dashboard/Home/Receive';
import CreateMnemonics from '../Regist/CreateMnemonics';
import CreatePassword from '../Regist/CreatePassword';
import ImportMnemonics from '../Regist/ImportMnemonics';
import SendPage from '../Send';
import ChangeCurrency from '../Settings/ChangeCurrency';
import ChangeLanguage from '../Settings/ChangeLanguage';
import ChangePassword from '../Settings/ChangePassword';
import ExportMnemonics from '../Settings/ExportMnemonics';
import ExportPrivateKey from '../Settings/ExportPrivateKey';
import RemoveAccount from '../Settings/RemoveAccount';
import Unlock from '../Unlock';
import Sorthat from './Sorthat';
import Welcome from './Welcome';

const Main = () => {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Sorthat />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/create-mnemonics" element={<CreateMnemonics />} />
          <Route path="/import-mnemonics" element={<ImportMnemonics />} />
          <Route path="/create-password" element={<CreatePassword />} />
          <Route path="/unlock" element={<Unlock />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/receive" element={<Receive />} />
          <Route path="/send/index" element={<SendPage />} />
          <Route path="/settings/language" element={<ChangeLanguage />} />
          <Route path="/settings/currency" element={<ChangeCurrency />} />
          <Route path="/settings/password" element={<ChangePassword />} />
          <Route path="/settings/export-mnemonics" element={<ExportMnemonics />} />
          <Route path="/settings/export-privatekey" element={<ExportPrivateKey />} />
          <Route path="/settings/account" element={<SetAccount />} />
          <Route path="/settings/remove-account" element={<RemoveAccount />} />
        </Routes>
      </HashRouter>
    </>
  );
};

export default Main;
