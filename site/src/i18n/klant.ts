// Teksten die de scripts in de browser nodig hebben, per taal. Klein gehouden:
// dit bestand komt mee in de JavaScript van de app. De taal volgt <html lang>.
import { isTaal, LOCALE, type Taal } from './talen';

const nl = {
  windstreken: ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'],
  net: { online: 'Verbinding: online', offline: 'Verbinding: offline', titelOnline: 'Online', titelOffline: 'Offline. PlanB72 werkt verder met wat op dit toestel staat.' },
  kleurschema: { nuDonker: '(nu donker)', nuLicht: '(nu licht)' },
  zoeken: { nietBeschikbaar: 'Zoeken is niet beschikbaar in deze versie.', niets: 'Niets gevonden.' },
  kompas: { geen: 'Geen kompas op dit toestel', geenToestemming: 'Geen toestemming' },
  noodplan: { bewaard: 'Bewaard op dit toestel.', nietBewaard: 'Kon niet bewaren (privévenster of volle opslag?).', wissen: 'Het hele noodplan wissen?' },
  notities: { verwijderen: 'Verwijderen', vraag: 'Deze notitie verwijderen?' },
  nucleair: {
    evacuatie: 'evacuatiezone', schuilen: 'schuil- en jodiumzone', uitbreiding: 'uitbreidingszone',
    kop: ['Site', 'Afstand', 'Richting', 'Binnen'],
    vogelvlucht: (pos: string) => `Afstand in vogelvlucht vanaf ${pos}.`,
    zoeken: 'Positie zoeken…', geen: 'Geen positie beschikbaar. Geef coördinaten in.', laatste: 'Laatste positie',
  },
  signalen: { lamp: 'SOS met zaklamp', stop: 'Stop zaklamp', geenLamp: 'Zaklamp niet beschikbaar' },
  voorraad: {
    liter: (n: string) => `${n} liter water`,
    som: (m: number, d: number, l: number, packs: number) => `${m} × ${d} dagen × ${l} liter. Dat zijn ongeveer ${packs} packs van 6 liter.`,
    dieren: (n: number, d: number) => `Plus water en voer voor ${n} huisdier${n === 1 ? '' : 'en'} voor ${d} dagen.`,
  },
  landen: {
    verouderd: 'Oude kaarten op dit toestel (vervangen door een nieuwere versie)',
    gekozen: (namen: string) => `Gekozen: ${namen}.`,
    minstensEen: 'Kies minstens één land.',
    rekenland: (l: string) => `De planner rekent met de waarde voor ${l}, het eerste land dat je koos.`,
    volgensPlanning: (l: string) => `Volgens de planning van ${l}`,
    zonesGelden: 'De zones gelden op het grondgebied van het land dat ze plant.',
    verwijderBasis: (l: string) => `Het basispakket ${l} van dit toestel verwijderen? De kaartlagen van dit land werken dan niet meer offline.`,
    downloaden: 'Downloaden',
    groepLand: (l: string) => `${l}: overzicht en standaard`,
    groepStraat: (l: string) => `${l}: straatniveau`,
    andere: 'Andere landen op dit toestel',
    soort: { overzicht: 'overzicht', standaard: 'standaard', straatniveau: 'straatniveau' } as Record<string, string>,
    uitleg: {} as Record<string, string>,
  },
  pakket: {
    opToestel: 'op dit toestel',
    bestanden: (n: number, datum?: string) => `${n} bestanden${datum ? `, kaartdata van ${datum}` : ''}.`,
    bijwerken: 'Bijwerken', bijwerkenOffline: 'Bijwerken (geen verbinding)',
    nietOffline: 'nog niet offline', nietOfflineTekst: 'Download het pakket zolang je verbinding hebt.',
    geenOpslag: 'Deze browser laat geen offline opslag toe (privévenster?).',
    geenVerbinding: 'Geen verbinding. Probeer later opnieuw.',
    downloaden: (naam: string, mb: string, verwacht?: string) => `Downloaden: ${naam} (${mb}${verwacht ? ` van ongeveer ${verwacht}` : ''})`,
    mislukt: (n: number) => `${n} bestand(en) niet gelukt`, opnieuw: 'Probeer opnieuw.',
    verwijderVraag: 'Het pakket van dit toestel verwijderen? De kaart werkt dan niet meer offline.',
    rij: {
      verbinding: 'Verbinding', online: 'online', offline: 'offline',
      opslag: 'Opslag gebruikt door PlanB72', ruimte: (mb: string) => ` (ruimte tot ${mb})`,
      beschermd: 'Opslag beschermd tegen wissen', ja: 'ja', nee: 'nee (de browser kan het pakket wissen bij weinig ruimte)',
      batterij: 'Batterij', laadt: ', laadt', gps: 'Gps', gpsJa: 'aanwezig (vraagt toestemming)', gpsNee: 'niet beschikbaar',
      app: 'Offline app', appJa: 'actief: de app werkt offline', appNee: 'nog niet actief (herlaad de pagina één keer)',
    },
    geinstalleerd: 'PlanB72 staat al op je beginscherm.',
    deelTekst: 'Gratis noodbibliotheek die werkt zonder internet.', gekopieerd: 'Link gekopieerd.',
    kaarten: {
      geenLijst: 'De lijst met kaarten is niet beschikbaar. Open deze pagina één keer met verbinding.',
      samen: (n: number, mb: string) => `Op dit toestel: ${n} kaart(en), samen ${mb}.`,
      groepen: { europa: 'Europa', belgie: 'België', regio: "Regio's op straatniveau" },
      zoom: (z: number) => `tot zoomniveau ${z}`,
      verwijderen: 'Verwijderen', downloaden: 'Downloaden', annuleren: 'Annuleren',
      verwijderVraag: (naam: string) => `${naam} van dit toestel verwijderen?`,
      geenVerbinding: 'Geen verbinding.',
      groot: (naam: string, mb: string) => `${naam} is ${mb}. Doorgaan? Gebruik bij voorkeur wifi.`,
      mislukt: (naam: string) => `Download van ${naam} mislukt. Probeer opnieuw.`,
    },
  },
  kaart: {
    geenKaart: 'Geen kaart op dit toestel. Download een kaartpakket via Instellingen.',
    offline: (namen: string) => `Offline: ${namen}.`,
    serverWeg: 'Geen verbinding met de server: de kaart op dit toestel wordt gebruikt.',
    niets: 'Geen verbinding en geen kaart op dit toestel. Download een kaartpakket via Instellingen.',
    onvolledig: 'De kaart kon niet volledig geladen worden.',
    laagNiet: (naam: string) => `Laag "${naam}" is niet op dit toestel. Download het pakket.`,
    zonesEnAfstand: 'Zones en afstand', spoed: 'spoed', open: 'Open:', toegang: 'Toegang:',
    bekijk: 'bekijk of verbeter', kloptNiet: 'klopt niet',
    herkomst: { officieel: 'Officieel', nagekeken: 'Nagekeken', osm: 'OpenStreetMap' } as Record<string, string>,
    nagekeken: (datum: string) => `door PlanB72, ${datum}`, opgehaald: (datum: string) => `stand ${datum}`, bewijs: 'bron',
    meldKnop: 'Klopt niet of gesloten?', kiesOpKaart: 'Tik op de kaart waar de plek is.', bewaard: 'Melding bewaard op dit toestel.',
    versturen: 'Versturen via GitHub', verwijderen: 'Verwijderen', wachtOpVerbinding: 'Geen verbinding: verstuur zodra je online bent.',
    wat: { ontbreekt: 'ontbreekt', kloptNiet: 'klopt niet', gesloten: 'gesloten' } as Record<string, string>,
    praktijk: { praktijk: 'Zeker: ingeschreven vestiging met een handelsnaam of van een vennootschap. Niet zeker: openingsuren en of ze nu open is.', onzeker: 'Zeker: hier is een dierenarts ingeschreven. Niet zeker: of hier een praktijk is die je kunt bezoeken (mogelijk een thuisadres of een dierenarts zonder vaste praktijk). Bel eerst.' } as Record<string, string>,
    positieZoeken: 'Positie zoeken…', geenGps: 'Geen gps; vanaf het midden van de kaart.',
  },
  // Namen van de kaartpakketten; ontbreekt er een, dan geldt de naam uit kaarten.json.
  kaartpakketten: {} as Record<string, [string, string]>,
};

type Klant = typeof nl;

const STRAAT = { fr: 'Rues, bâtiments et chemins', de: 'Straßen, Gebäude und Wege', en: 'Streets, buildings and paths' };

const fr: Klant = {
  windstreken: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
  net: { online: 'Connexion : en ligne', offline: 'Connexion : hors ligne', titelOnline: 'En ligne', titelOffline: 'Hors ligne. PlanB72 continue de fonctionner avec ce qui se trouve sur cet appareil.' },
  kleurschema: { nuDonker: '(actuellement sombre)', nuLicht: '(actuellement clair)' },
  zoeken: { nietBeschikbaar: "La recherche n'est pas disponible dans cette version.", niets: 'Aucun résultat.' },
  kompas: { geen: 'Pas de boussole sur cet appareil', geenToestemming: 'Pas d’autorisation' },
  noodplan: { bewaard: 'Enregistré sur cet appareil.', nietBewaard: "Impossible d'enregistrer (navigation privée ou stockage plein ?).", wissen: "Effacer tout le plan d'urgence ?" },
  notities: { verwijderen: 'Supprimer', vraag: 'Supprimer cette note ?' },
  nucleair: {
    evacuatie: "zone d'évacuation", schuilen: "zone de mise à l'abri et d'iode", uitbreiding: "zone d'extension",
    kop: ['Site', 'Distance', 'Direction', 'À l’intérieur de'],
    vogelvlucht: (pos: string) => `Distance à vol d'oiseau depuis ${pos}.`,
    zoeken: 'Recherche de la position…', geen: 'Aucune position disponible. Saisissez des coordonnées.', laatste: 'Dernière position',
  },
  signalen: { lamp: 'SOS avec la lampe de poche', stop: 'Arrêter la lampe', geenLamp: 'Lampe de poche non disponible' },
  voorraad: {
    liter: (n: string) => `${n} litres d'eau`,
    som: (m: number, d: number, l: number, packs: number) => `${m} × ${d} jours × ${l} litres. Cela fait environ ${packs} packs de 6 litres.`,
    dieren: (n: number, d: number) => `Plus de l'eau et de la nourriture pour ${n} animal${n === 1 ? '' : 'aux'} pendant ${d} jours.`,
  },
  landen: {
    verouderd: 'Anciennes cartes sur cet appareil (remplacées par une version plus récente)',
    gekozen: (namen: string) => `Choisis : ${namen}.`,
    minstensEen: 'Choisissez au moins un pays.',
    rekenland: (l: string) => `Le planificateur utilise la valeur pour ${l}, le premier pays choisi.`,
    volgensPlanning: (l: string) => `Selon la planification ${l}`,
    zonesGelden: 'Les zones s’appliquent sur le territoire du pays qui les planifie.',
    verwijderBasis: (l: string) => `Supprimer le paquet de base ${l} de cet appareil ? Les couches de ce pays ne fonctionneront plus hors ligne.`,
    downloaden: 'Télécharger',
    groepLand: (l: string) => `${l} : aperçu et standard`,
    groepStraat: (l: string) => `${l} : niveau de la rue`,
    andere: 'Autres pays sur cet appareil',
    soort: { overzicht: 'aperçu', standaard: 'standard', straatniveau: 'niveau de la rue' },
    uitleg: { 'Gemeenten, hoofdwegen, rivieren': 'Communes, routes principales, rivières', 'Alle wegen en dorpen, geen gebouwen': 'Toutes les routes et tous les villages, pas de bâtiments', 'Straten, gebouwen en paden': STRAAT.fr },
  },
  pakket: {
    opToestel: 'sur cet appareil',
    bestanden: (n: number, datum?: string) => `${n} fichiers${datum ? `, données cartographiques du ${datum}` : ''}.`,
    bijwerken: 'Mettre à jour', bijwerkenOffline: 'Mettre à jour (pas de connexion)',
    nietOffline: 'pas encore hors ligne', nietOfflineTekst: 'Téléchargez le paquet tant que vous avez une connexion.',
    geenOpslag: "Ce navigateur n'autorise pas le stockage hors ligne (navigation privée ?).",
    geenVerbinding: 'Pas de connexion. Réessayez plus tard.',
    downloaden: (naam: string, mb: string, verwacht?: string) => `Téléchargement : ${naam} (${mb}${verwacht ? ` sur environ ${verwacht}` : ''})`,
    mislukt: (n: number) => `${n} fichier(s) non téléchargé(s)`, opnieuw: 'Réessayez.',
    verwijderVraag: 'Supprimer le paquet de cet appareil ? La carte ne fonctionnera plus hors ligne.',
    rij: {
      verbinding: 'Connexion', online: 'en ligne', offline: 'hors ligne',
      opslag: 'Stockage utilisé par PlanB72', ruimte: (mb: string) => ` (espace jusqu'à ${mb})`,
      beschermd: 'Stockage protégé contre l’effacement', ja: 'oui', nee: 'non (le navigateur peut effacer le paquet en cas de manque de place)',
      batterij: 'Batterie', laadt: ', en charge', gps: 'GPS', gpsJa: 'présent (demande une autorisation)', gpsNee: 'non disponible',
      app: 'Application hors ligne', appJa: "active : l'application fonctionne hors ligne", appNee: 'pas encore active (rechargez la page une fois)',
    },
    geinstalleerd: "PlanB72 est déjà sur votre écran d'accueil.",
    deelTekst: "Bibliothèque d'urgence gratuite qui fonctionne sans internet.", gekopieerd: 'Lien copié.',
    kaarten: {
      geenLijst: "La liste des cartes n'est pas disponible. Ouvrez cette page une fois avec une connexion.",
      samen: (n: number, mb: string) => `Sur cet appareil : ${n} carte(s), au total ${mb}.`,
      groepen: { europa: 'Europe', belgie: 'Belgique', regio: 'Régions au niveau de la rue' },
      zoom: (z: number) => `jusqu'au niveau de zoom ${z}`,
      verwijderen: 'Supprimer', downloaden: 'Télécharger', annuleren: 'Annuler',
      verwijderVraag: (naam: string) => `Supprimer ${naam} de cet appareil ?`,
      geenVerbinding: 'Pas de connexion.',
      groot: (naam: string, mb: string) => `${naam} fait ${mb}. Continuer ? Utilisez de préférence le wifi.`,
      mislukt: (naam: string) => `Échec du téléchargement de ${naam}. Réessayez.`,
    },
  },
  kaart: {
    geenKaart: 'Aucune carte sur cet appareil. Téléchargez un paquet de cartes dans les Réglages.',
    offline: (namen: string) => `Hors ligne : ${namen}.`,
    serverWeg: 'Pas de connexion avec le serveur : la carte de cet appareil est utilisée.',
    niets: 'Pas de connexion et aucune carte sur cet appareil. Téléchargez un paquet de cartes dans les Réglages.',
    onvolledig: "La carte n'a pas pu être chargée entièrement.",
    laagNiet: (naam: string) => `La couche « ${naam} » n'est pas sur cet appareil. Téléchargez le paquet.`,
    zonesEnAfstand: 'Zones et distance', spoed: 'urgences', open: 'Ouvert :', toegang: 'Accès :',
    bekijk: 'voir ou corriger', kloptNiet: 'signaler une erreur',
    herkomst: { officieel: 'Officiel', nagekeken: 'Vérifié', osm: 'OpenStreetMap' } as Record<string, string>,
    nagekeken: (datum: string) => `par PlanB72, ${datum}`, opgehaald: (datum: string) => `état au ${datum}`, bewijs: 'source',
    meldKnop: 'Incorrect ou fermé ?', kiesOpKaart: "Touchez la carte à l'endroit du lieu.", bewaard: 'Signalement enregistré sur cet appareil.',
    versturen: 'Envoyer via GitHub', verwijderen: 'Supprimer', wachtOpVerbinding: 'Pas de connexion : envoyez dès que vous êtes en ligne.',
    wat: { ontbreekt: 'manquant', kloptNiet: 'incorrect', gesloten: 'fermé' } as Record<string, string>,
    praktijk: { praktijk: "Certain : établissement inscrit avec un nom commercial ou d'une société. Pas certain : les heures d'ouverture et s'il est ouvert maintenant.", onzeker: "Certain : un vétérinaire est inscrit à cette adresse. Pas certain : qu'il y ait un cabinet accessible (peut-être un domicile ou un vétérinaire sans cabinet fixe). Appelez d'abord." } as Record<string, string>,
    positieZoeken: 'Recherche de la position…', geenGps: 'Pas de GPS ; à partir du centre de la carte.',
  },
  kaartpakketten: {
    'eu-z6': ['Europe, aperçu', 'Pays, grandes villes et autoroutes'],
    'eu-z7': ['Europe, aperçu détaillé', 'Aussi les villes moyennes et les routes principales'],
    'be-z9': ['Belgique, aperçu', 'Communes, routes principales, rivières'],
    'be-z12': ['Belgique, standard', 'Toutes les routes et tous les villages, pas de bâtiments'],
    'be-wvl-z15': ['Flandre-Occidentale, niveau de la rue', STRAAT.fr],
    'be-ovl-z15': ['Flandre-Orientale, niveau de la rue', STRAAT.fr],
    'be-ant-z15': ['Anvers, niveau de la rue', STRAAT.fr],
    'be-lim-z15': ['Limbourg, niveau de la rue', STRAAT.fr],
    'be-bra-z15': ['Brabant et Bruxelles, niveau de la rue', 'Brabant flamand, Bruxelles et Brabant wallon'],
    'be-hen-z15': ['Hainaut, niveau de la rue', STRAAT.fr],
    'be-nam-z15': ['Namur, niveau de la rue', STRAAT.fr],
    'be-lui-z15': ['Liège, niveau de la rue', STRAAT.fr],
    'be-lux-z15': ['Luxembourg (province), niveau de la rue', STRAAT.fr],
  },
};

const de: Klant = {
  windstreken: ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'],
  net: { online: 'Verbindung: online', offline: 'Verbindung: offline', titelOnline: 'Online', titelOffline: 'Offline. PlanB72 funktioniert mit dem weiter, was auf diesem Gerät gespeichert ist.' },
  kleurschema: { nuDonker: '(derzeit dunkel)', nuLicht: '(derzeit hell)' },
  zoeken: { nietBeschikbaar: 'Die Suche ist in dieser Version nicht verfügbar.', niets: 'Nichts gefunden.' },
  kompas: { geen: 'Kein Kompass auf diesem Gerät', geenToestemming: 'Keine Erlaubnis' },
  noodplan: { bewaard: 'Auf diesem Gerät gespeichert.', nietBewaard: 'Speichern nicht möglich (privates Fenster oder voller Speicher?).', wissen: 'Den gesamten Notfallplan löschen?' },
  notities: { verwijderen: 'Löschen', vraag: 'Diese Notiz löschen?' },
  nucleair: {
    evacuatie: 'Evakuierungszone', schuilen: 'Schutz- und Jodzone', uitbreiding: 'Erweiterungszone',
    kop: ['Standort', 'Entfernung', 'Richtung', 'Innerhalb'],
    vogelvlucht: (pos: string) => `Luftlinie ab ${pos}.`,
    zoeken: 'Standort wird gesucht…', geen: 'Kein Standort verfügbar. Geben Sie Koordinaten ein.', laatste: 'Letzter Standort',
  },
  signalen: { lamp: 'SOS mit Taschenlampe', stop: 'Taschenlampe aus', geenLamp: 'Taschenlampe nicht verfügbar' },
  voorraad: {
    liter: (n: string) => `${n} Liter Wasser`,
    som: (m: number, d: number, l: number, packs: number) => `${m} × ${d} Tage × ${l} Liter. Das sind etwa ${packs} Packungen zu 6 Liter.`,
    dieren: (n: number, d: number) => `Dazu Wasser und Futter für ${n} Haustier${n === 1 ? '' : 'e'} für ${d} Tage.`,
  },
  landen: {
    verouderd: 'Alte Karten auf diesem Gerät (durch eine neuere Version ersetzt)',
    gekozen: (namen: string) => `Gewählt: ${namen}.`,
    minstensEen: 'Wählen Sie mindestens ein Land.',
    rekenland: (l: string) => `Der Planer rechnet mit dem Wert für ${l}, das erste gewählte Land.`,
    volgensPlanning: (l: string) => `Nach der Planung ${l}`,
    zonesGelden: 'Die Zonen gelten auf dem Gebiet des Landes, das sie plant.',
    verwijderBasis: (l: string) => `Das Basispaket ${l} von diesem Gerät löschen? Die Kartenebenen dieses Landes funktionieren dann nicht mehr offline.`,
    downloaden: 'Herunterladen',
    groepLand: (l: string) => `${l}: Übersicht und Standard`,
    groepStraat: (l: string) => `${l}: Straßenebene`,
    andere: 'Andere Länder auf diesem Gerät',
    soort: { overzicht: 'Übersicht', standaard: 'Standard', straatniveau: 'Straßenebene' },
    uitleg: { 'Gemeenten, hoofdwegen, rivieren': 'Gemeinden, Hauptstraßen, Flüsse', 'Alle wegen en dorpen, geen gebouwen': 'Alle Straßen und Dörfer, keine Gebäude', 'Straten, gebouwen en paden': STRAAT.de },
  },
  pakket: {
    opToestel: 'auf diesem Gerät',
    bestanden: (n: number, datum?: string) => `${n} Dateien${datum ? `, Kartendaten vom ${datum}` : ''}.`,
    bijwerken: 'Aktualisieren', bijwerkenOffline: 'Aktualisieren (keine Verbindung)',
    nietOffline: 'noch nicht offline', nietOfflineTekst: 'Laden Sie das Paket herunter, solange Sie eine Verbindung haben.',
    geenOpslag: 'Dieser Browser erlaubt keine Offline-Speicherung (privates Fenster?).',
    geenVerbinding: 'Keine Verbindung. Versuchen Sie es später erneut.',
    downloaden: (naam: string, mb: string, verwacht?: string) => `Herunterladen: ${naam} (${mb}${verwacht ? ` von etwa ${verwacht}` : ''})`,
    mislukt: (n: number) => `${n} Datei(en) nicht geladen`, opnieuw: 'Versuchen Sie es erneut.',
    verwijderVraag: 'Das Paket von diesem Gerät entfernen? Die Karte funktioniert dann nicht mehr offline.',
    rij: {
      verbinding: 'Verbindung', online: 'online', offline: 'offline',
      opslag: 'Von PlanB72 genutzter Speicher', ruimte: (mb: string) => ` (Platz bis ${mb})`,
      beschermd: 'Speicher vor Löschen geschützt', ja: 'ja', nee: 'nein (der Browser kann das Paket bei wenig Platz löschen)',
      batterij: 'Akku', laadt: ', lädt', gps: 'GPS', gpsJa: 'vorhanden (fragt nach Erlaubnis)', gpsNee: 'nicht verfügbar',
      app: 'Offline-App', appJa: 'aktiv: die App funktioniert offline', appNee: 'noch nicht aktiv (laden Sie die Seite einmal neu)',
    },
    geinstalleerd: 'PlanB72 ist bereits auf Ihrem Startbildschirm.',
    deelTekst: 'Kostenlose Notfallbibliothek, die ohne Internet funktioniert.', gekopieerd: 'Link kopiert.',
    kaarten: {
      geenLijst: 'Die Kartenliste ist nicht verfügbar. Öffnen Sie diese Seite einmal mit Verbindung.',
      samen: (n: number, mb: string) => `Auf diesem Gerät: ${n} Karte(n), zusammen ${mb}.`,
      groepen: { europa: 'Europa', belgie: 'Belgien', regio: 'Regionen auf Straßenebene' },
      zoom: (z: number) => `bis Zoomstufe ${z}`,
      verwijderen: 'Entfernen', downloaden: 'Herunterladen', annuleren: 'Abbrechen',
      verwijderVraag: (naam: string) => `${naam} von diesem Gerät entfernen?`,
      geenVerbinding: 'Keine Verbindung.',
      groot: (naam: string, mb: string) => `${naam} ist ${mb} groß. Fortfahren? Nutzen Sie am besten WLAN.`,
      mislukt: (naam: string) => `Herunterladen von ${naam} fehlgeschlagen. Versuchen Sie es erneut.`,
    },
  },
  kaart: {
    geenKaart: 'Keine Karte auf diesem Gerät. Laden Sie ein Kartenpaket über die Einstellungen herunter.',
    offline: (namen: string) => `Offline: ${namen}.`,
    serverWeg: 'Keine Verbindung zum Server: Die Karte auf diesem Gerät wird verwendet.',
    niets: 'Keine Verbindung und keine Karte auf diesem Gerät. Laden Sie ein Kartenpaket über die Einstellungen herunter.',
    onvolledig: 'Die Karte konnte nicht vollständig geladen werden.',
    laagNiet: (naam: string) => `Die Ebene „${naam}“ ist nicht auf diesem Gerät. Laden Sie das Paket herunter.`,
    zonesEnAfstand: 'Zonen und Entfernung', spoed: 'Notaufnahme', open: 'Geöffnet:', toegang: 'Zugang:',
    bekijk: 'ansehen oder verbessern', kloptNiet: 'Fehler melden',
    herkomst: { officieel: 'Amtlich', nagekeken: 'Geprüft', osm: 'OpenStreetMap' } as Record<string, string>,
    nagekeken: (datum: string) => `von PlanB72, ${datum}`, opgehaald: (datum: string) => `Stand ${datum}`, bewijs: 'Quelle',
    meldKnop: 'Falsch oder geschlossen?', kiesOpKaart: 'Tippen Sie auf die Karte, wo der Ort ist.', bewaard: 'Meldung auf diesem Gerät gespeichert.',
    versturen: 'Über GitHub senden', verwijderen: 'Löschen', wachtOpVerbinding: 'Keine Verbindung: senden Sie, sobald Sie online sind.',
    wat: { ontbreekt: 'fehlt', kloptNiet: 'stimmt nicht', gesloten: 'geschlossen' } as Record<string, string>,
    praktijk: { praktijk: 'Sicher: eingetragene Niederlassung mit Handelsnamen oder einer Gesellschaft. Nicht sicher: Öffnungszeiten und ob sie jetzt geöffnet ist.', onzeker: 'Sicher: an dieser Adresse ist ein Tierarzt eingetragen. Nicht sicher: ob es hier eine Praxis gibt, die man aufsuchen kann (vielleicht eine Wohnadresse oder ein Tierarzt ohne feste Praxis). Erst anrufen.' } as Record<string, string>,
    positieZoeken: 'Standort wird gesucht…', geenGps: 'Kein GPS; ab der Kartenmitte.',
  },
  kaartpakketten: {
    'eu-z6': ['Europa, Übersicht', 'Länder, große Städte und Autobahnen'],
    'eu-z7': ['Europa, erweiterte Übersicht', 'Auch mittelgroße Städte und Hauptstraßen'],
    'be-z9': ['Belgien, Übersicht', 'Gemeinden, Hauptstraßen, Flüsse'],
    'be-z12': ['Belgien, Standard', 'Alle Straßen und Dörfer, keine Gebäude'],
    'be-wvl-z15': ['Westflandern, Straßenebene', STRAAT.de],
    'be-ovl-z15': ['Ostflandern, Straßenebene', STRAAT.de],
    'be-ant-z15': ['Antwerpen, Straßenebene', STRAAT.de],
    'be-lim-z15': ['Limburg, Straßenebene', STRAAT.de],
    'be-bra-z15': ['Brabant und Brüssel, Straßenebene', 'Flämisch-Brabant, Brüssel und Wallonisch-Brabant'],
    'be-hen-z15': ['Hennegau, Straßenebene', STRAAT.de],
    'be-nam-z15': ['Namur, Straßenebene', STRAAT.de],
    'be-lui-z15': ['Lüttich, Straßenebene', STRAAT.de],
    'be-lux-z15': ['Luxemburg (Provinz), Straßenebene', STRAAT.de],
  },
};

const en: Klant = {
  windstreken: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  net: { online: 'Connection: online', offline: 'Connection: offline', titelOnline: 'Online', titelOffline: 'Offline. PlanB72 keeps working with what is on this device.' },
  kleurschema: { nuDonker: '(currently dark)', nuLicht: '(currently light)' },
  zoeken: { nietBeschikbaar: 'Search is not available in this version.', niets: 'Nothing found.' },
  kompas: { geen: 'No compass on this device', geenToestemming: 'No permission' },
  noodplan: { bewaard: 'Saved on this device.', nietBewaard: 'Could not save (private window or full storage?).', wissen: 'Clear the whole emergency plan?' },
  notities: { verwijderen: 'Delete', vraag: 'Delete this note?' },
  nucleair: {
    evacuatie: 'evacuation zone', schuilen: 'shelter and iodine zone', uitbreiding: 'extension zone',
    kop: ['Site', 'Distance', 'Direction', 'Within'],
    vogelvlucht: (pos: string) => `Straight-line distance from ${pos}.`,
    zoeken: 'Finding position…', geen: 'No position available. Enter coordinates.', laatste: 'Last position',
  },
  signalen: { lamp: 'SOS with torch', stop: 'Stop torch', geenLamp: 'Torch not available' },
  voorraad: {
    liter: (n: string) => `${n} litres of water`,
    som: (m: number, d: number, l: number, packs: number) => `${m} × ${d} days × ${l} litres. That is about ${packs} packs of 6 litres.`,
    dieren: (n: number, d: number) => `Plus water and food for ${n} pet${n === 1 ? '' : 's'} for ${d} days.`,
  },
  landen: {
    verouderd: 'Old maps on this device (replaced by a newer version)',
    gekozen: (namen: string) => `Chosen: ${namen}.`,
    minstensEen: 'Choose at least one country.',
    rekenland: (l: string) => `The planner uses the value for ${l}, the first country you chose.`,
    volgensPlanning: (l: string) => `According to the planning of ${l}`,
    zonesGelden: 'The zones apply on the territory of the country that plans them.',
    verwijderBasis: (l: string) => `Remove the basic package ${l} from this device? The map layers of this country will then no longer work offline.`,
    downloaden: 'Download',
    groepLand: (l: string) => `${l}: overview and standard`,
    groepStraat: (l: string) => `${l}: street level`,
    andere: 'Other countries on this device',
    soort: { overzicht: 'overview', standaard: 'standard', straatniveau: 'street level' },
    uitleg: { 'Gemeenten, hoofdwegen, rivieren': 'Municipalities, main roads, rivers', 'Alle wegen en dorpen, geen gebouwen': 'All roads and villages, no buildings', 'Straten, gebouwen en paden': STRAAT.en },
  },
  pakket: {
    opToestel: 'on this device',
    bestanden: (n: number, datum?: string) => `${n} files${datum ? `, map data of ${datum}` : ''}.`,
    bijwerken: 'Update', bijwerkenOffline: 'Update (no connection)',
    nietOffline: 'not yet offline', nietOfflineTekst: 'Download the package while you have a connection.',
    geenOpslag: 'This browser does not allow offline storage (private window?).',
    geenVerbinding: 'No connection. Try again later.',
    downloaden: (naam: string, mb: string, verwacht?: string) => `Downloading: ${naam} (${mb}${verwacht ? ` of about ${verwacht}` : ''})`,
    mislukt: (n: number) => `${n} file(s) failed`, opnieuw: 'Try again.',
    verwijderVraag: 'Remove the package from this device? The map will then no longer work offline.',
    rij: {
      verbinding: 'Connection', online: 'online', offline: 'offline',
      opslag: 'Storage used by PlanB72', ruimte: (mb: string) => ` (space up to ${mb})`,
      beschermd: 'Storage protected against clearing', ja: 'yes', nee: 'no (the browser may clear the package when space is low)',
      batterij: 'Battery', laadt: ', charging', gps: 'GPS', gpsJa: 'available (asks for permission)', gpsNee: 'not available',
      app: 'Offline app', appJa: 'active: the app works offline', appNee: 'not yet active (reload the page once)',
    },
    geinstalleerd: 'PlanB72 is already on your home screen.',
    deelTekst: 'Free emergency library that works without internet.', gekopieerd: 'Link copied.',
    kaarten: {
      geenLijst: 'The list of maps is not available. Open this page once with a connection.',
      samen: (n: number, mb: string) => `On this device: ${n} map(s), ${mb} in total.`,
      groepen: { europa: 'Europe', belgie: 'Belgium', regio: 'Regions at street level' },
      zoom: (z: number) => `up to zoom level ${z}`,
      verwijderen: 'Remove', downloaden: 'Download', annuleren: 'Cancel',
      verwijderVraag: (naam: string) => `Remove ${naam} from this device?`,
      geenVerbinding: 'No connection.',
      groot: (naam: string, mb: string) => `${naam} is ${mb}. Continue? Preferably use wifi.`,
      mislukt: (naam: string) => `Download of ${naam} failed. Try again.`,
    },
  },
  kaart: {
    geenKaart: 'No map on this device. Download a map package in Settings.',
    offline: (namen: string) => `Offline: ${namen}.`,
    serverWeg: 'No connection to the server: the map on this device is used.',
    niets: 'No connection and no map on this device. Download a map package in Settings.',
    onvolledig: 'The map could not be loaded completely.',
    laagNiet: (naam: string) => `Layer "${naam}" is not on this device. Download the package.`,
    zonesEnAfstand: 'Zones and distance', spoed: 'emergency department', open: 'Open:', toegang: 'Access:',
    bekijk: 'view or improve', kloptNiet: 'report an error',
    herkomst: { officieel: 'Official', nagekeken: 'Checked', osm: 'OpenStreetMap' } as Record<string, string>,
    nagekeken: (datum: string) => `by PlanB72, ${datum}`, opgehaald: (datum: string) => `as of ${datum}`, bewijs: 'source',
    meldKnop: 'Wrong or closed?', kiesOpKaart: 'Tap the map where the place is.', bewaard: 'Report saved on this device.',
    versturen: 'Send via GitHub', verwijderen: 'Delete', wachtOpVerbinding: 'No connection: send as soon as you are online.',
    wat: { ontbreekt: 'missing', kloptNiet: 'wrong', gesloten: 'closed' } as Record<string, string>,
    praktijk: { praktijk: 'Certain: a registered establishment with a trade name or of a company. Not certain: opening hours and whether it is open now.', onzeker: 'Certain: a vet is registered at this address. Not certain: whether there is a practice you can visit (possibly a home address or a vet without a fixed practice). Call first.' } as Record<string, string>,
    positieZoeken: 'Finding position…', geenGps: 'No GPS; from the centre of the map.',
  },
  kaartpakketten: {
    'eu-z6': ['Europe, overview', 'Countries, major cities and motorways'],
    'eu-z7': ['Europe, extended overview', 'Also medium-sized towns and main roads'],
    'be-z9': ['Belgium, overview', 'Municipalities, main roads, rivers'],
    'be-z12': ['Belgium, standard', 'All roads and villages, no buildings'],
    'be-wvl-z15': ['West Flanders, street level', STRAAT.en],
    'be-ovl-z15': ['East Flanders, street level', STRAAT.en],
    'be-ant-z15': ['Antwerp, street level', STRAAT.en],
    'be-lim-z15': ['Limburg, street level', STRAAT.en],
    'be-bra-z15': ['Brabant and Brussels, street level', 'Flemish Brabant, Brussels and Walloon Brabant'],
    'be-hen-z15': ['Hainaut, street level', STRAAT.en],
    'be-nam-z15': ['Namur, street level', STRAAT.en],
    'be-lui-z15': ['Liège, street level', STRAAT.en],
    'be-lux-z15': ['Luxembourg (province), street level', STRAAT.en],
  },
};

const KLANT: Record<Taal, Klant> = { nl, fr, de, en };

/** De taal van de pagina die nu open is. */
export function paginaTaal(): Taal {
  const l = typeof document === 'undefined' ? 'nl' : document.documentElement.lang;
  return isTaal(l) ? l : 'nl';
}

/** Teksten voor de taal van de pagina. */
export function klant(): Klant {
  return KLANT[paginaTaal()];
}

/** Locale voor toLocaleString in de taal van de pagina. */
export function locale(): string {
  return LOCALE[paginaTaal()];
}

/**
 * Naam en uitleg van een kaartpakket in de taal van de pagina. Eerst de vaste vertaling,
 * anders de Nederlandse naam met het soort pakket vertaald ("Beieren, straatniveau").
 */
export function pakketTekst(p: { id: string; naam: string; omschrijving: string }): [string, string] {
  const k = klant();
  const vast = k.kaartpakketten[p.id];
  if (vast) return vast;
  const m = /^(.*), (overzicht|standaard|straatniveau)$/.exec(p.naam);
  const naam = m ? `${m[1]}, ${k.landen.soort[m[2]] ?? m[2]}` : p.naam;
  const delen = p.omschrijving.split('; ');
  const uitleg = [k.landen.uitleg[delen[0]] ?? delen[0], ...delen.slice(1)].join('; ');
  return [naam, uitleg];
}

/** Een pad binnen de app in de taal van de pagina: '/app/kaart/' -> '/fr/app/kaart/'. */
export function appPad(p: string): string {
  const t = paginaTaal();
  return t === 'nl' ? p : `/${t}${p}`;
}
