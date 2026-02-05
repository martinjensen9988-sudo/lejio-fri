
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';

const FriPromo = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white font-semibold mb-6 border border-white/30">
            <Zap className="w-4 h-4" />
            <span>Nyt fra Lejio</span>
          </div>

          {/* Main heading */}
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Lejio Fri
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Din egen hvid-label biludlejningsplatform. Fuld kontrol over din flåde, bookinger og fakturaer – alt fra ét sted. Prøv gratis i 14 dage!
          </p>

          {/* Key benefits */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-white font-semibold">✓ Flådestyring</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-white font-semibold">✓ Automatisk fakturering</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-white font-semibold">✓ Teamsamarbejde</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/fri/trial">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold gap-2">
                Start gratis prøveperiode
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/fri">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-semibold">
                Læs mere om Fri
              </Button>
            </Link>
          </div>

          {/* Trust message */}
          <p className="text-sm text-blue-100 mt-8">
            14 dage gratis · Ingen kreditkort påkrævet · Opsig når som helst
          </p>
        </div>
      </div>
    </section>
  );
};

export default FriPromo;
