import axios from 'axios';

export const pegasysApi = axios.create({
	baseURL: 'https://api.pegasys.fi/prod'
});
