export const metadata = { title: 'Mentions Légales — FENIXPUB' };

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mentions Légales</h1>
      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Éditeur du site</h2>
          <p><strong>FENIXPUB SARL</strong><br />
          Capital social : 10 000 €<br />
          Siège social : Lyon, France<br />
          Email : <a href="mailto:contact@fenixpub.fr" className="text-purple-700 hover:underline">contact@fenixpub.fr</a>
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Hébergement</h2>
          <p>Ce site est hébergé par <strong>Netlify, Inc.</strong><br />
          44 Montgomery Street, Suite 300<br />
          San Francisco, CA 94104, États-Unis</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Propriété intellectuelle</h2>
          <p>L&apos;ensemble des contenus présents sur ce site (textes, images, logos) est la propriété exclusive de FENIXPUB et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, même partielle, est strictement interdite sans autorisation préalable.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Responsabilité</h2>
          <p>FENIXPUB s&apos;efforce de maintenir les informations de ce site à jour mais ne peut garantir leur exactitude ou exhaustivité. Le site peut être temporairement indisponible pour maintenance.</p>
        </section>
      </div>
    </div>
  );
}
