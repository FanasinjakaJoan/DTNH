# DTNH — Pointage Assemblée Générale

MVP mobile-first pour le pointage des membres de **Dream Team New Hope** lors de l'Assemblée Générale du 26 septembre 2026.

## Fonctionnalités

- Formulaire public de pointage avec prénom, nom, téléphone obligatoire et email optionnel.
- Appartenance à un ou plusieurs comités.
- Relation parent / joueur dans les deux sens.
- Tableau de bord admin protégé par mot de passe.
- Filtre par comité et export CSV.
- Actualisation automatique du tableau de bord toutes les cinq secondes.
- Stockage mémoire automatique en local si Supabase n'est pas configuré, utile pour tester l'interface.

## Démarrage local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Sans variables Supabase, les données de démonstration restent en mémoire du serveur. Le mot de passe admin de démonstration est `DTNH2026`. Il faut obligatoirement le remplacer avec `ADMIN_PASSWORD` en production.

## Supabase

1. Créer un projet Supabase.
2. Ouvrir **SQL Editor**.
3. Exécuter `supabase/schema.sql`.
4. Renseigner dans Vercel ou `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=un-mot-de-passe-long
AUTH_SECRET=une-chaine-aleatoire-longue
```

La clé `SUPABASE_SERVICE_ROLE_KEY` est utilisée uniquement par les routes serveur. Elle ne doit jamais être exposée dans le navigateur ni dans un dépôt GitHub.

## Déploiement Vercel

Le workflow `.github/workflows/main.yml` vérifie le lint, TypeScript et le build sur chaque pull request vers `main`. Après un push sur `main`, il déploie automatiquement sur Vercel.

Ajouter dans les secrets GitHub :

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Ajouter dans les variables d'environnement du projet Vercel :

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `AUTH_SECRET`

Le projet Vercel doit utiliser Node.js 20 ou supérieur.

## Données et règles métier

Le modèle complet est documenté dans `docs-data-model.md` et le schéma SQL dans `supabase/schema.sql`.

Les relations parents / joueurs sont créées pendant le pointage. Pour faciliter l'accueil, lorsqu'un membre lié n'existe pas encore, l'application crée une fiche minimale avec le téléphone fourni lors du pointage. L'administrateur pourra ensuite compléter les informations dans une évolution du MVP.

## Commandes qualité

```bash
npm run lint
npm run typecheck
npm run build
```
