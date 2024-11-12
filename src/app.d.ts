// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export type SwapQuote = {
	blockNumber: string;
	amount: string;
	amountDecimals: string;
	quote: string;
	quoteDecimals: string;
	quoteGasAdjusted: string;
	quoteGasAdjustedDecimals: string;
	gasUseEstimateQuote: string;
	gasUseEstimateQuoteDecimals: string;
	gasUseEstimate: string;
	gasUseEstimateUSD: string;
	simulationStatus: string;
	simulationError: boolean;
	gasPriceWei: string;
	route: RouteStep[][];
	routeString: string;
	quoteId: string;
};

type RouteStep = {
	type: string;
	address: string;
	tokenIn: {
		chainId: number;
		decimals: string;
		address: string;
		symbol: string;
	}
	tokenOut: {
		chainId: number;
		decimals: string;
		address: string;
		symbol: string;
	}
	fee: string;
	liquidity: string;
	sqrtRatioX96: string;
	tickCurrent: string;
	amountIn: string;
	amountOut: string;
};

export {};
