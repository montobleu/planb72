# Vertalen

De app bestaat in het Nederlands (brontaal), Frans, Duits en Engels: `/app/`, `/fr/app/`, `/de/app/`, `/en/app/`. De taal wordt gekozen in **Instellingen en pakket** en op het toestel onthouden. Alle talen zitten in het offline pakket.

## Waar staat wat

| Wat | Bestand |
| --- | --- |
| Interfaceteksten van de app | `site/src/i18n/app.ts` (server) en `site/src/i18n/klant.ts` (scripts in de browser) |
| Teksten van de website | `site/src/i18n/site.ts` |
| Landinfo (noodnummers, kanalen, nucleair) | `site/src/i18n/land/be.json`, sleutels uit `data/landen/be.json` |
| Laagnamen van de kaart | `site/src/lib/lagen.ts` |
| Scenario's, gidsen, eerste hulp | `site/src/content/<map>/<taal>/<id>.md`, naast het Nederlandse `site/src/content/<map>/<id>.md` |

Ontbreekt een vertaling, dan toont de app de Nederlandse tekst met de melding dat de pagina nog niet vertaald is.

## Frontmatter van een vertaalde tekst

Dezelfde velden als het origineel (`titel`, `volgorde`, `kort`, `stappen`, `niet`, `status`, `datum`, `bronnen`), plus:

```yaml
vertaling: machine          # machine | na te lezen | nagekeken
origineel_datum: "2026-11-17" # datum van de Nederlandse tekst waarvan vertaald werd
# vertaling_nagekeken_door: "Naam, functie"   # verplicht bij vertaling: nagekeken
```

- `machine`: automatisch vertaald (ook met een taalmodel). De app toont "Automatisch vertaald, nog niet nagelezen".
- `na te lezen`: door een mens vertaald, nog niet nagelezen. De app toont dezelfde melding.
- `nagekeken`: nagelezen door een moedertaalspreker; `vertaling_nagekeken_door` vermeldt wie. De app toont de naam.

`status` (concept, nagekeken, officieel) gaat over de inhoud en volgt het Nederlandse origineel.

## Bronnen in de vertaling

- Verwijs naar de officiële pagina **in de taal van de vertaling** als die bestaat: Centre de crise National / Nationales Krisenzentrum / National Crisis Center, risico-info.be, nucleairrisico.be (risquenucleaire.be, nuklearrisiko.be), Centre Antipoisons, Croix-Rouge de Belgique en Rotes Kreuz Belgien voor eerste hulp, FOD Volksgezondheid (SPF Santé publique, FÖD Volksgesundheit).
- Bestaat er geen versie in die taal, houd dan de oorspronkelijke bron.
- Elk domein moet in `data/bronnen/register.json` staan.

## Wat letterlijk gelijk blijft

Getallen, telefoonnummers, frequenties, eenheden en uren blijven gelijk aan het origineel. Alleen de schrijfwijze van de taal mag verschillen: decimaalteken (27,065 MHz of 27.065 MHz), duizendtallen (1.500, 1 500 of 1,500) en uren (13u30, 13h30, 13:30). Schrijf getallen als cijfers als het origineel cijfers gebruikt, en behoud eenheidssymbolen (`l`, `km`, `°C`, `MHz`). `python3 pipeline/controleer_inhoud.py` vergelijkt dit voor elke vertaling en faalt bij een verschil.

## Medisch, nucleair en chemisch

Medische, nucleaire en chemische instructies worden niet stilzwijgend vertaald. Voor deze teksten toont de app in het Frans, Duits en Engels eerst de Nederlandse tekst en de officiële bron in de taal van de gebruiker, en de vertaling pas na een extra waarschuwing. Welke teksten dat zijn, staat in `site/src/lib/inhoud.ts`: alle eerste hulp, de scenario's nucleair, chemisch, CO, drinkwater en pandemie, de gidsen over nucleair en gezondheid, en de gidsen water en jodium. Een tekst kan er ook bij met `gevoelig: true` in de Nederlandse frontmatter.

Zo'n vertaling verschijnt pas zonder waarschuwing wanneer `vertaling: nagekeken` en `status: nagekeken` beide gelden en een zorgverlener of deskundige de vertaling heeft goedgekeurd (zie `docs/nazicht.md`).

## Toon

Dezelfde regels als de schrijfwijzer: zakelijk, kort, gebiedende wijs voor handelingen, geen emoji, geen uitroeptekens. Frans en Duits in de beleefdheidsvorm (vous, Sie), Engels in Brits Engels. Gebruik de Belgische termen (commune, Gemeinde, centrale d'urgence) en de officiële namen van Belgische diensten.

## Nalezen

Vertalingen vragen nalezers die de taal als moedertaal spreken (zie `docs/nazicht.md`). Een nalezer:

1. leest de vertaling naast het Nederlandse origineel;
2. corrigeert waar nodig in het bestand;
3. zet `vertaling: nagekeken` en `vertaling_nagekeken_door: "Naam, functie"`.

Wordt het Nederlandse origineel later gewijzigd, dan moet de vertaling opnieuw bekeken worden; `origineel_datum` toont van welke versie ze komt.
