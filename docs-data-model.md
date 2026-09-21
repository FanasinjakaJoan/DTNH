# Modèle de données DTNH

## Principes validés

- Un membre peut appartenir à plusieurs comités.
- Le téléphone est obligatoire ; l'email est facultatif.
- Un membre du comité des parents est relié à au moins un membre joueur.
- Un membre du comité des joueurs est relié à au moins un membre parent.
- Une présence est unique pour un membre et un événement.
- L'Assemblée Générale cible est le 26 septembre 2026.

## Tables

- `committees` : les quatre comités fixes.
- `members` : identité et contacts des membres.
- `member_committees` : relation plusieurs-à-plusieurs entre membres et comités.
- `parent_player_links` : relation plusieurs-à-plusieurs parent / joueur.
- `events` : Assemblée Générale et futurs événements.
- `attendances` : pointage d'un membre pour un événement.

Le SQL de référence se trouve dans `supabase/schema.sql`.
