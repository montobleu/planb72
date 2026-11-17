# Meehelpen aan PlanB72

Je hoeft geen arts of programmeur te zijn. Er zijn vier soorten bijdragen, elk met een eigen controle.

| Soort | Voorbeeld | Wie keurt goed | Hoe |
| --- | --- | --- | --- |
| Kaartdata | Een ontbrekend ziekenhuis, openingsuren van een parking | Niemand bij ons | Verbeter OpenStreetMap zelf. De volgende build neemt het over. |
| Bron voorstellen | Een nieuwe noodbrochure of dataset | Landbeheerder | Eén regel in `data/bronnen/register.json`, met licentie en toestemmingsstatus. |
| Vertaling | Interface in het Frans | Taalnalezer | Komt via Weblate. |
| Code | Een fout in de kaart | Kernteam | Pull request; de build controleert opslagbudgetten. |

## Wat we niet aanvaarden

- Eigen medische, nucleaire of veiligheidsadviezen. Elke inhoudelijke zin moet terug te voeren zijn op een bron uit het register.
- Privékelders, woonadressen of militaire installaties in gebruik.
- Reclame, affiliate-links of links naar winkels.

## Inhoud wijzigen

Scenariokaarten staan in `site/src/content/scenarios/`. Elke kaart heeft een `status`:

- `concept`: eigen samenvatting van een officiële bron, nog niet nagelezen. De app toont een gele melding.
- `nagekeken`: nagelezen door iemand met vakkennis (`nagekeken_door` invullen).
- `officieel`: letterlijk overgenomen met toestemming.

Wijzigingen aan eerste hulp, water, medicatie en nucleair vragen twee goedkeuringen, waarvan één van iemand met vakkennis.
