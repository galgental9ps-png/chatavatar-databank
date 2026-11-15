# Tavi · Chatavatar-Datenbank

Eine blau-weiße TVA-Superheldin für Webseiten. Sie läuft am unteren Bildschirmrand, hüpft gelegentlich, winkt, lässt sich versetzen und zeigt nach einem Klick Fragen und Antworten aus einem hochladbaren Wissenspaket.

**Ohne LLM, ohne KI-Backend, ohne API-Kosten für Antworten.** Die Antworttexte werden redaktionell hinterlegt und unverändert angezeigt. Die Suche findet passende hinterlegte Einträge. Optionales Vorlesen verwendet die Systemsprachausgabe des Browsers; abhängig von der installierten Stimme kann diese einen Onlinedienst nutzen.

## Sofort starten und herunterladen

1. Auf GitHub **Code → Download ZIP** wählen und entpacken.
2. **`index.html`** doppelt anklicken: Demo mit lokaler Wissensversion.
3. **`admin.html`** öffnen: Wissensdaten hochladen, bearbeiten und testen.

Unter Windows können Sie auch **`Start-Chatavatar.cmd`** oder **`Start-Wissensstudio.cmd`** doppelt anklicken. Der gesicherte Fertigstellungsstand steht in **`PROJEKTSTATUS.md`**, damit die Arbeit nach einem Chatabbruch direkt fortgesetzt werden kann.

Alternativ mit Python lokal über HTTP starten:

```sh
python -m http.server 8080
```

Dann `http://localhost:8080` öffnen. Keine Installation von npm-Paketen für die Anwendung erforderlich.

## Enthalten

| Datei | Zweck |
|---|---|
| `index.html` | TVA-Demo mit anklickbaren Themen und eingebundener Heldin |
| `admin.html` | Wissensstudio mit Import, Editor, Vorschau und GitHub-Zugang |
| `avatar.js`, `avatar.css` | Einbindbares Widget mit gekapseltem Shadow DOM |
| `knowledge-core.js` | Validierung, lokale Suche und Dateiimporte |
| `github-publisher.js` | Authentifiziertes, konfliktgeschütztes Speichern auf GitHub |
| `knowledge/tva.json` | Zentrale öffentliche Wissensschnittstelle |
| `knowledge/tva.bundle.js` | Synchronisierte lokale Dateiversion für Doppelklick-Start |
| `assets/tva-heldin.png` | Transparente blau-weiße Figur mit 16 Animationsposen |
| `embed-beispiel.html` | Eigenständige HTML-Seite mit Einbindung durch ein Script |
| `docs/TVA-WISSEN.md` | Lesbare vollständige Fassung der Wissenseinträge mit Quellen |

Das erste Paket enthält **68 Antworten aus 50 öffentlichen TVA-Quellen**, recherchiert am **15.11.2026**. Themen: Zeiten, Kontakt, Kinderwelt, Anmeldung, Mitgliedschaft, Beiträge, Studio, Cycling, App, Sportabteilungen, REHA Sport, Wellness und Vereinsleitung. Es ist eine ausführliche, erweiterbare Orientierung und keine vollständige interne Vereinsdatenbank.

Der aktuelle Kinderwelt-Hinweis zur Anmeldung an der Infotheke wird gegenüber weiter unten stehenden älteren Online-Anmeldeinformationen erläutert. Die neue Schwimmabteilung wird als angekündigter Start ab Januar 2027 dargestellt. Keine Live-Abfrage freier Plätze, Trainingsänderungen oder Buchungen.

## Wissensstudio und Schnittstelle

1. Mit **GitHub-Zugang** verbinden und den aktuellen Stand laden.
2. Antworten im Editor bearbeiten oder unter **Wissen hochladen** importieren.
3. Folgefragen auswählen, Quellen und Prüfdatum ergänzen, Einträge aktivieren.
4. **Antwort testen** bzw. **Tavi testen** anklicken.
5. **Auf GitHub speichern** schreibt JSON und Offlinepaket gemeinsam in einen Commit.

Unterstützt: vollständige JSON-Pakete, Markdown, TXT und CSV. Markdown-Überschriften werden Fragen, der folgende Text wird Antwort. CSV braucht `Frage` und `Antwort`, optional `Quelle`. Importierte Text-/CSV-Einträge sind zunächst deaktiviert. PDF und Word vorher als Text exportieren. Die Vorlagen liegen unter `knowledge/`; ein wiederverwendbarer Rechercheauftrag für ChatGPT unter `docs/WISSEN-ERSTELLEN.md`.

### Schreibzugang

Zum Speichern auf GitHub ist ein **Fine-grained Personal Access Token** erforderlich: nur dieses Repository auswählen, `Contents: Read and write` setzen, möglichst kurze Laufzeit wählen. Der Token wird ausschließlich in den Arbeitsspeicher des Editors übernommen. Weder Local Storage noch Wissensdatei enthalten ihn; das Eingabefeld wird nach dem Verbinden geleert. Beim Trennen oder Verlassen der Seite wird die Verbindung verworfen.

Die Editor-URL ist selbst kein geheimes oder passwortgeschütztes Verwaltungsportal. Bearbeiten ist lokal möglich; zentrale Schreibrechte werden durch GitHub geprüft. Nicht angemeldete Websitebesucher können den zentralen Stand nicht ändern. Ein serverseitiges Login-Portal gehört nicht zu dieser statischen Version.

Browserentwürfe werden lokal gespeichert und beim nächsten Besuch zur Wiederherstellung angeboten. GitHub lädt keinen Browserentwurf automatisch als öffentlichen Stand. Vor dem Laden eines anderen Stands lokale Änderungen gegebenenfalls als JSON exportieren.

Der Publisher prüft, ob die Wissensdatei seit dem Laden auf GitHub geändert wurde, und stoppt bei Konflikten. Ein nicht erzwungenes Branch-Update schützt auch vor Änderungen während der Veröffentlichung.

## Öffentliche Datenbank und IONOS

Dieses Repository ist die öffentliche Ausgabe der Avatar-Anwendung. Es enthält Figur, Editor und die für Websitebesucher vorgesehenen Antworten. Das ursprüngliche Entwicklungsrepository bleibt privat.

Für den IONOS-Baukasten den Inhalt von **`body-end.html`** in den globalen Codebereich am Ende des Bodys einfügen und die Webseite veröffentlichen. Ein Datei-Upload auf den IONOS-Server ist nicht nötig. Grafik und Antworten werden von GitHub Pages geladen. Anleitung: **`docs/IONOS.md`**.

## GitHub Pages einmalig freigeben

Im Repository **Settings → Pages → Source: GitHub Actions** auswählen. GitHub zeigt anschließend die tatsächliche veröffentlichte Adresse. Die Datei `.github/workflows/pages.yml` prüft die Anwendung und veröffentlicht sie bei jedem Push auf `main`. Der erfolgreiche Lauf „Deploy static content to Pages“ zeigt die fertige Adresse. Die Anwendung benötigt nur statisches Hosting.

Typische Adresse nach Aktivierung:

```text
https://galgental9ps-png.github.io/chatavatar-databank/
https://galgental9ps-png.github.io/chatavatar-databank/admin.html
```

Diese Adressen sind erst nach erfolgreicher Pages-Aktivierung und Veröffentlichung erreichbar. Bei Bedarf den vollständigen Ordner auf einem eigenen Webserver hosten. Die Anwendung braucht nur statisches Hosting. GitHub-Pages-Webseiten sind üblicherweise öffentlich; ausschließlich für Websitebesucher bestimmte Wissensdaten veröffentlichen.

## In eine beliebige HTML-Seite einbinden

Vor `</body>`:

```html
<script src="https://galgental9ps-png.github.io/chatavatar-databank/avatar.js" defer></script>
```

Eigenes Firmenpaket:

```html
<script src="https://galgental9ps-png.github.io/chatavatar-databank/avatar.js"
        data-knowledge="https://ihre-domain.de/wissen/firma.json"
        defer></script>
```

Im Wissensstudio unter **In HTML einbinden** kann die tatsächliche Hosting-URL eingetragen und der fertige Code kopiert werden. Das Script lädt CSS, Grafik, Wissensengine und JSON relativ zu seiner eigenen Adresse. Bei einer fremden JSON-Domain muss diese CORS erlauben. Die CSP der einbindenden Webseite muss Script, Style, Bild und Wissensquelle zulassen.

Zentrale Wissensänderungen werden nach dem Pages-Deployment beim nächsten Laden der einbindenden Webseite abgefragt. Bereits offene Webseiten aktualisieren sich nicht selbstständig. Lokal heruntergeladene Dateien enthalten den heruntergeladenen Stand.

## Steuerung und Zugänglichkeit

- Figur anklicken: Fragen öffnen oder schließen. Ziehen: neue Position.
- Bewegung stoppt bei offenem Antwortfenster. Footer: Pause/Weiterlaufen und optional Vorlesen.
- Minus: Figur ausblenden; kleiner Rückrufbutton bleibt sichtbar.
- Escape: Fenster schließen. Buttons und Suche sind mit Tastatur erreichbar.
- `prefers-reduced-motion` startet ohne Herumlaufen und unterdrückt die Spriteanimation.
- Keine automatische Tonwiedergabe und keine Analyse-/Trackingdienste.

## Entwicklung und Tests

Node.js ab Version 22 für die Tests:

```sh
node --test tests/core.test.cjs
node tools/sync-knowledge.cjs
```

Die Tests prüfen Datenreferenzen, Offline-Synchronität, Suche, Zeitgrenzen, sichere Links, Importe, atomare GitHub-Veröffentlichung und Konfliktschutz. GitHub Actions führt diese Prüfungen bei Änderungen aus.

Die ausführlichen Schnittstellenfelder und JavaScript-Methoden stehen in `docs/WISSENSSCHEMA.md`.

## Quellen und Gestaltung

TVA-Informationen wurden aus öffentlichen Vereinsseiten in eigene Kurzantworten übertragen. Jeder Eintrag enthält die Original-URL und ein Prüfdatum. Prüfungstermine erzeugen Hinweise, keine automatische Recherche. Bei widersprüchlichen oder veralteten Angaben bitte die verlinkte Vereinsseite bzw. Infotheke nutzen.

Die Figur ist eine eigens erstellte blau-weiße Illustration für diesen Prototyp. **Privates Demonstrationsprojekt, keine offizielle TVA-Webseite und keine vom Verein bestätigte Auskunftsstelle.** Vereinsname und Quellen dienen der Zuordnung des Demonstrationswissens.

Technische Primärquellen:

- https://docs.github.com/en/rest/git/trees
- https://docs.github.com/en/rest/git/commits
- https://docs.github.com/en/rest/git/refs
- https://docs.github.com/en/rest/repos/contents
- https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages



## Bewegung Version 2

Tavi verwendet 16 aufeinanderfolgende Laufphasen mit vollständigem Hin- und Rückschwung der Arme, die zur tatsächlich zurückgelegten Strecke passen. Anlaufen und Anhalten werden beschleunigt bzw. abgebremst. Beim Ziehen nutzt sie eigene Halteposen, beim Loslassen eine Fallpose mit Schwerkraft, anschließend Landung und Aufstehen. Das Fallen funktioniert auch bei geöffnetem Antwortfenster. Bei pausierter oder reduzierter Bewegung wird sie ohne Fallanimation am Boden abgesetzt. Die Demo bietet Lauf- und Sprungknöpfe.

Die Vereinsfarben, Wissensdaten und die Script-Adresse bleiben erhalten. Neue Grafiken: assets/tva-poses-v2.webp und assets/tva-walk-v3.webp; Steuerung: motion-core.js, mascot.js und mascot.css. Die bestehenden alten Grafiken bleiben für ältere Einbindungen vorhanden. Neue Cache-Version: tavi-motion-10. Bei alter Anzeige die Webseite vollständig neu laden.

Alle Tests einschließlich Bewegung ausführen: node --test tests/*.test.cjs

Beim Blick nach links wird nur das Brustlogo vorab gegengespiegelt. So bleibt TVA in beiden Richtungen lesbar. Alle Posen verwenden vollständig gezeichnete Figuren aus assets/tva-poses-v2.webp und assets/tva-walk-v3.webp. Die zusammengesetzte Körperteil-Animation wurde zurückgenommen. Die Originalfarben bleiben erhalten; nur störende Transparenz wird korrigiert. Das erhöhte Tempo von 0,62 Figurenbreiten pro Sekunde, die korrigierte Standgröße und die Fallanimation bleiben erhalten. Frühere Dateien bleiben ausschließlich für zwischengespeicherte ältere Einbindungen verfügbar.

Nur die Laufbilder erhalten eine leichte Kontrastverstärkung und deckendere Kanten. Die Farbdaten der Standposen werden nicht verändert.
