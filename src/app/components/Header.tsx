'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

const Header = () => {
  return (
    <header className="w-full bg-gray-800 text-white p-4 shadow">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-xl font-bold">Sunday</h1>
        <ConnectButton />
      </div>
    </header>
  );
};

export default Header;
