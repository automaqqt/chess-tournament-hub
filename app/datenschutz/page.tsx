import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950">
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-lg shadow-2xl p-8 sm:p-12">
          <h1 className="text-4xl font-merriweather text-primary mb-8">
            Datenschutzerklärung
          </h1>

          <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-gray-300">
            <p className="text-lg leading-relaxed">
              Diese Datenschutzerklärung informiert Sie über die Verarbeitung personenbezogener Daten bei der Nutzung des Online-Anmeldetools für vereinseigene Schachturniere der Schachzwerge Magdeburg e.V. Wir legen großen Wert auf den Schutz Ihrer Daten, die Einhaltung der Datenschutz-Grundverordnung (DSGVO) und des Bundesdatenschutzgesetzes (BDSG).
            </p>

            <section className="border-l-4 border-primary pl-6 py-2 bg-zinc-800/30 rounded-r-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Kontaktdaten des Verantwortlichen
              </h2>
              <p className="leading-relaxed">
                Verantwortlicher für die Datenerhebung ist:
              </p>
              <address className="not-italic mt-2 leading-relaxed">
                Schachzwerge Magdeburg e.V.<br />
                Basedowstraße 5<br />
                39104 Magdeburg<br />
                Deutschland<br />
                E-Mail:{" "}
                <a href="mailto:info@schachzwerge-magdeburg.de" className="text-primary hover:underline">
                  info@schachzwerge-magdeburg.de
                </a>
              </address>
            </section>

            <section className="border-l-4 border-primary pl-6 py-2 bg-zinc-800/30 rounded-r-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Kontaktdaten des Datenschutzbeauftragten
              </h2>
              <p className="leading-relaxed">
                Christoph Klanten<br />
                E-Mail:{" "}
                <a href="mailto:datenschutz@schachzwerge-magdeburg.de" className="text-primary hover:underline">
                  datenschutz@schachzwerge-magdeburg.de
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-l-4 border-primary pl-6">
                Zweck und Rechtsgrundlagen der Verarbeitung
              </h2>
              <p className="leading-relaxed mb-4">
                Wenn Sie sich über unser Online-Tool zu einem Schachturnier anmelden, erheben wir personenbezogene Daten, um die Anmeldung durchzuführen und das Turnier zu organisieren. Ihre Daten werden aufgrund Art. 6 Abs. 1 (a) DSGVO verarbeitet.
              </p>
              <p className="leading-relaxed mb-4">
                Folgende <strong className="text-white">Pflichtangaben</strong> werden im Anmeldeformular erhoben: Vorname, Nachname, Geburtsdatum, Vereinszugehörigkeit und E-Mail-Adresse. Darüber hinaus können Sie freiwillig weitere Angaben machen (z. B. Essenswünsche oder ähnliche Hinweise), die uns bei der Turnierorganisation helfen.
              </p>
              <p className="leading-relaxed mb-4">
                Wir verwenden diese Daten ausschließlich zur Planung, Durchführung und Verwaltung des jeweiligen Schachturniers. Dazu gehört z. B. die Erstellung von Teilnehmerlisten und Spielplänen, die Kommunikation mit Ihnen bei Rückfragen oder Turnierinformationen per E-Mail sowie die Auswertung der Ergebnisse. Es erfolgt <strong className="text-white">keine Verwendung der Daten für andere Zwecke</strong> – insbesondere nicht für Werbung – und keine Weitergabe der Daten an unbeteiligte Dritte.
              </p>
              <p className="leading-relaxed bg-zinc-800/40 p-4 rounded-md border border-zinc-700">
                <strong className="text-white">Keine Nutzerkonten:</strong> Es werden keine dauerhaften Benutzerkonten angelegt. Sie melden sich jeweils separat für ein Turnier an. Nach Abschluss des Turniers (siehe Speicherdauer unten) werden Ihre Daten gelöscht und nicht für zukünftige Turniere aufbewahrt – für eine erneute Teilnahme ist daher eine neue Anmeldung erforderlich.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-l-4 border-primary pl-6">
                Keine Cookies und keine Tracking-Tools
              </h2>
              <p className="leading-relaxed">
                Unser Anmeldetool verwendet <strong className="text-white">keine Cookies</strong>, und wir setzen keine Tracking- oder Analyse-Tools ein. Es werden auch keine externen Werbedienste oder Social-Media-Plugins eingesetzt. Ihre Nutzung des Anmeldeformulars erfolgt somit ohne Profilbildung oder Nutzungsverfolgung. Lediglich technisch erforderliche Daten werden im Zuge des Seitenaufrufs temporär verarbeitet (z. B. Server-Logdaten, siehe nächster Abschnitt), jedoch nicht zu Tracking-Zwecken genutzt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-l-4 border-primary pl-6">
                Weitergabe von Daten und Hosting
              </h2>
              <p className="leading-relaxed mb-4">
                <strong className="text-white">Keine Weitergabe an Dritte:</strong> Die von Ihnen im Anmeldeformular eingegebenen Daten werden nicht an Dritte weitergegeben. Insbesondere erfolgt keine Übermittlung an Schachverbände oder andere externe Stellen; alle Daten verbleiben beim Schachzwerge Magdeburg e.V. und werden nur für vereinsinterne Turnierzwecke verwendet.
              </p>
              <p className="leading-relaxed mb-4">
                <strong className="text-white">Hosting:</strong> Unsere Website (und das Anmeldetool) wird bei einem externen Dienstleister in einem ISO-zertifizierten Rechenzentrum gehostet. Dieser Hosting-Anbieter fungiert als Auftragsverarbeiter in unserem Auftrag. Wir haben mit dem Hosting-Dienstleister einen Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO geschlossen, der sicherstellt, dass Ihre Daten entsprechend den geltenden Datenschutzvorschriften verarbeitet werden. Der Hosting-Anbieter verarbeitet die Daten nur nach unserer Weisung und nicht zu eigenen Zwecken.
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Server-Logfiles:</strong> Beim Aufruf der Anmeldeseite werden technisch bedingt einige allgemeine Informationen automatisch in Server-Logfiles gespeichert (z. B. IP-Adresse des zugreifenden Geräts, Datum und Uhrzeit des Abrufs, Browsertyp). Diese Serverlogs dienen ausschließlich der Sicherstellung des Betriebs und der IT-Sicherheit (z. B. Abwehr von Angriffen) und werden nicht mit Ihren Anmeldedaten zusammengeführt. Log-Daten werden zudem gemäß unseren Löschkonzepten zeitnah anonymisiert oder gelöscht.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-l-4 border-primary pl-6">
                Veröffentlichung von Teilnehmerdaten (Teilnehmerliste)
              </h2>
              <p className="leading-relaxed mb-4">
                Im Rahmen der Turnieranmeldung haben Sie die Möglichkeit, der Veröffentlichung Ihres Namens auf der Teilnehmerliste des Turniers ausdrücklich zuzustimmen (durch Setzen eines entsprechenden Häkchens im Formular). Ohne Ihre freiwillige Einwilligung veröffentlichen wir keine personenbezogenen Daten von Ihnen in Teilnehmerübersichten.
              </p>
              <p className="leading-relaxed mb-4">
                Wenn Sie die Einwilligung erteilen, darf der Verein Ihren Vor- und Nachnamen – ggf. zusammen mit Ihrer Vereinszugehörigkeit – in einer öffentlichen Teilnehmerliste des Turniers anzeigen (z. B. auf der Vereinswebsite oder am Veranstaltungsort). Diese Veröffentlichung dient der Transparenz gegenüber anderen Teilnehmenden und Interessierten, erfolgt jedoch ausschließlich auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 (a) DSGVO).
              </p>
              <p className="leading-relaxed bg-zinc-800/40 p-4 rounded-md border border-zinc-700">
                <strong className="text-white">Widerruf der Einwilligung:</strong> Sie können eine einmal erteilte Einwilligung zur Veröffentlichung Ihres Namens jederzeit mit Wirkung für die Zukunft widerrufen. Senden Sie dazu formlos eine Mitteilung an uns (z. B. an die oben genannte E-Mail-Adresse). Im Falle eines Widerrufs werden wir Ihren Namen umgehend aus der veröffentlichten Teilnehmerliste entfernen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-l-4 border-primary pl-6">
                Speicherdauer und Löschung
              </h2>
              <p className="leading-relaxed mb-4">
                Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies für die Durchführung und Auswertung des Turniers erforderlich ist. <strong className="text-white">Spätestens 90 Tage nach Ende des Turniers</strong> und der finalen Ergebnisfeststellung werden sämtliche personenbezogenen Anmeldedaten gelöscht. Es findet keine Archivierung Ihrer Daten für zukünftige Zwecke statt.
              </p>
              <p className="leading-relaxed">
                In der Regel löschen wir die Teilnehmerdaten unmittelbar nach Turnierende bzw. sobald sie für die Nachbereitung (z. B. statistische Auswertung des Turniers) nicht mehr benötigt werden. Lediglich anonymisierte Daten, die keine Rückschlüsse auf einzelne Personen erlauben, können ggf. zu internen Auswertungszwecken weiter genutzt werden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-l-4 border-primary pl-6">
                Datensicherheit
              </h2>
              <p className="leading-relaxed">
                Wir treffen umfangreiche technische und organisatorische Maßnahmen, um Ihre personenbezogenen Daten vor Verlust, Missbrauch und unbefugtem Zugriff zu schützen. Die Übertragung Ihrer Eingaben im Anmeldetool erfolgt verschlüsselt über <strong className="text-white">SSL/TLS</strong> (erkennbar an &ldquo;https://&rdquo; in der URL). Dadurch werden Ihre Daten sicher über das Internet an unseren Server übertragen. Unsere Hosting-Infrastruktur entspricht modernen Sicherheitsstandards (inklusive ISO-Zertifizierung des Rechenzentrums) und wird regelmäßig gewartet und aktualisiert.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-l-4 border-primary pl-6">
                Rechte der betroffenen Personen
              </h2>
              <p className="leading-relaxed mb-4">
                Als von der Datenverarbeitung betroffene Person stehen Ihnen nach der DSGVO verschiedene Rechte zu, die Sie jederzeit gegenüber uns geltend machen können:
              </p>
              <ul className="space-y-3 list-none">
                <li className="pl-0 before:content-['♟'] before:text-primary before:mr-3">
                  <strong className="text-white">Recht auf Auskunft (Art. 15 DSGVO):</strong> Sie haben das Recht, Auskunft darüber zu erhalten, welche personenbezogenen Daten wir von Ihnen verarbeiten.
                </li>
                <li className="pl-0 before:content-['♟'] before:text-primary before:mr-3">
                  <strong className="text-white">Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sollten Ihre Daten unrichtig oder unvollständig sein, können Sie deren Berichtigung oder Vervollständigung verlangen.
                </li>
                <li className="pl-0 before:content-['♟'] before:text-primary before:mr-3">
                  <strong className="text-white">Recht auf Löschung (Art. 17 DSGVO):</strong> Sie sind berechtigt, die Löschung Ihrer personenbezogenen Daten zu verlangen, sofern die gesetzlichen Voraussetzungen vorliegen.
                </li>
                <li className="pl-0 before:content-['♟'] before:text-primary before:mr-3">
                  <strong className="text-white">Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Unter bestimmten Voraussetzungen können Sie verlangen, dass die Verarbeitung Ihrer Daten nur noch eingeschränkt erfolgt.
                </li>
                <li className="pl-0 before:content-['♟'] before:text-primary before:mr-3">
                  <strong className="text-white">Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie haben das Recht, die von Ihnen bereitgestellten Daten in einem gängigen, maschinenlesbaren Format zu erhalten.
                </li>
                <li className="pl-0 before:content-['♟'] before:text-primary before:mr-3">
                  <strong className="text-white">Widerspruchsrecht (Art. 21 DSGVO):</strong> Soweit wir Daten auf Grundlage berechtigter Interessen verarbeiten, haben Sie das Recht, Widerspruch gegen die Verarbeitung Ihrer Daten einzulegen.
                </li>
                <li className="pl-0 before:content-['♟'] before:text-primary before:mr-3">
                  <strong className="text-white">Recht auf Widerruf von Einwilligungen (Art. 7 Abs. 3 DSGVO):</strong> Wenn die Datenverarbeitung auf Ihrer Einwilligung beruht, können Sie die Einwilligung jederzeit widerrufen.
                </li>
                <li className="pl-0 before:content-['♟'] before:text-primary before:mr-3">
                  <strong className="text-white">Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO):</strong> Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt, können Sie sich bei einer Datenschutzaufsichtsbehörde beschweren.
                </li>
              </ul>
              <p className="leading-relaxed mt-6 bg-zinc-800/40 p-4 rounded-md border border-zinc-700">
                <strong className="text-white">Geltendmachung Ihrer Rechte:</strong> Zur Ausübung Ihrer Rechte können Sie sich jederzeit formlos an uns als Verantwortliche wenden oder direkt an unseren Datenschutzbeauftragten unter der angegebenen E-Mail-Adresse.
              </p>
            </section>

            <footer className="mt-12 pt-6 border-t border-zinc-700 text-sm text-gray-400">
              <p>
                <strong className="text-white">Stand dieser Datenschutzerklärung:</strong> September 2025
              </p>
              <p className="mt-2">
                Für weitere Informationen zum Anbieter dieser Website und weitere rechtliche Hinweise besuchen Sie bitte unser{" "}
                <a href="https://schachzwerge.org/Start/Impressum" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Impressum
                </a>.
              </p>
              <p className="mt-4">
                <Link href="/" className="text-primary hover:underline">
                  ← Zurück zur Startseite
                </Link>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
