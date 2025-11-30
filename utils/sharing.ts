import { Share, Platform } from 'react-native';
import * as Linking from 'expo-linking';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://sourceimpact.app';

export interface ShareOptions {
  title: string;
  message: string;
  url?: string;
}

export async function shareProfile(userId: string, userName: string): Promise<void> {
  const webLink = `${WEB_URL}/profile/${userId}`;
  
  try {
    await Share.share({
      title: `Check out ${userName}'s profile`,
      message: `Check out ${userName} on SourceImpact!\n\n${webLink}`,
      url: Platform.OS === 'ios' ? webLink : undefined,
    });
    console.log('[Sharing] Profile shared:', { userId, userName, link: webLink });
  } catch (error) {
    console.error('[Sharing] Error sharing profile:', error);
  }
}

export async function shareGig(gigId: string, gigTitle: string): Promise<void> {
  const webLink = `${WEB_URL}/gig/${gigId}`;
  
  try {
    await Share.share({
      title: gigTitle,
      message: `Check out this opportunity: ${gigTitle}\n\n${webLink}`,
      url: Platform.OS === 'ios' ? webLink : undefined,
    });
    console.log('[Sharing] Gig shared:', { gigId, gigTitle, link: webLink });
  } catch (error) {
    console.error('[Sharing] Error sharing gig:', error);
  }
}

export async function shareReferralCode(referralCode: string, userName: string): Promise<void> {
  const webLink = `${WEB_URL}/ref/${referralCode}`;
  
  try {
    await Share.share({
      title: `Join SourceImpact with ${userName}`,
      message: `Join me on SourceImpact and start earning!\n\nUse my referral link: ${webLink}`,
      url: Platform.OS === 'ios' ? webLink : undefined,
    });
    console.log('[Sharing] Referral code shared:', { referralCode, userName, link: webLink });
  } catch (error) {
    console.error('[Sharing] Error sharing referral code:', error);
  }
}

export async function shareCustom(options: ShareOptions): Promise<void> {
  try {
    await Share.share({
      title: options.title,
      message: options.message,
      url: Platform.OS === 'ios' ? options.url : undefined,
    });
    console.log('Content shared successfully');
  } catch (error) {
    console.error('Error sharing:', error);
  }
}

export function generateDeepLink(path: string, params?: Record<string, string>): string {
  const url = Linking.createURL(path);
  if (params) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return `${url}?${queryString}`;
  }
  return url;
}
