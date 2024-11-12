<script lang="ts">
	import { connectModal, wagmiAdapter, walletState } from '$lib/wallet.svelte';
	import { pegasysApi } from '../services/pegasys-api';
	import { Contract, parseEther, parseUnits } from 'ethers';
	import { type SwapQuote } from '../app';
	import { FeeAmount, Pool, Route, type SwapOptions, SwapRouter, Trade } from '@pollum-io/v3-sdk';
	import { CurrencyAmount, Percent, Token, TradeType } from '@pollum-io/sdk-core';
	import { getEthersSigner } from '../utils/ethers-adapter';
	import { erc20Abi, formatEther } from 'viem';
	import { readContract, switchChain } from '@wagmi/core';

	const ROUTER_ADDRESS = '0xd93c60A8E0F53361524698Cce1BBb65E080b8976';

	let suprBalance = $state('0');
	let inputAmount = $state(0);
	let quoteData = $state<SwapQuote | null>(null);
	let status = $state('idle');

	const inputToken = {
		symbol: 'SUPR',
		address: '0x3390108E913824B8eaD638444cc52B9aBdF63798',
		decimals: 18
	};

	const outputToken = {
		symbol: 'WSYS',
		address: '0x4200000000000000000000000000000000000006',
		decimals: 18
	};

	async function getQuote() {
		status = 'Getting a quote...';

		const quoteResponse = await pegasysApi.get<SwapQuote>('/quote', {
			params: {
				protocols: 'v1,v3,mixed',
				tokenInAddress: inputToken.address,
				tokenInChainId: 570,
				tokenOutAddress: outputToken.address,
				tokenOutChainId: 570,
				amount: parseEther(inputAmount.toString()).toString(),
				type: 'exactIn'
			}
		});

		quoteData = quoteResponse.data;

		status = 'idle';
	}

	async function handleSwap(e: Event) {
		try {
			status = 'Preparing swap...';

			e.preventDefault();

			await switchChain(wagmiAdapter.wagmiConfig, {
				chainId: 570
			});

			if (!quoteData) return;

			const signer = await getEthersSigner(wagmiAdapter.wagmiConfig);

			const liquidity = quoteData.route[0][0].liquidity;
			const sqrtPriceX96 = quoteData.route[0][0].sqrtRatioX96;
			const tick = quoteData.route[0][0].tickCurrent;

			const tokenIn = new Token(570, inputToken.address, inputToken.decimals, inputToken.symbol);
			const tokenOut = new Token(
				570,
				outputToken.address,
				outputToken.decimals,
				outputToken.symbol
			);

			const pool = new Pool(
				tokenIn,
				tokenOut,
				FeeAmount.MEDIUM,
				sqrtPriceX96,
				liquidity,
				Number(tick)
			);

			const swapRoute = new Route([pool], tokenIn, tokenOut);

			const tokenInContract = new Contract(tokenIn.address, erc20Abi, signer);

			const allowance = await tokenInContract.allowance(walletState.value.account!, ROUTER_ADDRESS);

			if (allowance < parseEther(inputAmount.toString())) {
				status = 'Approving...';

				const approveTx = await tokenInContract.approve(
					ROUTER_ADDRESS,
					parseEther(inputAmount.toString())
				);

				await approveTx.wait();
			}

			status = 'Swapping...';

			const trade = Trade.createUncheckedTrade({
				route: swapRoute,
				inputAmount: CurrencyAmount.fromRawAmount(
					tokenIn,
					parseEther(inputAmount.toString()).toString()
				),
				outputAmount: CurrencyAmount.fromRawAmount(tokenOut, quoteData.quote),
				tradeType: TradeType.EXACT_INPUT
			});

			const options: SwapOptions = {
				slippageTolerance: new Percent(50, 10_000),
				deadline: Math.floor(Date.now() / 1000) + 60 * 20,
				recipient: walletState.value.account!
			};

			const methodParameters = SwapRouter.swapCallParameters([trade], options);

			const tx = await signer.sendTransaction({
				to: ROUTER_ADDRESS,
				data: methodParameters.calldata,
				value: methodParameters.value,
				gasPrice: parseUnits('20000000000', 'wei'),
				gasLimit: 2000000
			});

			await tx.wait();
		} finally {
			status = 'idle';
		}
	}

	async function getSUPRBalance() {
		if (!walletState.value.account) return;

		const balance = await readContract(wagmiAdapter.wagmiConfig, {
			abi: erc20Abi,
			functionName: 'balanceOf',
			address: inputToken.address as `0x${string}`,
			args: [walletState.value.account]
		});

		suprBalance = formatEther(balance);
	}

	$effect(() => {
		if (inputAmount > 0) {
			void getQuote();
		}

		if (walletState.value.account) {
			void getSUPRBalance();
		}
	});
</script>

<main class="mx-auto flex min-h-screen flex-col items-center justify-center gap-4">
	{#if walletState.value.account}
		<p class="text-center">
			Welcome<br />
			{walletState.value.account}
		</p>
	{:else}
		<button
			class="btn"
			onclick={() => {
				connectModal.open();
			}}
		>
			Connect Wallet
		</button>
	{/if}

	<form class="flex w-full max-w-96 flex-col gap-4" onsubmit={handleSwap}>
		<div>
			<label class="input input-bordered flex items-center gap-2">
				<input type="number" class="grow" placeholder="0" bind:value={inputAmount} />
				SUPR
			</label>
			<span class="text-xs">
				Balance: {suprBalance} SUPR
			</span>
		</div>

		<label class="input input-bordered flex items-center gap-2">
			<input type="number" class="grow" placeholder="0" value={quoteData?.quoteDecimals} readonly />
			WSYS
		</label>

		<button class="btn btn-accent" disabled={status !== 'idle' || !quoteData} type="submit">
			{#if status !== 'idle'}
				{status}
			{:else}
				Swap
			{/if}
		</button>
	</form>
</main>
