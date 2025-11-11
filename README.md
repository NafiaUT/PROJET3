# WoT Eco

WoT Eco demontre un systeme Web of Things complet: authentification, passerelle virtuelle, services exposes et tableau de bord d'exploitation. La base de code est auto-suffisante afin de faciliter les revues et les demonstrations hors ligne.

## Prerequis
- **Node.js 18 LTS ou version superieure** (obligatoire). Le runtime est utilise pour les dependances Vite/React et pour simuler la passerelle.
- **npm 9+** (installe avec Node.js). Yarn/pnpm fonctionnent aussi mais ne sont pas testes.
- **Optionnel**: Java 17+ si vous souhaitez brancher la passerelle sur une implementation WoT externe ecrite en Java. La demo par defaut n'en a pas besoin.

Conseil: verifiez votre environnement avec `node -v` et `npm -v` avant de continuer.

## Installation
1. Cloner ou decompresser ce depot sur votre machine.
2. Depuis la racine du projet, installer les dependances:
   ```bash
   npm install
   ```
3. Aucun serveur externe n'est requis. La passerelle virtuelle (`contexts/ThingsContext.tsx`) et les services (`services/api.ts`) sont charges dans le navigateur.

## Demarrer les services
1. Lancez Vite en mode developpement:
   ```bash
   npm run dev
   ```
2. Ouvrez l'URL affichee (souvent http://localhost:5173). Le tableau de bord se charge apres authentification.
3. Comptes de demo:
   - `admin / password` (lecture + ecriture + scopes admin)
   - `visitor / password` (lecture seule)

> La session est stockee dans `localStorage`. Pour la purger, cliquez sur "Logout" ou videz manuellement le stockage du navigateur.

## Tester les APIs virtuelles
- **Authentification**: laissez les champs vides puis validez; l'erreur `Username and password are required...` (code `AUTH_VALIDATION_ERROR`) confirme la gestion d'erreur explicite.
- **Analytics**: chargez la vue "Analytics". Les donnees sont generees par `apiService.getAnalyticsSummary()`. Pour simuler un retry, forcez un rafraichissement pendant le chargement: le composant affiche alors le message `Analytics service error` et un bouton "Retry".

## Reproduire le scenario de demonstration
1. Connectez-vous en `admin/password`.
2. Rendez-vous sur l'onglet "Tableau de bord".
3. Observez `AutomationStatus`:
   - basculez l'automatisation sur OFF, allumez manuellement la lampe du salon, re-activez l'automatisation pour constater que la lampe reste allumee 60 secondes avant extinction automatique;
   - laissez tourner la simulation jusqu'a ce que la fenetre intelligente s'ouvre suite a une alerte CO2. Le journal doit afficher "Alerte CO2 elevee..." puis "Fenetre ouverte. Extinction du thermostat...".
4. Attendez 20 secondes sans mouvement afin de declencher le mode ECO. Les cartes Thermostat et Lampe refleteront la decision, et un evenement "Inactivite detectee" sera consigne.
5. Basculez sur la vue "Analytics" pour verifier les trois graphiques (temperature, puissance, detection).

## Scripts complementaires
- `npm run build`: build de production (utile avant un deploiement Vercel/Netlify).
- `npm run preview`: sert la version build pour une ultime validation.

## Depannage rapide
- Port occupe: changez le port via `npm run dev -- --port=5174`.
- Ecran vide: ouvrez la console navigateur, recherchez une erreur `GatewayError` ou `useThings must be used...`.
- Automatisation figee: verifiez le switch Automation; en mode OFF le moteur de regles ne tourne plus.
