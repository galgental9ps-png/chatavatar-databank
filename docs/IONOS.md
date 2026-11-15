# Tavi im IONOS-Baukasten

## GitHub einmalig freigeben

Im öffentlichen Repository `chatavatar-databank` unter **Settings → Pages** die Quelle **GitHub Actions** auswählen. Der Workflow `.github/workflows/pages.yml` prüft und veröffentlicht die Dateien bei jedem Push auf `main`. Die Adressen sind erst nach erfolgreicher Veröffentlichung erreichbar.

## In IONOS einfügen

1. Den globalen HTML-/JavaScript-Codebereich am Ende des Bodys (`body-end.html`) öffnen.
2. Den Inhalt der Datei `body-end.html` aus diesem Repository einfügen:

```html
<script src="https://galgental9ps-png.github.io/chatavatar-databank/avatar.js" defer></script>
```

3. Speichern und die IONOS-Webseite veröffentlichen.
4. Die veröffentlichte Webseite neu laden, Tavi anklicken und eine Frage auswählen.

Das Script lädt Grafik, Gestaltung, Antwortsuche und Wissensdatei automatisch. Kein Datei-Upload auf den IONOS-Server erforderlich. Der Einbindungscode enthält keinen GitHub-Token.

Falls ein HTML-Element JavaScript entfernt oder in einem isolierten iframe anzeigt, den globalen Codebereich verwenden. Innerhalb eines iframe bewegt sich die Figur nur innerhalb dieses Elements. Die Baukasten-Vorschau kann Scripts einschränken; maßgeblich ist die veröffentlichte Webseite.

## Wissen befüllen

Editor: https://galgental9ps-png.github.io/chatavatar-databank/admin.html

Zuerst unter **GitHub-Zugang** den aktuellen Stand laden. Nur `chatavatar-databank` auswählen und einen Fine-grained Token mit **Contents: Read and write** verwenden. Er bleibt nur im Arbeitsspeicher. Beim Verbinden ersetzt der GitHub-Stand den angezeigten Entwurf; vorher bei Bedarf JSON exportieren.

Unter **Wissen hochladen** JSON, Markdown, TXT oder CSV auswählen. Antworten prüfen, bei Bedarf aktivieren, **Im Browser speichern** und anschließend **Auf GitHub speichern** wählen. Erst der zweite Schritt veröffentlicht zentral. Der Editor schreibt JSON und Offlinepaket gemeinsam.

Danach den erfolgreichen Pages-Lauf abwarten und die IONOS-Webseite neu laden. Alle Einbindungen laden dieselbe zentrale Wissensdatei; bereits offene Seiten behalten ihren geladenen Stand bis zum Neuladen.

## Adressen nach der Freigabe

- Demo: https://galgental9ps-png.github.io/chatavatar-databank/
- Editor: https://galgental9ps-png.github.io/chatavatar-databank/admin.html
- JSON: https://galgental9ps-png.github.io/chatavatar-databank/knowledge/tva.json
- Einbindungsbeispiel: https://galgental9ps-png.github.io/chatavatar-databank/embed-beispiel.html
