import { ethers } from 'ethers';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';

const BASE_MAINNET_CHAIN_ID = 8453;
const BASE_RPC_URL = 'https://mainnet.base.org';

/**
 * This intentionally creates a read-only client. Kyros never receives a
 * private key; an eventual trade must be signed by the treasury wallet.
 */
export async function readThetanutsMarket() {
  const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  const client = new ThetanutsClient({
    chainId: BASE_MAINNET_CHAIN_ID,
    provider,
  });

  const [market, orders] = await Promise.all([
    client.api.getMarketData(),
    client.api.fetchOrders(),
  ]);

  return {
    ethUsd: Number(market.prices.ETH),
    btcUsd: Number(market.prices.BTC),
    activeOrders: orders.length,
    checkedAt: new Date(),
  };
}
