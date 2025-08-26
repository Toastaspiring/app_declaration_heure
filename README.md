# Générateur de Fiche d'Heures

## Aperçu du Projet

Le Générateur de Fiche d'Heures est une application web monopage conçue pour simplifier la création, la gestion et l'exportation de fiches d'heures mensuelles. C'est un outil complet qui s'adresse aussi bien aux employés qu'aux employeurs, en automatisant les calculs et en offrant des fonctionnalités avancées telles que la sauvegarde de brouillons et les signatures numériques.

L'application est entièrement front-end et ne nécessite aucune installation de serveur. Elle utilise le stockage local du navigateur (`localStorage`) pour offrir une expérience utilisateur persistante.

## Fonctionnalités Clés

- **Génération de Tableau Dynamique :** Crée automatiquement une fiche d'heures complète pour n'importe quel mois et n'importe quelle année.
- **Calculs Automatisés :** Calcule les totaux journaliers et hebdomadaires en temps réel au fur et à mesure que vous saisissez les heures.
- **Sauvegarde de Brouillon Automatique :** L'ensemble de votre travail (noms, dates, heures et signatures) est automatiquement sauvegardé dans le stockage local de votre navigateur. Vous pouvez fermer la page et reprendre là où vous vous étiez arrêté.
- **Cache du Modèle d'Heures :** L'application mémorise le dernier modèle d'heures de travail (heure de début, de fin et temps de pause) que vous avez utilisé et l'applique par défaut aux nouvelles fiches d'heures.
- **Signatures Numériques :** Un module de signature intégré vous permet, à vous et à votre employeur, de dessiner vos signatures directement sur l'application. Celles-ci sont ensuite intégrées dans le document final.
- **Export PDF de Haute Qualité :** Génère un document PDF professionnel, propre et textuel (non une image), incluant les signatures. Le texte est sélectionnable et le document est optimisé pour l'impression.
- **Totaux Hebdomadaires :** Affiche un résumé des heures travaillées à la fin de chaque semaine pour une meilleure lisibilité.
- **Interface Intuitive :** Conçue avec Tailwind CSS pour une expérience utilisateur moderne, claire et entièrement responsive.

## Comment Utiliser l'Application

L'utilisation de l'application est simple et directe :

1.  **Ouvrez le Fichier :** Lancez `index.html` dans n'importe quel navigateur web moderne (Chrome, Firefox, Safari, Edge).
2.  **Renseignez les Informations :** Entrez le nom de l'employé(e) et le nom de l'entreprise.
3.  **Sélectionnez la Période :** Choisissez le mois et l'année pour lesquels vous souhaitez créer la fiche d'heures.
4.  **Générez le Tableau :** Cliquez sur le bouton **"Générer le tableau"**. Un tableau complet pour le mois sélectionné apparaîtra.
5.  **Saisissez les Heures :** Remplissez les heures de début, de fin et les minutes de pause pour chaque jour travaillé. Les totaux journaliers et hebdomadaires se mettront à jour automatiquement.
6.  **Ajoutez les Signatures (Optionnel) :**
    - Cliquez sur le bouton **"Ajouter les signatures"**.
    - Une fenêtre modale s'ouvrira avec deux champs de signature.
    - Dessinez les signatures à l'aide de votre souris ou de votre doigt sur un écran tactile.
    - Cliquez sur **"Fermer"**. Les signatures sont automatiquement sauvegardées.
7.  **Téléchargez le PDF :** Cliquez sur le bouton **"Télécharger en PDF"**. Un document PDF de haute qualité sera généré et téléchargé sur votre appareil.

## Détails Techniques

L'application est construite avec des technologies web standard et s'appuie sur plusieurs bibliothèques JavaScript open-source, chargées via un CDN :

- **Tailwind CSS :** Pour un design moderne et responsive sans CSS personnalisé.
- **jsPDF :** La bibliothèque principale pour la création de documents PDF côté client.
- **jsPDF-AutoTable :** Un plugin pour jsPDF qui simplifie grandement la création de tableaux complexes dans les PDF.
- **SignaturePad.js :** Une bibliothèque légère pour la capture de signatures numériques fluides sur des éléments `<canvas>`.

## Structure des Fichiers

Le projet est intentionnellement simple et ne contient que deux fichiers principaux :

-   `index.html` : Ce fichier contient la structure HTML de l'application, les styles CSS (via Tailwind) et les références aux bibliothèques JavaScript.
-   `script.js` : Ce fichier contient toute la logique de l'application, y compris la génération du tableau, les calculs, la gestion du stockage local (brouillons, modèles, signatures) et la génération du PDF.
