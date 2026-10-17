import { Barlow } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const barlow = Barlow({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'who he play for?',
  description: 'how well do you know this season\'s NBA rosters?',
  metadataBase: new URL('https://whpf.pranayvarada.com'),
  openGraph: {
    title: 'who he play for?',
    description: 'how well do you know this season\'s NBA rosters?',
    url: 'https://whpf.pranayvarada.com',
    siteName: 'Who He Play For?',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'who he play for?',
    description: 'how well do you know this season\'s NBA rosters?',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics Tag */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ELB9NNSQXG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-ELB9NNSQXG');
                    `}
        </Script>
      </head>
      <body className={barlow.className}>
        {children}
      </body>
    </html>
  );
}