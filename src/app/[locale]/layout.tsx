import { routing } from "@/i18n/routing";
import { DirectionProvider } from "@/modules/shared/ui/components/ui/direction";
import { Toaster } from "@/modules/shared/ui/components/ui/sonner";
import fonts from "@/modules/shared/ui/helpers/fonts";
import { ConfirmProvider } from "@/modules/shared/ui/providers/confirm";
import { NextIntlProvider } from "@/modules/shared/ui/providers/next-intl";
import { ThemeProvider } from "@/modules/shared/ui/providers/next-themes";
import { QueryProvider } from "@/modules/shared/ui/providers/react-query";
import type { Metadata } from "next";
import { getMessages, setRequestLocale } from "next-intl/server";

import "@/modules/shared/ui/assets/styles/globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return {
    title: messages.metadata?.homeTitle as string,
    description: messages.metadata?.homeDescription as string,
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${fonts.inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <NextIntlProvider params={params}>
          <DirectionProvider dir={dir}>
            <ThemeProvider>
              <ConfirmProvider>
                <QueryProvider>{children}</QueryProvider>
              </ConfirmProvider>
            </ThemeProvider>
            <Toaster position="bottom-right" />
          </DirectionProvider>
        </NextIntlProvider>
      </body>
    </html>
  );
}
