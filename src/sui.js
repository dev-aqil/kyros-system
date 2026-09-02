import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';
import {
  SUI_TESTNET_CHAIN,
  signAndExecuteTransaction,
} from '@mysten/wallet-standard';
import { getWallets } from '@wallet-standard/app';

export const SUI_TESTNET_USDC =
  '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC';

const client = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
});

/** A network-only health check. It cannot sign or send a payment. */
export async function checkSuiTestnet() {
  const [chain, state] = await Promise.all([
    client.getChainIdentifier(),
    client.getCurrentSystemState(),
  ]);
  return {
    chain: chain.chainIdentifier,
    epoch: state.systemState.epoch,
    checkedAt: new Date(),
  };
}

function usdcToMist(amount) {
  if (!/^\d+(\.\d{1,6})?$/.test(amount)) {
    throw new Error('Enter a USDC amount with up to 6 decimal places.');
  }
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(`${whole}${fraction.padEnd(6, '0')}`);
}

/**
 * Wallet Standard gives the wallet, not Kyros, control over account access and
 * transaction signing. A browser wallet extension must be installed.
 */
export async function connectSuiTestnetWallet() {
  const wallet = getWallets().get().find((candidate) =>
    candidate.chains.includes(SUI_TESTNET_CHAIN),
  );
  if (!wallet) {
    throw new Error('No Sui testnet wallet was found. Install or unlock a Wallet Standard compatible Sui wallet.');
  }

  const connected = await wallet.features['standard:connect'].connect();
  const account = connected.accounts.find((candidate) =>
    candidate.chains.includes(SUI_TESTNET_CHAIN),
  );
  if (!account) {
    throw new Error('This wallet has no account enabled for Sui testnet. Switch the wallet to testnet and try again.');
  }
  return { wallet, account };
}

/**
 * Sends a Sui testnet USDC coin after the wallet displays its own confirmation.
 * A single sufficiently funded USDC coin is intentionally required for this
 * first payment flow, keeping testnet behavior clear and auditable.
 */
export async function sendSuiTestnetUsdc({ wallet, account, recipient, amount }) {
  const microUsdc = usdcToMist(amount);
  if (microUsdc <= 0n) throw new Error('The transfer amount must be greater than zero.');

  const coins = await client.listCoins({
    owner: account.address,
    coinType: SUI_TESTNET_USDC,
  });
  const sourceCoin = coins.objects.find((coin) => BigInt(coin.balance) >= microUsdc);
  if (!sourceCoin) {
    throw new Error('No single test USDC coin has enough balance. Request test USDC, then try a smaller amount.');
  }

  const transaction = new Transaction();
  const [paymentCoin] = transaction.splitCoins(transaction.object(sourceCoin.objectId), [microUsdc]);
  transaction.transferObjects([paymentCoin], recipient);

  return signAndExecuteTransaction(wallet, {
    account,
    chain: SUI_TESTNET_CHAIN,
    transaction,
  });
}
