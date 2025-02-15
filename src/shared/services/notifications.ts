import { StorageKeys } from './storage';

async function fetchImageAsDataURL(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to data URL'));
        }
      };

      reader.onerror = () =>
        reject(new Error('Error reading blob as data URL'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

export async function sendRunCompleteNotification(
  title: string,
  message: string,
  href: string,
  iconUrl: string,
) {
  // Resolve the icon URL
  const resolvedIconUrl = `${iconUrl}?fm=png&ar=1:1&fit=crop&w=168&corner-radius=20&mask=corners`;

  let image = './icons/icon512x512.png'; // Default icon
  const base64Image = await fetchImageAsDataURL(resolvedIconUrl);
  if (base64Image) {
    image = base64Image; // Use downloaded image as Data URL
  }

  chrome.notifications.create(
    {
      type: 'basic',
      iconUrl: image,
      title,
      message,
      requireInteraction: false,
    },
    (notificationId) => {
      // Store the notification ID and its associated link
      chrome.storage.local.set({
        [`${StorageKeys.NOTIFICATION_HREF_CACHE_PREFIX}_${notificationId}`]:
          href,
      });
    },
  );
}
