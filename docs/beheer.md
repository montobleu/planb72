# Beheeromgeving

Onder `/beheer/` kijken beheerders en nalezers na wat via GitHub binnenkomt: pull requests en issues op [github.com/montobleu/planb72](https://github.com/montobleu/planb72). Ze zien per pull request wat er inhoudelijk verandert, hoeveel goedkeuringen nodig zijn en of de controles slagen, en ze kunnen goedkeuren, wijzigingen vragen, reageren en samenvoegen. Voor issues: labelen, toewijzen, omzetten naar een taak en sluiten. Claude kan helpen bij het nazicht, maar telt nooit als goedkeuring.

De beheeromgeving hoort niet bij de offline app: ze staat niet in de service worker, wordt niet geïndexeerd (`noindex` en `X-Robots-Tag`) en staat niet in `/llms.txt`.

Ze draait als **aparte Worker op een eigen hostnaam**: dezelfde code (`site/worker/`) en dezelfde build, maar uitgerold als omgeving `beheer` in `site/wrangler.jsonc` (Worker `planb72-beheer`, nu `https://planb72-beheer.bram-664.workers.dev/beheer/`, later bijvoorbeeld `beheer.planb72.org`). De publieke site stuurt `/beheer/` daarheen door (`BEHEER_URL`). Waarom apart: de publieke pagina's laden het statistiekscript en laten inline scripts toe. Op dezelfde origin zou zo'n script, als het ooit gekaapt wordt, met de sessie van een aangemelde nalezer kunnen goedkeuren of samenvoegen. Op de beheerhost draait alleen `/beheer/` met de stijlen, scripts en lettertypes die het nodig heeft; al het andere wordt doorgestuurd naar `/beheer/`.

## Wat je ziet

| Pagina | Inhoud |
| --- | --- |
| `/beheer/` | Open pull requests met soort wijziging, labels, goedkeuringen tegenover het vereiste aantal en de controles `inhoud` en `bouwen`. Open issues met soort (fout melden, bron voorstellen, taak), labels en toewijzing. |
| `/beheer/pr/?nr=12` | Scenario's, gidsen en eerste hulp naast elkaar oud en nieuw, met gewijzigde woorden gemarkeerd. Apart uitgelicht: gewijzigde noodnummers en kanalen, bronnen die bij komen of verdwijnen (en of ze in het register staan), nieuwe bronnen in `data/bronnen/register.json` met licentie en toestemming, mogelijke doseringen, gewijzigde getallen en een statuswijziging (`concept` naar `nagekeken`). Daaronder het nazicht door Claude, de reviews en de acties. |
| `/beheer/issue/?nr=5` | De ingevulde velden van het formulier, bij een voorgestelde bron of ze al in het register staat, de reacties en de acties. |

### Hoe goedkeuringen geteld worden

Zoals de workflow `inhoud` (`.github/workflows/inhoud.yml`) telt per nalezer de laatste review en telt de auteur niet mee. De beheeromgeving is strenger: een goedkeuring telt alleen als ze komt van iemand met schrijfrechten (eigenaar, lid of medewerker) en gegeven is op de laatste commit. Zo tellen accounts van buitenaf niet mee, en vervalt een goedkeuring als er daarna nog iets gewijzigd wordt. Zet in de branch protection van `main` ook "Dismiss stale pull request approvals when new commits are pushed" aan, zodat GitHub hetzelfde doet.

Hoeveel goedkeuringen nodig zijn, volgt de tabel in [nazicht.md](nazicht.md); de regels staan in `site/public/beheer/verschil.js` en zijn dezelfde als `KRITIEK` en `GEWOON` in `pipeline/controleer_inhoud.py`. Wijzig je de ene, wijzig dan ook de andere. Kan niet elk gewijzigd bestand gelezen worden (meer dan 300), dan rekent de beheeromgeving met twee nalezers.

De controles `inhoud` en `bouwen` tellen alleen als ze van GitHub Actions komen, uit `.github/workflows/inhoud.yml` en `.github/workflows/site.yml`. Een run met dezelfde naam uit een andere workflow telt niet.

"Alleen reageren" in de beheeromgeving plaatst gewoon commentaar, geen review. Dat is bewust: de workflow telt de laatste review per persoon, dus een review van het type "commentaar" na een goedkeuring zou die goedkeuring laten vervallen.

### Samenvoegen

De knop werkt pas als alles klopt: genoeg goedkeuringen, geen openstaande vraag om wijzigingen, controle `inhoud` geslaagd (en `bouwen` als die draait), geen conflicten, geen concept, alle bestanden gelezen. Een pull request die de controle zelf wijzigt (`.github/workflows/`, `.github/CODEOWNERS` of `pipeline/controleer_inhoud.py`) kan niet via de beheeromgeving samengevoegd worden: de workflow draait dan met de versie uit die pull request, dus de uitkomst zegt niets. Kijk zo'n wijziging apart na en voeg ze samen op GitHub. De Worker gaat dat opnieuw na voor hij samenvoegt, en geeft de commit mee: is er intussen iets bij gekomen, dan weigert GitHub. De branch protection op GitHub blijft daarbovenop gelden.

### Een issue omzetten naar een taak

Het issue krijgt het label `taak` (wordt aangemaakt als het nog niet bestaat), `te beoordelen` gaat eraf, en er komt een reactie met een checklist van de volgende stappen. Optioneel wijs je iemand toe. De repository staat op een persoonlijk account; de issuetypes van GitHub bestaan alleen voor organisaties.

## Claude als hulp bij het nazicht

Er zijn twee manieren.

**1. De knop "Laat Claude nakijken" op een pull request.** De Worker haalt `docs/schrijfwijzer.md` en `docs/nazicht.md` van de doelbranch (een pull request kan de regels dus niet voor zichzelf versoepelen), de gewijzigde inhoud (hooguit 10 bestanden) en de bronpagina's (hooguit 10, eerst de nieuwe bronnen; pdf's worden als pdf meegestuurd). Claude (`claude-opus-5-5`) beoordeelt of elke bewering met de bron klopt, of er doseringen in staan, of getallen, telefoonnummers en frequenties gelijk zijn aan de bron, of iets botst met het Belgische advies en of de toon zakelijk is. Het resultaat is een lijst bevindingen met ernst (hoog, middel, laag), bestand en regel, en de regel uit de schrijfwijzer of het nazicht.

De nalezer kan het resultaat als commentaar op de pull request plaatsen. Dat commentaar begint met "Hulp van Claude bij het nazicht", vermeldt wie het opvroeg en zegt dat het niet telt als goedkeuring. Het is een gewone reactie, nooit een review. De Worker ondertekent het resultaat (geldig voor de nalezer die het opvroeg, een dag lang), zodat alleen wat Claude echt teruggaf onder die titel geplaatst kan worden. Links, beelden, vermeldingen en andere Markdown in de tekst van Claude worden geneutraliseerd en adressen staan als code: een pull request of bronpagina die Claude probeert te sturen, kan zo geen aanklikbare link onder het account van de nalezer zetten.

Bronpagina's worden alleen via https opgehaald, met hooguit vijf omleidingen, 3 MB per pagina en 8 MB per pdf.

Wat naar Anthropic gaat: de tekst van de pull request, de gewijzigde bestanden, de nazichtregels en de opgehaalde bronpagina's. Geen GitHub-token, geen cookies. Na afloop zie je het verbruik in tokens.

**2. "@claude" in een issue of pull request.** De workflow `.github/workflows/claude.yml` gebruikt de officiële [Claude Code GitHub Action](https://github.com/anthropics/claude-code-action). Schrijf bijvoorbeeld in een reactie: `@claude vergelijk de nummers in data/landen/be.json met de bronpagina's`. Alleen de eigenaar en medewerkers kunnen dit starten. Claude antwoordt in een reactie, kan bronpagina's openen en `pipeline/controleer_inhoud.py` draaien, en kan op verzoek een wijziging voorstellen op een branch. Het keurt nooit goed en voegt nooit samen. Bij pull requests van forks mag het geen code uit de checkout uitvoeren (`restrict_untrusted_prs`).

## Instellen

Je hebt drie dingen nodig: een GitHub OAuth App, een Anthropic API-sleutel en de secrets in Cloudflare en GitHub. Zet sleutels nooit in de repository, in een issue of in een chat.

### 1. GitHub OAuth App

1. Ga naar GitHub, **Settings**, **Developer settings**, **OAuth Apps**, **New OAuth App** (op het account `montobleu`).
2. Vul in:
   - Application name: `PlanB72 beheer`
   - Homepage URL: `https://planb72.org` (of het workers.dev-adres zolang het domein niet gekoppeld is)
   - Authorization callback URL: `https://planb72-beheer.bram-664.workers.dev/beheer/terug/` (de hostnaam van de beheer-Worker; later bijvoorbeeld `https://beheer.planb72.org/beheer/terug/`)
   - Enable Device Flow: niet aanvinken.
3. Klik **Register application**, noteer de **Client ID** en maak met **Generate a new client secret** een secret.

Een OAuth App heeft één callback-adres. Verhuist het beheer naar een eigen domein, pas dan het callback-adres aan, en `BEHEER_URL` in `site/wrangler.jsonc`. Voor lokaal testen maak je een tweede app.

De beheeromgeving vraagt de scope `public_repo` (de repository is openbaar): nodig om reviews, reacties, labels en samenvoegen te doen. Wordt de repository privé, zet dan `BEHEER_SCOPE` in `site/wrangler.jsonc` op `repo`.

Toegang krijgt alleen wie schrijfrechten heeft op de repository (GitHub `permissions.push`). Voeg nalezers toe via **Settings**, **Collaborators** van de repository. Wie zich aanmeldt zonder schrijfrechten, krijgt een melding en het token wordt meteen ingetrokken. De rechten worden elke vijf minuten en bij elke actie opnieuw nagegaan.

### 2. Anthropic API-sleutel

Maak in de [Claude Console](https://platform.claude.com) een API-sleutel, liefst in een eigen workspace met een bestedingslimiet. Gebruik voor de Worker en voor de GitHub Action bij voorkeur twee aparte sleutels, zodat je ze apart kunt intrekken.

### 3. De beheer-Worker en zijn secrets

De beheer-Worker wordt mee uitgerold door de workflow `site.yml` (stap "Beheeromgeving publiceren") en door `npm run publiceren`. Alleen de beheer-Worker, in `site/` na `npm run build`:

```bash
npx wrangler deploy --env beheer
```

De secrets horen bij die Worker, dus altijd met `--env beheer`:

```bash
npx wrangler secret put GITHUB_CLIENT_ID --env beheer
```

```bash
npx wrangler secret put GITHUB_CLIENT_SECRET --env beheer
```

```bash
npx wrangler secret put SESSIE_GEHEIM --env beheer
```

```bash
npx wrangler secret put ANTHROPIC_API_KEY --env beheer
```

Wrangler vraagt de waarde; ze komt niet in je shellgeschiedenis. Voor `SESSIE_GEHEIM` neem je een lange willekeurige waarde (minstens 32 tekens), bijvoorbeeld de uitvoer van:

```bash
openssl rand -base64 48
```

Een nieuw `SESSIE_GEHEIM` meldt iedereen af. `ANTHROPIC_API_KEY` mag ontbreken: dan werkt alles behalve de knop "Laat Claude nakijken". Ontbreekt een van de andere drie, dan toont `/beheer/` welke.

De repository en de scope staan als gewone variabelen in `site/wrangler.jsonc` onder `env.beheer` (`BEHEER_REPO`, `BEHEER_SCOPE`). De publieke Worker heeft alleen `BEHEER_URL`, het adres waarnaar `/beheer/` doorgestuurd wordt.

### 4. Secret en app voor de workflow "@claude"

1. Repository, **Settings**, **Secrets and variables**, **Actions**, **New repository secret**: naam `ANTHROPIC_API_KEY`.
2. Installeer de [Claude GitHub App](https://github.com/apps/claude) op de repository. De action gebruikt ze om als Claude te reageren. (In Claude Code kan dat ook met `/install-github-app`.)

### 5. Lokaal testen

Maak een tweede OAuth App met callback `http://localhost:8787/beheer/terug/`. Kopieer `site/.dev.vars.voorbeeld` naar `site/.dev.vars` (staat in `.gitignore`) en vul de waarden in. Dan:

```bash
cd site && npm run build && npx wrangler dev --env beheer
```

Open `http://localhost:8787/beheer/`. Zonder `.dev.vars` toont de pagina welke instellingen ontbreken. Gewoon `npx wrangler dev` (zonder `--env beheer`) start de publieke site, die `/beheer/` doorstuurt naar de uitgerolde beheer-Worker.

## Beveiliging

- Elke actie gebeurt met het GitHub-token van de nalezer zelf. De Worker bewaart niets: het token zit versleuteld (AES-GCM, sleutel afgeleid van `SESSIE_GEHEIM`) in een cookie die alleen voor de beheerhost en `/beheer/` geldt (`HttpOnly`, `Secure`, `SameSite=Lax`, 8 uur). Afmelden trekt het token in bij GitHub. De publieke site en de app krijgen geen cookie.
- Het beheer draait op een eigen hostnaam, los van de publieke site en het statistiekscript (zie boven).
- Aanmelden met OAuth `state` en PKCE. Na het aanmelden alleen terug naar een pagina onder `/beheer/`.
- Schrijfacties vragen een eigen kop en dezelfde herkomst; formulieren van andere sites werken niet.
- Strikte Content-Security-Policy: alleen scripts van de eigen site, geen inline scripts, Trusted Types verplicht. Door GitHub gerenderde tekst wordt getoond met de Sanitizer API van de browser; waar die ontbreekt, als platte tekst.
- De inhoud van pull requests en bronpagina's is voor Claude materiaal om te beoordelen, geen opdracht. Bevindingen blijven hulp: een mens beslist.

## Grenzen

- Het overzicht toont de 50 laatst bijgewerkte pull requests en issues.
- Een pull request met meer dan 40 inhoudsbestanden toont de rest op GitHub; GitHub geeft hooguit 300 gewijzigde bestanden terug.
- Workers Free laat 50 aanvragen naar buiten per aanvraag toe. Daarom laadt de browser de bestanden een voor een en stuurt het nazicht door Claude hooguit 10 bestanden en 10 bronpagina's mee.
- Bronpagina's die alleen met JavaScript te lezen zijn of bots weren, kunnen niet geladen worden. Het resultaat vermeldt welke.

## Onderhoud

- **De versie van de action bijwerken.** `claude.yml` gebruikt een vaste commit met de versie als commentaar. Kies een nieuwe release op [github.com/anthropics/claude-code-action/releases](https://github.com/anthropics/claude-code-action/releases), lees wat er verandert en vervang de commit en het commentaar.
- **Het model.** `claude-opus-5-5` staat in `site/worker/beheer/claude.js` en in `claude.yml`.
- **Nazichtregels.** Paden en aantallen staan in `site/public/beheer/verschil.js` en in `pipeline/controleer_inhoud.py`.
