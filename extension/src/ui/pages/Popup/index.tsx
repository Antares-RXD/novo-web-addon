import message from 'antd/lib/message';
import { lazy } from 'react';
// import 'default-passive-events'

const AsyncMainRoute = lazy(() => import('./MainRoute'));

message.config({
  maxCount: 1
});

function Popup() {
  return (
    <div className="h-200 w-125 bg-hard-black">
      <AsyncMainRoute />
    </div>
  );
}

export default Popup;
