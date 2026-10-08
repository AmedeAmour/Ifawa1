# IfâWa

Application numérique de consultation des seize cauris.

## Version publique

La version actuellement validée se trouve dans le dossier `dist`. Elle utilise Supabase pour charger les domaines, les signes, les interprétations générales, les lectures personnalisées et les réponses aux questions.

## Lancer l’application en local

Node.js 22 ou une version plus récente est recommandé.

```bash
npm run preview:static
```

L’application est ensuite disponible sur `http://127.0.0.1:4173/`.

## Déploiement Vercel

Le fichier `vercel.json` configure Vercel pour publier directement le contenu validé du dossier `dist`, sans reconstruire l’ancienne interface source.

1. Importer ce dépôt depuis GitHub dans Vercel.
2. Conserver le dossier racine du projet à la valeur par défaut.
3. Lancer le déploiement.

La clé Supabase utilisée dans `dist/config.js` est une clé publique destinée au navigateur. Les données privées restent protégées par les permissions et les politiques Supabase.
