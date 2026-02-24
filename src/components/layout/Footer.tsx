import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-white font-bold text-lg mb-3">FENIX<span className="text-pink-400">PUB</span></div>
          <p className="text-sm leading-relaxed">Votre partenaire en objets publicitaires personnalisés. Qualité, rapidité, créativité.</p>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Navigation</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
            <li><Link href="/catalogue" className="hover:text-white transition-colors">Catalogue</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-sm">
            <li>guilhem@fenix-pub.fr</li>
            <li>+33 (0) 7 65 75 74 98</li>
            <li>SARL FENIXPUB</li>
            <li>45 rue Hector Berlioz, 69009 LYON</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 text-center text-xs py-4 text-gray-600">
        © {new Date().getFullYear()} FENIX PUB — Tous droits réservés
      </div>
    </footer>
  );
}
