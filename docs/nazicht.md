# Nazicht van wijzigingen

Elke wijziging aan PlanB72 is een pull request in de openbare repository. Niets wordt rechtstreeks op `main` gezet.

## Hoeveel nalezers

| Soort wijziging | Paden | Goedkeuringen | Wie |
| --- | --- | --- | --- |
| Handelingsrichtlijnen | `site/src/content/scenarios/` | 2 | kernteam en inhoudelijk nalezer |
| Eerste hulp, water, medicatie | `site/src/pages/app/eerste-hulp/` | 2 | waarvan één zorgverlener |
| Nucleair en chemisch | `site/src/pages/app/nucleair/` | 2 | waarvan één met vakkennis straling of noodplanning |
| Landinfo (noodnummers, kanalen, zones) | `data/landen/` | 2 | kernteam en landbeheerder |
| Bronnenregister | `data/bronnen/register.json` | 1 | landbeheerder |
| Vertaling | `site/src/i18n/` | 1, voor gepubliceerde talen 2 | moedertaalsprekers |
| Code en vormgeving | overige | 1 | kernteam |

De auteur van een wijziging telt nooit mee als nalezer.

## Hoe het afgedwongen wordt

1. `.github/CODEOWNERS` vraagt automatisch de juiste teams om een review.
2. De workflow `inhoud` (`.github/workflows/inhoud.yml`):
   - controleert dat elke scenariokaart een bron heeft die in het bronnenregister staat;
   - controleert dat elk noodnummer en kanaal een bron heeft;
   - controleert dat status `nagekeken` of `officieel` een nalezer vermeldt;
   - zet labels en telt de goedkeuringen; te weinig goedkeuringen laat de controle falen.
3. Branch protection op `main` (in te stellen in de GitHub-organisatie):
   - pull request verplicht, minstens 1 goedkeuring, review van code owners verplicht;
   - verplichte controles: `inhoud`, `bouwen`;
   - geen rechtstreekse pushes, ook niet voor beheerders.

## Statussen van een tekst

| Status | Betekenis | Wat de app toont |
| --- | --- | --- |
| `concept` | Eigen samenvatting van een officiële bron, nog niet gevalideerd | Melding "Status: concept" |
| `nagekeken` | Gevalideerd door een deskundige; `nagekeken_door` vermeldt naam en functie | Naam en datum onder de tekst |
| `officieel` | Letterlijk overgenomen met toestemming van de bron | Bron en datum |

## Lokaal controleren

```bash
python3 pipeline/controleer_inhoud.py
```
