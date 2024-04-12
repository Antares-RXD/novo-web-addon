import * as novocore from "..";
let run = () => {
  let privkey = novocore.PrivateKey.fromRandom();
  let addr = privkey.toAddress();
  console.log(addr);
};
run();
