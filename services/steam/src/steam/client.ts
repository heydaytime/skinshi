import SteamCommunity from 'steamcommunity';
import TradeOfferManager from 'steam-tradeoffer-manager';
import { getCookies } from './session';

export const community = new SteamCommunity();
export const manager = new TradeOfferManager({
  community,
  language: 'en',
  pollInterval: 5000
});

export async function initClient(cookies: string[]) {
  community.setCookies(cookies);

  await new Promise<void>((resolve, reject) => {
    manager.setCookies(cookies, (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });

  community.on('sessionExpired', async () => {
    console.log('Session expired, refreshing...');
    const newCookies = await getCookies();
    community.setCookies(newCookies);
    manager.setCookies(newCookies);
  });

  console.log('Ready to trade.');
}
