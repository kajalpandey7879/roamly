import 'leaflet/dist/leaflet.css';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Header from '@/shared/ui/Header';
import Footer from '@/shared/ui/Footer';
import AuthProvider from '@/features/auth/AuthProvider';
import ThemeProvider from '@/features/theme/ThemeProvider';
export const metadata = {
  title: 'Roamly | Find your next stay',
  description: 'Thoughtful homes, unforgettable places',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('roamly-theme')||'light';var t=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            {children}
            <Footer />
            <Toaster
              position="bottom-center"
              toastOptions={{ style: { borderRadius: 8, background: '#222', color: '#fff' } }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
