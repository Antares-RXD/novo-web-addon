import { createPersistStore } from '@/background/utils';
import { CHAINS_ENUM, INITIAL_OPENAPI_URL } from '@/shared/constant';

export type ExchangeRate = {
  EUR: number;
  JPY: number;
  GBP: number;
  CHF: number;
  CAD: number;
};

interface OpenApiStore {
  host: string;
  config?: {
    exchange_rate: ExchangeRate;
  };
}

export interface Chain {
  name: string;
  logo: string;
  enum: CHAINS_ENUM;
  network: string;
}

export interface NovoBalance {
  confirm_amount: string;
  pending_amount: string;
  amount: string;
  usd_value: string;
}

export interface TxHistoryItem {
  txid: string;
  time: number;
  date: string;
  amount: string;
  symbol: string;
  address: string;
}

const maxRPS = 100;

enum API_STATUS {
  FAILED = '0',
  SUCCESS = '1'
}

export class OpenApiService {
  store!: OpenApiStore;
  setHost = async (host: string) => {
    this.store.host = host;
    await this.init();
  };

  getHost = () => {
    return this.store.host;
  };

  getExchangeRate = () => {
    return this.store.config?.exchange_rate;
  };

  init = async () => {
    this.store = await createPersistStore({
      name: 'openapi',
      template: {
        host: INITIAL_OPENAPI_URL
      }
    });

    if (!process.env.DEBUG) {
      this.store.host = INITIAL_OPENAPI_URL;
    }

    const getConfig = async () => {
      try {
        this.store.config = await this.getWalletConfig();
      } catch (e) {
        setTimeout(() => {
          getConfig(); // reload openapi config if load failed 5s later
        }, 5000);
      }
    };
    getConfig();
  };

  httpGet = async (route: string, params: any) => {
    let url = this.store.host + route;
    let c = 0;
    for (const id in params) {
      if (c == 0) {
        url += '?';
      } else {
        url += '&';
      }
      url += `${id}=${params[id]}`;
      c++;
    }
    const headers = new Headers();
    headers.append('X-Client', 'Paragon');
    headers.append('X-Version', process.env.release!);
    const res = await fetch(new Request(url), { method: 'GET', headers, mode: 'cors', cache: 'default' });
    const data = await res.json();
    return data;
  };

  httpPost = async (route: string, params: any) => {
    const url = this.store.host + route;
    const headers = new Headers();
    headers.append('X-Client', 'Paragon');
    headers.append('X-Version', process.env.release!);
    headers.append('Content-Type', 'application/json;charset=utf-8');
    const res = await fetch(new Request(url), { method: 'POST', headers, mode: 'cors', cache: 'default', body: JSON.stringify(params) });
    const data = await res.json();
    return data;
  };

  async getWalletConfig(): Promise<{
    exchange_rate: ExchangeRate;
  }> {
    const data = await this.httpGet('/v1/wallet/config', {});
    if (data.status == API_STATUS.FAILED) {
      throw new Error(data.message);
    }
    return data.result;
  }

  async getAddressBalance(address: string): Promise<NovoBalance> {
    const data = await this.httpGet('/v1/address/balance', {
      address
    });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(data.message);
    }
    return data.result;
  }

  async getAddressUtxo(address: string): Promise<{ txId: string; outputIndex: number; satoshis: number }[]> {
    const data = await this.httpGet('/v1/address/utxo', {
      address
    });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(data.message);
    }
    return data.result;
  }

  async getAddressRecentHistory(address: string): Promise<TxHistoryItem[]> {
    const data = await this.httpGet('/v1/address/recent-history', {
      address
    });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(data.message);
    }
    return data.result;
  }

  async pushTx(rawtx: string): Promise<string> {
    const data = await this.httpPost('/v1/tx/broadcast', {
      rawtx
    });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(data.message);
    }
    return data.result;
  }
}

export default new OpenApiService();
