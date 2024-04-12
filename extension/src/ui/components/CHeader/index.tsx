import './index.module.less';

const CHeader = () => {
  return (
    <div className="flex items-center justify-between h-full">
      <div className="flex items-center justify-center flex-grow">
        {/* <img className="h-8 select-none w-9" src="./images/Diamond.svg" /> */}
        {/* <img src="./images/Paragon.svg" className="h-5 ml-3 select-none" alt="" /> */}
        <img src="./images/Logo-white.svg" className="h-8 select-none w-44" alt="" />
      </div>
      <div className="flex-grow-1"></div>
    </div>
  );
};

export default CHeader;
