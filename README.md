# CleanPost

Petit outil web pour nettoyer un texte copié depuis ChatGPT, Claude, Gemini ou un autre assistant avant de le coller dans LinkedIn.

## Fonctionnalités

- Suppression des marqueurs Markdown (`#`, `**`, `_`, backticks, blockquotes, etc.)
- Conversion des listes Markdown en puces propres
- Suppression des caractères invisibles courants (`zero-width`, BOM…)
- Normalisation des espaces et sauts de ligne
- Compteur de caractères avec limite LinkedIn à 3 000 caractères
- Résultat éditable avant copie
- Copie en un clic
- 100 % côté navigateur : aucun texte n'est envoyé à un serveur

## Utilisation

Aucune installation n'est nécessaire : ouvrez `index.html` dans un navigateur ou servez le dossier avec n'importe quel serveur statique.

Par exemple :

```bash
python3 -m http.server 8080
```

Puis ouvrez `http://localhost:8080`.

## Déploiement

Le projet est entièrement statique et peut être publié directement sur GitHub Pages, Netlify, Vercel ou n'importe quel hébergement statique.

## Important

CleanPost ne « détecte » pas si un texte a été généré par une IA et ne garantit pas de contourner un système de détection. Il nettoie uniquement les artefacts techniques et de mise en forme présents dans le texte copié.
