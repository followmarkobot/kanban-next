import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { ToastProvider, SyncProvider } from '../lib/context';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SyncProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </SyncProvider>
  );
}
