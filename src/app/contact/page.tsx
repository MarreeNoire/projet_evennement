import { Mail, MapPin, Phone, Send } from "lucide-react";

import { EditorialShell } from "@/components/layout/editorial/editorial-shell";

import content from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata = {
  title: "Nous contacter",
  description: "Contacte l’équipe Event pour toute question ou demande de partenariat.",
};

const SUBJECTS = [
  { value: "support", label: "Support billet & achat" },
  { value: "organisateur", label: "Devenir organisateur / Partenariat" },
  { value: "other", label: "Autre demande" },
];

export default function ContactPage() {
  return (
    <EditorialShell>
      <div className={shell.wrap}>
        <div className={shell.page} style={{ display: "grid", gap: 40 }}>
          <header className={`${shell["page-head"]} ${shell["page-head--split"]}`}>
            <div>
              <p className={shell.eyebrow}>Contact</p>
              <h1 className={shell["page-title"]} style={{ marginTop: 14 }}>
                Écrivez-nous, <em>on vous répond.</em>
              </h1>
            </div>
            <p className={shell["page-lead"]}>
              Une question sur un événement, votre billet ou un partenariat ? Écrivez-nous depuis
              Abidjan, notre équipe répond sous 24 h.
            </p>
          </header>

          <div className={content.contactLayout}>
            <aside className={content.contactAside} aria-labelledby="coordonnees">
              <p className={shell.eyebrow}>Coordonnées</p>
              <h2 id="coordonnees">L’équipe Event</h2>
              <ul className={content.contactList}>
                <li>
                  <Mail className={`${shell.icon} ${content.contactIcon}`} aria-hidden="true" />
                  <span>contact@rassemble.ci</span>
                </li>
                <li>
                  <Phone className={`${shell.icon} ${content.contactIcon}`} aria-hidden="true" />
                  <span>+225 07 00 00 00 00</span>
                </li>
                <li>
                  <MapPin className={`${shell.icon} ${content.contactIcon}`} aria-hidden="true" />
                  <span>Abidjan, Côte d’Ivoire</span>
                </li>
              </ul>
              <p className={shell["mono-label"]} style={{ marginTop: 4 }}>
                Du lundi au vendredi
              </p>
            </aside>

            <section className={content.contactForm} aria-labelledby="envoyer-message">
              <h2 id="envoyer-message">Envoyer un message</h2>
              <p>
                Remplissez le formulaire ci-dessous et notre équipe vous répondra sous 24 h.
              </p>

              <form style={{ display: "grid", gap: 16 }}>
                <div className={content.formRow}>
                  <label className={shell.field} htmlFor="contact-name">
                    <span className={shell["field-label"]}>Votre nom *</span>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      placeholder="Nom complet"
                      className={shell.input}
                    />
                  </label>
                  <label className={shell.field} htmlFor="contact-email">
                    <span className={shell["field-label"]}>Adresse e-mail *</span>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      placeholder="nom@exemple.ci"
                      className={shell.input}
                    />
                  </label>
                </div>

                <label className={shell.field} htmlFor="contact-subject">
                  <span className={shell["field-label"]}>Sujet *</span>
                  <select id="contact-subject" name="subject" className={shell.select}>
                    {SUBJECTS.map((subject) => (
                      <option key={subject.value} value={subject.value}>
                        {subject.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={shell.field} htmlFor="contact-message">
                  <span className={shell["field-label"]}>Message *</span>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Expliquez-nous votre besoin…"
                    className={shell.textarea}
                  />
                </label>

                <div className={content.formActions}>
                  <button type="submit" className={`${shell.btn} ${shell["btn-primary"]}`}>
                    <Send className={shell.icon} aria-hidden="true" />
                    Envoyer le message
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </EditorialShell>
  );
}
