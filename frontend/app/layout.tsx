import './globals.css';
import { Toaster } from 'react-hot-toast';
import Header from '@/shared/ui/Header';
export const metadata = {
  title: 'Roamly | Find your next stay',
  description: 'Thoughtful homes, unforgettable places',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{ style: { borderRadius: 8, background: '#222', color: '#fff' } }}
        />
      </body>
    </html>
  );
}
