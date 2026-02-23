import ContactForm from './ContactForm';

export const metadata = { title: 'Contact — Demande de devis' };

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-purple-800 mb-2">Contactez-nous</h1>
        <p className="text-gray-600">Demande de devis, renseignements, ou tout autre question.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <ContactForm />
      </div>
    </div>
  );
}
