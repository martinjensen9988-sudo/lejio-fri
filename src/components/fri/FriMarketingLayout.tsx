import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';

interface FriMarketingLayoutProps {
  children: ReactNode;
  showCta?: boolean;
}

export function FriMarketingLayout({ children, showCta = true }: FriMarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_45%),radial-gradient(circle_at_30%_30%,_rgba(99,102,241,0.2),_transparent_40%),radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.18),_transparent_40%)]" />

      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-semibold">Din platform</div>
              <div className="text-xs text-amber-200/80">White‑label biludlejning</div>
            </div>
          </div>
          <div className="hidden md:flex gap-4 items-center">
            <Link to="/fri/features">
              <Button variant="ghost" className="text-white/80 hover:text-amber-100 hover:bg-white/10">Alle funktioner</Button>
            </Link>
            <Link to="/fri/workshop">
              <Button variant="ghost" className="text-white/80 hover:text-amber-100 hover:bg-white/10">Værkstedsmoduler</Button>
            </Link>
            <Link to="/fri/login">
              <Button variant="ghost" className="text-white/80 hover:text-amber-100 hover:bg-white/10">Log ind</Button>
            </Link>
            {showCta && (
              <Link to="/fri/signup">
                <Button className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110">Kom i gang</Button>
              </Link>
            )}
          </div>
          {showCta && (
            <Link to="/fri/signup" className="md:hidden">
              <Button className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110">Kom i gang</Button>
            </Link>
          )}
        </div>
      </nav>

      {children}

      <footer className="bg-[#090c14] text-white py-12 border-t border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Om platformen</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/fri" className="hover:text-white">Hjem</Link></li>
                <li><Link to="/fri/features" className="hover:text-white">Funktioner</Link></li>
                <li><Link to="/fri/landing" className="hover:text-white">Priser</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="mailto:support@yourdomain.com" className="hover:text-white">support@yourdomain.com</a></li>
                <li><a href="#" className="hover:text-white">Dokumentation</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Juridisk</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privatlivspolitik</a></li>
                <li><a href="#" className="hover:text-white">Vilkår & betingelser</a></li>
                <li><a href="#" className="hover:text-white">GDPR</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Kontakt</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Din virksomhed</li>
                <li>Danmark</li>
                <li><a href="tel:+4544889999" className="hover:text-white">+45 44 88 99 99</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 Din platform. Alle rettigheder forbeholdt.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
