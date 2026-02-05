import rasmusImage from '@/assets/rasmus-damsgaard-small.jpg';

const LeaderSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Mød folkene bag <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Lejio</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bag Lejio.dk står et dedikeret team med en passion for teknologi og mobilitet.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="bg-card rounded-2xl p-8 border border-border shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full overflow-hidden mb-6 ring-4 ring-primary/20">
                <img 
                  src={rasmusImage} 
                  alt="Rasmus Damsgaard - Daglig Leder" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-display text-2xl font-bold mb-1">Rasmus Damsgaard</h3>
              <p className="text-primary font-medium mb-4">Medstifter & Partner</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Som medstifter og daglig leder er Rasmus hjertet bag Lejio. Han har været med fra dag ét og brænder for at skabe Danmarks mest brugervenlige udlejningsplatform. Med fokus på teknologi og kundeservice sikrer han, at både udlejere og lejere får en problemfri oplevelse. Hos Lejio er hjælpen aldrig mere end et opkald væk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderSection;
