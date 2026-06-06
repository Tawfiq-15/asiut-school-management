import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'ar'];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as any)) {
    locale = 'ar';
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
