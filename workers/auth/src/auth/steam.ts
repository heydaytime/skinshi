import { config } from '@skinshi/api/config';

export async function verifySteamAuthentication(query: Record<string, string | string[]>): Promise<boolean> {
	const verifyParams = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (key.startsWith('openid.')) {
			verifyParams.set(key, value as string);
		}
	}
	verifyParams.set('openid.mode', 'check_authentication');
	const verifyResponse = await fetch(config.STEAM_OPENID_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'text/plain',
		},
		body: verifyParams.toString(),
	});
	const verifyText = await verifyResponse.text();
	return verifyText.includes('is_valid:true');
}
