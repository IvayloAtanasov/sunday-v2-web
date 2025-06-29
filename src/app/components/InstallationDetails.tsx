import { useEffect, useState } from 'react'
import { useReadContract, useAccount, useConfig, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions'
import { formatUnits, parseUnits } from 'ethers'
import { useForm } from 'react-hook-form'
import fundingVaultAbi from '../contracts/fundingVault.json';
import sunTokenAbi from '../contracts/sunToken.json';
import erc20Abi from '../contracts/erc20.json';

type FormData = {
  amount: number
}

// Note: could also be taken from vault
const EURC_ADDRESS = '0x5E44db7996c682E92a960b65AC713a54AD815c6B'

export default function InstallationDetails({ installation }: { installation: any }) {
  const [name, setName] = useState()
  const [description, setDescription] = useState()
  const [area, setArea] = useState()
  const [capacity, setCapacity] = useState()
  const [location, setLocation] = useState()

  const { isConnected, address: currentAddress } = useAccount()
  const wagmiConfig = useConfig()
  const { writeContractAsync } = useWriteContract()

  const { register, handleSubmit } = useForm<FormData>()

  const { data: assetTokenAddress } = useReadContract({
    address: installation.vaultAddress,
    abi: fundingVaultAbi,
    functionName: 'assetToken',
    args: []
  })

  const { data: uri } = useReadContract({
    address: assetTokenAddress as any,
    abi: sunTokenAbi,
    functionName: 'uri',
    args: [installation.tokenId]
  })

  const { data: targetFunding } = useReadContract({
    address: installation.vaultAddress,
    abi: fundingVaultAbi,
    functionName: 'targetFunding',
    args: []
  })

  const { data: redeemable } = useReadContract({
    address: installation.vaultAddress,
    abi: fundingVaultAbi,
    functionName: 'redeemable',
    args: []
  })

  const { data: maturity } = useReadContract({
    address: installation.vaultAddress,
    abi: fundingVaultAbi,
    functionName: 'maturity',
    args: []
  })

  const { data: borrower } = useReadContract({
    address: installation.vaultAddress,
    abi: fundingVaultAbi,
    functionName: 'borrower',
    args: []
  })

  const { data: oracleAddress } = useReadContract({
    address: installation.vaultAddress,
    abi: fundingVaultAbi,
    functionName: 'rebaseAdapterAddress',
    args: []
  })

  const { data: sunTokensBalance } = useReadContract({
    address: assetTokenAddress as any,
    abi: sunTokenAbi,
    functionName: 'balanceOf',
    args: [currentAddress, installation.tokenId]
  })

  useEffect(() => {
    console.log(uri)
    if (!uri) return

    const fetchMetadata = async () => {
      const metadata = await fetch(uri as string).then(res => res.json())
      // console.log(metadata)

      setName(metadata.name)
      setDescription(metadata.description)
      setArea(metadata.properties.area)
      setCapacity(metadata.properties.capacity)
      setLocation(metadata.properties.location)
    }

    fetchMetadata()
  }, [uri])

  const onSubmit = async (data: FormData) => {
    console.log('Investing:', data.amount)

    const amount = parseUnits(data.amount.toString(), 6)

    const approveTxHash = await writeContractAsync({
      address: EURC_ADDRESS, // EURC
      abi: erc20Abi,
      functionName: 'approve',
      args: [installation.vaultAddress, amount]
    })

    console.log(`Approve tx placed: ${approveTxHash}`)

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash: approveTxHash,
      confirmations: 1
    })

    console.log(`Approve tx receipt status: `, receipt.status)

    const erc1155data = '0x'
    const investTxHash = await writeContractAsync({
      address: installation.vaultAddress,
      abi: fundingVaultAbi,
      functionName: 'borrow',
      args: [amount, erc1155data]
    })

    console.log(`Invest tx placed: ${investTxHash}`)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{name}</h1>
      <div className="flex flex-col gap-8 md:flex-row md:gap-6">
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-bold">{installation.stationId}</h3>
          <p className="text-gray-400">{description}</p>
          <img
            src={installation.imageUrl}
            alt={installation.stationId}
            className="w-full h-64 object-cover rounded"
          />
          <p className="text-gray-400">Area: {area}</p>
          <p className="text-gray-400">Capacity: {capacity}</p>
          <p className="text-gray-400">Location: {location}</p>
          <div>
            <a href={uri as string || 'http://ipfs'} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
              View IPFS metadata
            </a>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {(typeof targetFunding === 'bigint') && <p className="text-gray-400">Target funding: {formatUnits(targetFunding, 6)} EURC</p>}
          {(typeof redeemable === 'bigint') && <p className="text-gray-400">Redeemable funds: {formatUnits(redeemable, 6)} EURC</p>}
          {(typeof maturity === 'bigint') && <p className="text-gray-400">Matures at: {new Date(Number(maturity * BigInt(1000))).toString()}</p>}
          {!!borrower && (
            <div>
              <a
                href={`https://testnet.snowtrace.io/address/${borrower}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                View Borrower
              </a>
            </div>
          )}
          {!!oracleAddress && (
            <div>
              <a
                href={`https://testnet.snowtrace.io/address/${oracleAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                View Oracle
              </a>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-bold">Invest</h3>
          {(typeof sunTokensBalance === 'bigint') && <p className="text-gray-400">Owned: {formatUnits(sunTokensBalance, 6)}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input
              type="number"
              {...register('amount', { required: true })}
              placeholder="Amount (EURC)"
              className="w-full border border-gray-300 rounded px-4 py-2 text-black"
            />
            <button
              type="submit"
              className={`w-full font-semibold py-2 px-4 rounded transition
                ${isConnected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                `}
              disabled={!isConnected}
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
