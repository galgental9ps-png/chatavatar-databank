# Chatavatar-Datenbank – Projektstand

Stand: 15.11.2026. Bei einem Chatabbruch den aktuellen Stand von `galgental9ps-png/chatavatar-databank` prüfen. Die Anwendung muss nicht neu erstellt werden.

## Öffentliche Ausgabe

- Blaue TVA-Superheldin Tavi mit 16 Posen und einbindbarem Widget.
- 68 hinterlegte Antworten mit Quellen; JSON und identisches Offlinepaket.
- Wissensstudio: Dateiimport, Editor, Vorschau, Export und authentifiziertes Speichern.
- Alle Repository-, Download- und Einbindungsverweise zeigen auf `chatavatar-databank`.
- `body-end.html` enthält den fertigen Code für IONOS; Anleitung: `docs/IONOS.md`.
- Das ursprüngliche Repository `Chatavatar` bleibt privat. Nur die geprüften Anwendungsdateien werden übertragen, ohne dessen Git-Historie.

## Veröffentlichung

Der Workflow `.github/workflows/pages.yml` prüft die Anwendung und veröffentlicht sie über GitHub Pages bei jedem Push auf `main`. Unter **Settings → Pages** ist **GitHub Actions** als Quelle vorgesehen. Vor einem erfolgreichen Deployment und HTTP-Prüfung keine Erreichbarkeit der Pages-Adressen behaupten.

Nach der Freigabe Demo, Editor, Script, Grafik und JSON prüfen. Der Editor schreibt zentral nur mit eigenem GitHub-Zugang. Keine Zugangsdaten in Einbindungscode oder Wissensdatei hinterlegen.

