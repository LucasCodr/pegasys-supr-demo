import { createAppKit } from '@reown/appkit';
import { reconnect, watchAccount } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { JsonRpcProvider } from 'ethers';
import type { FallbackProvider } from 'ethers';
import { getEthersProvider } from '../utils/ethers-adapter';
import { rollux } from '@reown/appkit/networks';

const projectId = '829b7781254fb621cc342e7cd95a914f';

export const networks = [rollux];

export const wagmiAdapter = new WagmiAdapter({
	chains: [rollux],
	projectId,
	networks
});

const metadata = {
	name: 'Pegasys SDK test',
	description: 'Pegasys SDK test',
	url: 'https://example.com',
	icons: ['https://avatars.githubusercontent.com/u/179229932']
};

export const connectModal = createAppKit({
	adapters: [wagmiAdapter],
	networks: [rollux],
	metadata,
	projectId,
	features: {
		analytics: false
	}
});

export const walletState = $state({
	value: {
		account: null as `0x${string}` | null,
		ethersProvider: undefined as undefined | JsonRpcProvider | FallbackProvider
	}
});

void reconnect(wagmiAdapter.wagmiConfig);

watchAccount(wagmiAdapter.wagmiConfig, {
	onChange: (data) => {
		if (data.address) {
			walletState.value.account = data.address;
			walletState.value.ethersProvider = getEthersProvider(wagmiAdapter.wagmiConfig);
		} else {
			walletState.value.account = null;
			walletState.value.ethersProvider = undefined;
		}
	}
});
