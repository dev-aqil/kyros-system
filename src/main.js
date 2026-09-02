import { readThetanutsMarket } from './thetanuts.js';
import { checkSuiTestnet, connectSuiTestnetWallet, sendSuiTestnetUsdc } from './sui.js';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Landmark,
  RefreshCw,
  Send,
  ShieldCheck,
  WalletCards,
  createIcons,
} from 'lucide';

const app = document.querySelector('#app');

const state = {
  market: null,
  marketError: '',
  network: null,
  networkError: '',
  wallet: null,
  payoutMessage: '',
  payoutError: '',
  selectedPlan: 'balanced',
  view: 'dashboard',
};

const plans = {
  balanced: { name: 'Balanced cover', premium: 404, strike: '$2,900', coverage: '$15,000', note: 'Recommended for this payment window.' },
  essential: { name: 'Essential cover', premium: 196, strike: '$2,700', coverage: '$12,500', note: 'Lower cost, with part of the budget still exposed.' },
};

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function icon(name) {
  return `<i data-lucide="${name}" aria-hidden="true"></i>`;
}

function render() {
  const plan = plans[state.selectedPlan];
  const marketLine = state.market
    ? `ETH ${money(state.market.ethUsd)} · ${state.market.activeOrders} active Base orders`
    : 'Base market data has not been refreshed.';
  const marketStatus = state.marketError
    ? `<p class="inline-error">${state.marketError} <button class="link-button" data-action="market">Try again</button></p>`
    : `<p class="sync-line"><span class="live-dot"></span>${marketLine}</p>`;
  const networkStatus = state.network
    ? `Sui testnet reachable, epoch ${state.network.epoch}`
    : state.networkError || 'Sui testnet has not been checked.';

  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#dashboard" data-action="dashboard" aria-label="Kyros dashboard">kyros<span>.</span></a>
      <div class="topbar-actions">
        <span class="network-chip">Base + Sui</span>
        <button class="wallet-connect" type="button" data-action="connect-wallet">${state.wallet ? 'Sui wallet connected' : 'Connect Sui wallet'} ${icon('wallet-cards')}</button>
      </div>
    </header>
    <main class="shell">
      <section class="hero">
        <p class="eyebrow">30-day payment plan</p>
        <div class="hero-heading">
          <div><h1>Know your payments are covered.</h1><p>Protect the USDC budget for contractor and supplier payments while your treasury stays invested.</p></div>
          <button class="button primary" type="button" data-action="protection">Review protection ${icon('arrow-right')}</button>
        </div>
      </section>

      <section class="budget-card" aria-labelledby="budget-title">
        <div class="card-heading"><div><p class="eyebrow">Due by 30 Sep</p><h2 id="budget-title">$15,000 payment budget</h2></div><span class="status protected">${icon('shield-check')} Protected</span></div>
        <div class="budget-grid">
          <div><p class="metric-label">${icon('wallet-cards')} Treasury held</p><p class="metric">$37,000 <span>ETH</span></p><p class="quiet">You keep exposure to ETH upside.</p></div>
          <div><p class="metric-label">${icon('circle-dollar-sign')} USDC ready now</p><p class="metric">$6,200 <span>USDC</span></p><p class="quiet">Available for immediate payments.</p></div>
          <div><p class="metric-label">${icon('shield-check')} Protection plan</p><p class="metric">${plan.coverage}</p><p class="quiet">${plan.name} through 30 Sep.</p></div>
        </div>
        <div class="coverage-bar" aria-label="The payment budget is fully protected"><span></span></div>
        <div class="rail-flow" aria-label="Kyros uses Base for price protection and Sui for recipient payouts"><span>${icon('landmark')} <b>Protect budget</b><small>Base · Thetanuts</small></span><i>${icon('arrow-right')}</i><span>${icon('send')} <b>Pay recipients</b><small>Sui · USDC</small></span></div>
        <div class="card-footer"><span>Coverage is designed for this payment window, not a single invoice.</span><button class="text-button" type="button" data-action="protection">Adjust plan</button></div>
      </section>

      <section class="section-grid">
        <article class="panel activity-panel"><div class="card-heading"><div><p class="eyebrow">${icon('calendar-days')} Scheduled payments</p><h2>Three recipients, one clear plan.</h2></div><button class="text-button" type="button" data-action="payout">View payouts</button></div>
          <ul class="payment-list">
            <li><span class="initials green">JM</span><span><strong>Jules Martin</strong><small>Design retainer · 20 Sep</small></span><b>$5,000</b></li>
            <li><span class="initials blue">TA</span><span><strong>Team Aurora</strong><small>Engineering support · 25 Sep</small></span><b>$6,500</b></li>
            <li><span class="initials amber">SP</span><span><strong>Studio Pixel</strong><small>Product sprint · 30 Sep</small></span><b>$3,500</b></li>
          </ul>
        </article>
        <article class="panel market-panel"><div class="card-heading"><div><p class="eyebrow">${icon('landmark')} Thetanuts on Base</p><h2>Price protection signal</h2></div><button class="icon-button" type="button" data-action="market" aria-label="Refresh Base market data">${icon('refresh-cw')}</button></div>
          <div class="market-price">${state.market ? money(state.market.ethUsd) : '—'} <span>ETH</span></div>
          ${marketStatus}
          <p class="small-copy">Market data is read-only. A real protection trade is shown to the treasury wallet for review and signature.</p>
        </article>
      </section>

      <section class="payout-banner"><div><span class="logo-mark">${icon('send')}</span><div><p class="eyebrow">Payout rail</p><h2>Send the final USDC payment through Sui.</h2><p>${networkStatus}</p></div></div><button class="button secondary" type="button" data-action="payout">Prepare payout ${icon('arrow-right')}</button></section>

      <p class="release-marker">release: kyros-001 · Testnet-first build</p>
    </main>
    <dialog class="dialog" id="protection-dialog" aria-labelledby="protection-title">
      <form method="dialog" class="dialog-card"><button class="close" value="cancel" aria-label="Close protection options">×</button><p class="eyebrow">Thetanuts protection quote</p><h2 id="protection-title">Protect the full payment window.</h2><p class="dialog-intro">Choose how much of the next 30 days of scheduled payments you want covered if ETH falls.</p>
        <fieldset class="plan-list"><legend>Protection level</legend>${Object.entries(plans).map(([key, item]) => `<label class="plan ${state.selectedPlan === key ? 'selected' : ''}"><input type="radio" name="plan" value="${key}" ${state.selectedPlan === key ? 'checked' : ''}/><span><strong>${item.name}</strong><small>Strike ${item.strike} · Covers up to ${item.coverage}</small></span><b>${money(item.premium)}<small>estimated premium</small></b></label>`).join('')}</fieldset>
        <div class="notice">${icon('shield-check')} This is a planning estimate. Kyros refreshes the live Thetanuts order before the treasury wallet signs anything.</div>
        <menu><button class="button ghost" value="cancel">Not now</button><button class="button primary" value="default" data-action="save-plan">Save protection plan</button></menu>
      </form>
    </dialog>
    <dialog class="dialog" id="payout-dialog" aria-labelledby="payout-title">
      <form method="dialog" class="dialog-card"><button class="close" value="cancel" aria-label="Close payout preparation">×</button><p class="eyebrow">Sui testnet payout</p><h2 id="payout-title">Prepare a recipient payment.</h2><p class="dialog-intro">A connected Sui wallet will review and sign the transfer. Kyros does not store keys or send funds on its own.</p>
        <label for="recipient">Recipient Sui address</label><input id="recipient" name="recipient" type="text" inputmode="text" spellcheck="false" autocomplete="off" placeholder="0x…" aria-describedby="recipient-help"/><p class="field-help" id="recipient-help">Use a testnet address for today’s payment test.</p>
        <label for="amount">Amount in test USDC</label><input id="amount" name="amount" type="text" inputmode="decimal" value="1" aria-describedby="amount-help"/><p class="field-help" id="amount-help">Testnet USDC only. Mainnet USDC cannot be used on Sui testnet.</p>
        ${state.payoutError ? `<p class="inline-error">${state.payoutError}</p>` : ''}
        ${state.payoutMessage ? `<p class="inline-error success-message">${state.payoutMessage}</p>` : ''}
        <menu><button class="button ghost" value="cancel">Cancel</button><button class="button primary" type="button" data-action="validate-payout">${state.wallet ? 'Sign test USDC transfer' : 'Connect wallet and sign'} ${icon('arrow-right')}</button></menu>
      </form>
    </dialog>
  `;

  document.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', handleAction);
  });
  document.querySelectorAll('input[name="plan"]').forEach((input) => {
    input.addEventListener('change', (event) => { state.selectedPlan = event.target.value; render(); document.querySelector('#protection-dialog').showModal(); });
  });
  createIcons({
    icons: { ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarDays, CircleDollarSign, Landmark, RefreshCw, Send, ShieldCheck, WalletCards },
  });
}

async function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (action === 'dashboard') return;
  if (action === 'protection') document.querySelector('#protection-dialog').showModal();
  if (action === 'payout') document.querySelector('#payout-dialog').showModal();
  if (action === 'connect-wallet') {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      state.wallet = await connectSuiTestnetWallet();
      state.network = await checkSuiTestnet();
      state.networkError = '';
    } catch (error) {
      state.networkError = error.message || 'Could not connect a Sui testnet wallet.';
    }
    render();
  }
  if (action === 'market') {
    const button = event.currentTarget;
    button.disabled = true;
    state.marketError = '';
    try { state.market = await readThetanutsMarket(); } catch { state.marketError = 'Could not reach Thetanuts market data. Check your connection and retry.'; }
    render();
  }
  if (action === 'save-plan') { state.view = 'dashboard'; }
  if (action === 'validate-payout') {
    event.preventDefault();
    const recipient = document.querySelector('#recipient');
    const amount = document.querySelector('#amount');
    state.payoutError = '';
    state.payoutMessage = '';
    if (!/^0x[0-9a-fA-F]{2,}$/.test(recipient.value.trim())) {
      state.payoutError = 'Enter a valid Sui testnet recipient address before continuing.';
      recipient.setAttribute('aria-invalid', 'true');
      recipient.focus();
      return;
    }
    try {
      if (!state.wallet) state.wallet = await connectSuiTestnetWallet();
      state.network = await checkSuiTestnet();
      const payment = await sendSuiTestnetUsdc({
        ...state.wallet,
        recipient: recipient.value.trim(),
        amount: amount.value.trim(),
      });
      state.networkError = '';
      state.payoutMessage = `Payment submitted to Sui testnet. Digest: ${payment.digest}`;
    } catch (error) {
      state.payoutError = error.message || 'The payment could not be prepared. Check your wallet, test USDC balance, and recipient address.';
    }
    render();
    document.querySelector('#payout-dialog').showModal();
  }
}

render();
