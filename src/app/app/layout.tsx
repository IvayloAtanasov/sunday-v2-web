'use client'

import { ConnectButton, darkTheme, getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider, http } from 'wagmi';
import {
  avalancheFuji
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import SiteHeader from '../landing/SiteHeader';
import WalletGate from '../components/WalletGate';
import s from '../landing/landing.module.css';
import Footer from '../components/Footer';
import '@rainbow-me/rainbowkit/styles.css';

// WalletConnect's connector is built as soon as the wagmi config is created, and
// its storage layer touches indexedDB - which doesn't exist on the server. Keep
// every WC-backed wallet out of the list during SSR; the browser gets them all.
const isBrowser = typeof window !== 'undefined';

const config = getDefaultConfig({
  appName: 'Sunday',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'sunday',
  chains: [
    avalancheFuji,
  ],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: isBrowser
        ? [injectedWallet, metaMaskWallet, coinbaseWallet, walletConnectWallet]
        : [injectedWallet],
    },
  ],
  ssr: true, // If your dApp uses server side rendering (SSR)
  transports: {
    [avalancheFuji.id]: http(
      'https://avalanche-fuji-c-chain-rpc.publicnode.com'
    )
  }
});
const queryClient = new QueryClient();

// Match the site's amber accent and squarer corners
const walletTheme = darkTheme({
  accentColor: '#f5a524',
  accentColorForeground: '#111111',
  borderRadius: 'small',
});

/**
 * The app shell. Everything wallet-aware lives here rather than at the root, so the
 * landing page does not pay for wagmi, RainbowKit and WalletConnect to render static
 * content - and the root layout can stay a server component.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={walletTheme}>
          {/* s.page: the site's dark background and tokens, independent of the OS colour scheme */}
          <div className={`${s.page} grid grid-rows-[auto_1fr_auto]`}>
            <SiteHeader>
              <ConnectButton />
            </SiteHeader>
            <main className="flex flex-col items-center sm:items-start p-8 pb-20 gap-16 sm:p-20">
              <WalletGate>{children}</WalletGate>
            </main>
            <Footer />
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
