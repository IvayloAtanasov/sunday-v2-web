'use client'

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import s from '../landing/landing.module.css';

/** Safety net in case wagmi never attempts a reconnect (e.g. reconnectOnMount turned off) */
const SETTLE_TIMEOUT_MS = 1500;

/**
 * Renders its children only once a wallet is connected; every `/app` page sits behind it.
 *
 * On load wagmi first reports "disconnected", then tries to restore the previous session
 * (status passes through connecting/reconnecting). Showing the prompt before that attempt has
 * finished would flash it at returning users, so until then a neutral placeholder is shown.
 */
export default function WalletGate({ children }: { children: React.ReactNode }) {
  const { status } = useAccount();
  const [settled, setSettled] = useState(false);
  const sawAttempt = useRef(false);

  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') sawAttempt.current = true;
    if (status === 'connected' || (status === 'disconnected' && sawAttempt.current)) setSettled(true);
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), SETTLE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (status === 'connected') return <>{children}</>;

  if (!settled) {
    return <div className={`${s.tokens} ${s.gate}`} aria-busy="true" />;
  }

  return (
    <div className={`${s.tokens} ${s.gate}`}>
      <div className={s.gateCard}>
        <p className={s.eyebrow}>Wallet required</p>
        <h1 className={s.gateTitle}>Connect a wallet to continue</h1>
        <p className={s.gateText}>
          Sunday runs onchain: your wallet is your account. Connect one to browse installations and
          see your positions.
        </p>
        <div className={s.gateActions}>
          <ConnectButton />
          <Link href="/" className={s.btnGhost}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
