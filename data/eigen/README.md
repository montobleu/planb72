# Eigen aanvullingen op de kaartlagen

Plekken die ontbreken of niet kloppen in OpenStreetMap en in de officiële bronnen, aangevuld en nagekeken door PlanB72.

- Eén bestand per land en laag: `data/eigen/<land>/<laag>.json`, met een lijst `items`.
- Elk item: `actie` (toevoegen, corrigeren, gesloten), `id`, naam, adres, punt of `doel`, `bron`, `datum`, `ingediend_door` en `nagekeken_door` (twee verschillende personen).
- Wijzigingen gaan via een pull request en vragen twee goedkeuringen (`docs/nazicht.md`).
- `python3 pipeline/controleer_inhoud.py` controleert het schema; `python3 pipeline/verrijken.py BE` neemt de items mee.

Uitleg, voorbeeld en velden: [docs/kaartdata.md](../../docs/kaartdata.md#eigen-aanvullingen-en-correcties). Gepubliceerd onder de ODbL, zoals de rest van de kaartlagen.
