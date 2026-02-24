export const metadata = { title: 'Politique de Confidentialité — FENIXPUB' };

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Politique de Confidentialité</h1>
      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Collecte des données</h2>
          <p>FENIXPUB collecte les données personnelles que vous nous transmettez via les formulaires de contact, d&apos;inscription ou de commande : nom, prénom, email, téléphone, société et adresse.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Utilisation des données</h2>
          <p>Vos données sont utilisées exclusivement pour traiter vos demandes de devis, gérer vos commandes et vous contacter dans ce cadre. Elles ne sont jamais revendues à des tiers.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Durée de conservation</h2>
          <p>Vos données sont conservées pendant la durée de la relation commerciale et 3 ans après le dernier contact, conformément à la réglementation en vigueur.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Vos droits</h2>
          <p>Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de portabilité de vos données. Pour exercer ces droits, contactez-nous à <a href="mailto:contact@fenixpub.fr" className="text-purple-700 hover:underline">contact@fenixpub.fr</a>.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cookies</h2>
          <p>Ce site utilise des cookies strictement nécessaires à son fonctionnement (session d&apos;authentification). Aucun cookie publicitaire ou de traçage tiers n&apos;est utilisé.</p>
        </section>
      </div>
    </div>
  );
}
