import { FirebaseConfigParams } from '../firebase/config';

export function parseGoogleServicePlist(content: string): FirebaseConfigParams | null {
  try {
    const extractTag = (key: string): string => {
      const regex = new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`, 'i');
      const match = content.match(regex);
      return match ? match[1].trim() : '';
    };

    const apiKey = extractTag('API_KEY');
    const projectId = extractTag('PROJECT_ID');
    const appId = extractTag('GOOGLE_APP_ID');
    const storageBucket = extractTag('STORAGE_BUCKET');
    const gcmSenderId = extractTag('GCM_SENDER_ID');

    if (apiKey && projectId) {
      return {
        apiKey,
        projectId,
        authDomain: `${projectId}.firebaseapp.com`,
        storageBucket: storageBucket || `${projectId}.appspot.com`,
        messagingSenderId: gcmSenderId,
        appId: appId || ''
      };
    }
  } catch (err) {
    console.error('Error parsing GoogleService-Info.plist:', err);
  }
  return null;
}

export function parseGoogleServicesJson(content: string): FirebaseConfigParams | null {
  try {
    const parsed = JSON.parse(content);
    const projectId = parsed?.project_info?.project_id;
    const storageBucket = parsed?.project_info?.storage_bucket;
    const client = parsed?.client?.[0];
    const apiKey = client?.api_key?.[0]?.current_key;
    const appId = client?.client_info?.mobilesdk_app_id;

    if (apiKey && projectId) {
      return {
        apiKey,
        projectId,
        authDomain: `${projectId}.firebaseapp.com`,
        storageBucket: storageBucket || `${projectId}.appspot.com`,
        messagingSenderId: parsed?.project_info?.project_number || '',
        appId: appId || ''
      };
    }
  } catch (err) {
    console.error('Error parsing google-services.json:', err);
  }
  return null;
}
