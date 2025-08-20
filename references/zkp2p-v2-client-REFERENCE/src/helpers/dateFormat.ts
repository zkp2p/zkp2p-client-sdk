import { PaymentPlatform, PaymentPlatformType, paymentPlatformInfo } from '@helpers/types';


export function formatEventDateTime(unixTimestamp: bigint): string {
  const date = new Date(Number(unixTimestamp) * 1000);

  const dayAbbreviation = date.toLocaleString('en-US', { weekday: 'short' });
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;

  const formattedMinutes = minutes.toString().padStart(2, '0');

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  const ordinalDay = `${day}${getOrdinalSuffix(day)}`;

  return `${dayAbbreviation} - ${month} ${ordinalDay}, ${formattedHours}:${formattedMinutes} ${period}`;
};

export function formatEventDateTimeShort(unixTimestamp: bigint): string {
  const date = new Date(Number(unixTimestamp) * 1000);

  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;

  const formattedMinutes = minutes.toString().padStart(2, '0');

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  const ordinalDay = `${day}${getOrdinalSuffix(day)}`;

  return `${month} ${ordinalDay}, ${formattedHours}:${formattedMinutes} ${period}`;
};


export function formatDateTime(dateString: string, paymentPlatform: PaymentPlatformType): string {
  if (paymentPlatform === PaymentPlatform.VENMO) {
    dateString = dateString + 'Z';
  }

  if (paymentPlatform === PaymentPlatform.ZELLE) {
    if (dateString && dateString.length === 8) { // Check if it's in format "20250504"
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      dateString = `${year}-${month}-${day}T00:00:00`;
    }

    // In zelle's case don't return the time, just return the date string in US format (like "5/22" for 22nd of May)
    return new Date(dateString).toLocaleString(paymentPlatformInfo[paymentPlatform].localeTimeString, {
      month: 'numeric',
      day: 'numeric'
    });
  }

  const date = new Date(dateString);
  const now = new Date();

  const isToday = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString(paymentPlatformInfo[paymentPlatform].localeTimeString, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } else {
    return date.toLocaleString(paymentPlatformInfo[paymentPlatform].localeTimeString, {
      month: 'numeric',
      day: 'numeric'
    });
  }
};