# Rapport d'architecture WoT Eco

## 1. Objet et perimetre
WoT Eco illustre une pile Web of Things moderne composee d'une passerelle logicielle, de services virtuels et d'un tableau de bord temps reel. Le projet cible un scenario de maison connectee qui regroupe eclairage, chauffage, capteurs environnementaux et parametres d'efficacite energetique. Ce rapport decrit:

- l'architecture logicielle et les flux de donnees clefs;
- les choix de conception et les compromis retenus;
- le processus de decouverte et de validation de la solution;
- les mecanismes de securite exposes dans la base de code;
- la logique d'execution des regles d'automatisation;
- la maniere de reproduire la demonstration avec evenements et tests API.

Toutes les sections referencent les modules concrets du depot afin de faciliter les relectures techniques.

## 2. Architecture logicielle

### 2.1 Vues d'ensemble
L'application est construite comme une application React (Vite + TypeScript) avec trois couches principales:

1. **Presentation / UX**: composants React localises dans `components/*` qui affichent les etats, cartes analytiques et controles pour chaque objet connecte.
2. **Services et passerelle virtuelle**: 
   - `services/api.ts` simule les points de terminaison critiques (authentification JWT, analytics), structure les messages d'erreur et reproduit les latences du reseau.
   - `contexts/ThingsContext.tsx` represente la passerelle WoT. Elle gere l'etat canonique des equipements, orchestre la simulation physique (temperature, CO2, mouvement) et heberge le moteur de regles.
3. **Socle transverse**: `contexts/AuthContext.tsx` fournit la securite (faux JWT, scopes) tandis que les textes de l'interface sont directement rediges en francais pour simplifier la demonstration.

Les interactions majeures suivent ce flux:

```
Utilisateur -> Login (components/auth/Login.tsx) -> AuthContext -> apiService.login()
                                         |                                   |
                                         v                                   v
                             session locale + scopes             GatewayError explicite

Dashboard -> useThings() -> ThingsContext -> Moteur de simulation -> Automation events
Analytics -> apiService.getAnalyticsSummary() -> Graphiques Recharts
```

### 2.2 Separation des responsabilites
- **Passerelle**: `ThingsContext` expose des methodes `updateThing`, `toggleAutomation` et `automationEvents`. Cette couche fait office d'orchestrateur et de broker de messages.
- **Services virtualises**: `apiService` imite les reponses REST et garantit un schema stable pour les cartes analytiques.
- **Dashboard**: `components/views/Dashboard.tsx` s'appuie sur les types partages (`types.ts`) pour selectionner un controle specialise (thermostat, lampe, fenetre, etc.). `AutomationStatus.tsx` explique l'etat global et journalise les decisions.

Cette separation permet de substituer facilement la passerelle par une implementation qui consommerait un vrai broker MQTT ou une API REST distante sans toucher a la logique UI.

## 3. Passerelle et services virtuels

### 3.1 Simulation physique
`contexts/ThingsContext.tsx` contient des constantes (CO2, TEMPERATURE, delais d'inactivite) qui definissent le comportement du monde. Un `useEffect` unique:

- met a jour les capteurs toutes les 2 secondes;
- modele un cycle jour/nuit et la temperature exterieure;
- simule les detections de mouvement avec des temps d'activation/inactivation aleatoires;
- ajuste le CO2 en fonction de la presence, de la fenetre, du purificateur et de la dissipation naturelle.

Cette approche rend les mesures replicables et predites, tout en injectant un peu d'aleatoire pour garder la demo vivante.

### 3.2 Moteur de regles
Toujours dans `ThingsContext`, la fonction `runAutomationEngine` applique des regles hierarchisees:

1. **Ventilation de securite CO2**: ouvre la fenetre si le seuil haut est depasse et que l'usager n'a pas force un etat different.
2. **Protection chauffage**: arrete le thermostat lorsque la fenetre est ouverte pour eviter la perte d'energie.
3. **Purificateur**: active la prise intelligente uniquement si la qualite de l'air est mediocre ET que la fenetre reste fermee, afin d'eviter les conflits d'action.
4. **Eclairage pilote par presence**: allume automatiquement la lampe apres mouvement et l'eteint selon un `LAMP_ON_DURATION_MS`.
5. **Mode ECO**: si aucune presence n'est detectee pendant 20 secondes, le thermostat bascule en ECO et les lampes restantes sont eteintes.
6. **Regle de confort**: une detection de mouvement re-active le mode chauffage si la temperature est basse ou si l'utilisateur revient.

Chaque regle est encapsulee dans un bloc logique clairement commente, et `addAutomationEvent` garde les 10 derniers evenements afin d'expliquer chaque decision sur l'interface.

### 3.3 Services virtuels et explicitation des erreurs
`services/api.ts` cree un `GatewayError` riche en code (par ex. `AUTH_INVALID_CREDENTIALS`). Les deux methodes principales:

- `login` controle les champs, verifie les scopes et renvoie un JWT fictif. Toute erreur est renvoyee avec un message actionnable (suggestion de paires admin/visitor).
- `getAnalyticsSummary` fournit trois series (temperature horaire, puissance journaliere, mouvement). En cas de bug de generation, une erreur detaillee est emise, ce qui permet a l'UI d'afficher un bouton de retry.

Ces choix garantissent des messages d'erreur tres explicites: la vue Login reprend le texte ameubli par `AuthContext`, tandis que `Analytics` mentionne la cause exacte dans une carte dediee.

## 4. Tableau de bord et UX

### 4.1 Structure
`App.tsx` compose directement l'`AuthProvider` puis le `ThingsProvider`. Selon `View.DASHBOARD` ou `View.ANALYTICS`, une grille de cartes ou des graphiques sont affiches. `components/layout/Sidebar.tsx` pilote la navigation et expose la deconnexion, tandis que `Header.tsx` affiche un rappel d'identite.

### 4.2 Cartes de controle
Chaque controle est specialise:

- `LampControl` et `SmartWindowControl` fournissent un interrupteur type "toggle" et des indications textuelles (etat, luminosite, etc.).
- `ThermostatControl` combine affichage de temperature, slider pour la consigne et boutons de mode. Les libelles sont en ASCII pour respecter les contraintes multiplateformes.
- `AmbientSensorDisplay` et `MotionSensorDisplay` presentent des badges color codes selon l'etat.

Le composant `ThingsContext` garantit que toute action utilisateur est journalisee (ajout du timestamp `lastManualUpdate`). Les regles d'automatisation respectent ces changements pendant une fenetre anti-rebond (par ex. 60 secondes pour la lampe).

### 4.3 Journal et analytics
`AutomationStatus.tsx` montre un switch global et la liste des 10 derniers evenements, chaque ligne affichant `RobotIcon`, l'heure et un message. La section analytics embarque trois graphiques Recharts et gere les erreurs:

- spinner tant que la requete synthetique n'est pas terminee;
- message rouge + bouton Retry si `apiService` echoue;
- unites homogenes (`degC`, `W`, nombre de detections).

## 5. Processus de decouverte et de conception

1. **Recueil des exigences**: L'objectif etait de demontrer une chainee WoT de bout en bout sans infrastructure externe. Les jalons: authentification, simulation de donnees, regles tangibles, demo front.
2. **Cartographie des acteurs**: usagers admin/visitor, senseurs, effet actuateurs, moteur d'analyse.
3. **Prototypage iteratif**: 
   - prototypes de la passerelle en `ThingsContext` afin de valider la capacite a simuler fenetre/thermostat;
   - maquette du tableau de bord (Cartes Tailwind) pour valider le layout responsive;
   - instrumentation Recharts pour assurer des visualisations lisibles avec peu de donnees.
4. **Validation**: instrumentation console et `automationEvents` pour verifier chaque regle, puis ajustement des seuils (CO2, temps d'inactivite). Les erreurs sont volontairement verbeuses pour faciliter le debug lors des tests utilisateurs.

Cette approche "simulation first" facilite ensuite le branchement vers des APIs reelles sans casser la demo.

## 6. Mecanismes de securite

1. **Scopes et autorisations**: `AuthContext` expose `hasScope`. Les composants de controle appellent `useAuth().hasScope('write:things')` pour griser les toggles si l'utilisateur n'a que la lecture (profil visitor).
2. **Stockage local**: les sessions sont perennisees dans `localStorage` avec une validation basique (presence de token et username). Toute erreur de parsing vide la session et loggue l'incident.
3. **Messages d'erreur explicites**: la classe `GatewayError` transporte un `code`. `AuthContext` capture l'erreur, trace `console.error('Login failed', error)` et rejette avec un message clair. La vue `Login` affiche donc "Username and password are required..." ou "Try admin/password".
4. **Debounce anti-conflits**: `ThingsContext` enregistre `lastManualUpdate`. Le moteur de regles verifie ce champ avant de modifier un appareil afin de proteger les actions utilisateurs (ex: ne pas refermer une fenetre que l'humain vient d'ouvrir).
5. **Automatisation togglable**: un bouton global permet de suspendre la logique automatique. Chaque bascule cree un evenement "Automatisation reactivee..." afin de garder une trace auditable.

Ces mecanismes, bien que simples, couvrent les principaux risques d'une demo (prise de controle non voulue, manque de feedback, etat incoherent).

## 7. Logique d'execution des regles

### 7.1 Boucle de simulation
Toutes les 2 secondes:

1. `simulateSensorsAndEnvironment` calcule les nouvelles valeurs (temperatures, CO2, consommation, detection).
2. `runAutomationEngine` applique les regles dans un ordre deterministe (priorite a la securite).
3. `setThings` propage le nouvel etat au reste de l'app, ce qui rerendra les composants React automatiquement.

### 7.2 Structure des regles
Chaque regle suit la meme structure:

- evaluation des preconditions (ex: `ambient.airQualityCO2 > CO2.HIGH_THRESHOLD`);
- verification du dernier changement manuel;
- modification de l'objet lorsque les conditions sont satisfaites;
- appel a `addAutomationEvent` avec un message lisible.

Ce modele rend la logique facilement extensible: ajouter une regle revient a coder un bloc supplementaire dans `runAutomationEngine`, ou a externaliser la configuration dans un tableau de strategies.

### 7.3 Observabilite et messages
`AutomationStatus` se contente d'afficher les evenements, mais ils servent aussi de log texte pour reconstruire une chronologie lors des tests. Le format `timestamp + message` facilite le tri et l'audit.

## 8. Scenario de demonstration et tests

1. **Connexion**: ouvrir `npm run dev`, se connecter en `admin/password`. En cas d'erreur, le message precise la cause.
2. **Regles fenetre/CO2**:
   - Attendre que l'evenement "Alerte CO2..." apparaisse -> constater l'ouverture automatique de la fenetre et l'arret du thermostat.
   - Basculer manuellement la fenetre pour voir `lastManualUpdate` bloquer le moteur pendant 5 minutes.
3. **Presence et eclairage**: cliquer sur le toggle "Automation" pour OFF, allumer la lampe, re-activer l'automatisation et observer l'extinction automatique apres inactivite.
4. **Mode ECO**: laisser la scene idle > 20 secondes -> le thermostat passe en ECO, puis reviens en HEATING lorsque le mouvement redevient true.
5. **Analytics**: passer sur la vue Analytics, noter que les graphs s'affichent. Tenter un refresh rapide pour rencontrer potentiellement la gestion d'erreur (les latences sont simulees). Utiliser le bouton Retry si necessaire.
6. **Tests API**: comme les services sont virtualises, on peut provoquer des erreurs en laissant des champs vides sur le formulaire Login pour valider `AUTH_VALIDATION_ERROR`.

## 9. Perspectives et evolutions

- **Externalisation du moteur de regles**: de futurs travaux pourraient exporter la configuration vers un fichier JSON ou un DSL pour rendre les regles declaratives.
- **Persistance**: connecter `ThingsContext` a IndexedDB ou a une API permettrait de conserver l'historique des evenements au dela des 10 derniers.
- **Securite renforcee**: remplacer les faux JWT par un vrai flux OAuth2 / OpenID Connect, chiffrer les donnees dans `localStorage`, ajouter des tests automatises sur les scopes.
- **Internationalisation**: ajouter un veritable systeme d'i18n (aujourd'hui tout est en francais) pour ouvrir la voie a d'autres langues sans dupliquer les composants.
- **Tests automatises**: introduire des tests unitaires (Jest + React Testing Library) pour valider les regles critiques (CO2, ECO) et assurer la non-regression.

---

Ce rapport synthetise les connaissances necessaires pour comprendre, maintenir et presenter WoT Eco. Les sections code referencees fournissent le meilleur point d'entree pour les developpeurs interesses par la passerelle, les services virtuels ou l'interface utilisateur.
