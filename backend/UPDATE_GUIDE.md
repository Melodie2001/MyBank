# Mise à jour de Nexo Finance

## Connexion et vérification préalable

Le serveur actuel est accessible avec `ssh ubuntu@51.222.36.71`. L'authentification interactive par mot de passe a été confirmée. L'ancien alias local `ssh nexo` pointe encore vers un autre serveur et ne doit pas être utilisé pour cette livraison.

Sur le serveur, vérifier le commit installé, `git status`, les services, les certificats et les variables du `.env` sans afficher les secrets. Conserver les clés JWT et le `.env` de production. `FRONTEND_URL` doit désigner le site public ; `MAILER_DSN` peut rester configuré vers Mailpit si la capture de test est le comportement souhaité.

Le fichier local au VPS `backend/compose.jwt.yaml` ne contient qu'une surcharge du montage `./config/jwt:/var/www/html/config/jwt:rw`. Il autorise l'écriture dans le dossier JWT, contrairement au montage standard en lecture seule. Il reste ignoré comme configuration propre au serveur et n'est pas nécessaire au déploiement standard. Ne pas le supprimer ni modifier le service en cours pendant le rangement Git. Les clés privées restent dans le dossier ignoré `backend/config/jwt/`.

## Local

Depuis `backend` :
```bash
docker compose -f docker-compose.yaml -f compose.override.yaml -f compose.local.yaml up -d --build
```
`compose.local.yaml` construit les interfaces avec les URL localhost. Ne pas l'inclure en production. La configuration standard construit les interfaces avec les domaines publics.

## Serveur

Publier uniquement les fichiers applicatifs, migrations, tests et configuration nécessaires. Exclure `.env`, clés JWT, sauvegardes, données temporaires et rapports contenant des données personnelles. Après un push sur `main`, GitHub Actions exécute les quatre contrôles puis déploie le commit validé sur le VPS. Prévoir une courte indisponibilité pendant les sauvegardes et migrations.

Pour une mise à jour manuelle, après publication et contrôle du dépôt serveur propre :
```bash
cd ~/MyBank
git switch main
git pull --ff-only origin main
cd backend
sudo bash scripts/deploy.sh
```

Le script valide Compose, construit les images, stoppe l'API, sauvegarde les deux bases, applique les migrations puis démarre et vérifie les services. Il exige que MySQL/MongoDB soient déjà démarrés. Il ne supprime aucun volume. Si la sauvegarde ou une migration échoue, l'API reste arrêtée pour une intervention explicite.

Le serveur utilise la branche `main`. La mise à jour des fichiers Git doit être suivie de l'exécution du script pour appliquer la livraison aux conteneurs.

### Accès GitHub Actions au VPS

Le job `Deploy to production server` se connecte à `ubuntu@51.222.36.71` avec une clé dédiée, conservée dans le secret de dépôt `NEXO_DEPLOY_SSH_KEY`. Sa clé publique doit être autorisée dans `/home/ubuntu/.ssh/authorized_keys`. Le compte doit pouvoir exécuter `sudo -n true`, puis le script de livraison, et récupérer le dépôt sans saisie interactive.

La clé publique ED25519 du serveur est épinglée dans le workflow à partir de l'entrée déjà connue localement. En cas de remplacement de cette clé hôte, vérifier la nouvelle valeur depuis la console du VPS avant de modifier le workflow.

Les déploiements GitHub sont sérialisés. Un verrou côté serveur protège aussi cette exécution. Le job vérifie que le dépôt serveur est propre et applique uniquement le commit qui a passé les contrôles. Une exécution dépassée par un nouveau commit sur `main` laisse la livraison à ce nouveau workflow. Après le script, les trois adresses HTTPS publiques sont contrôlées.

Les sauvegardes SQL/MongoDB sont compressées et leur intégrité gzip est contrôlée. Elles sont privées (`umask 077`) et conservées dans `backups/`, exclu de Git. Après une nouvelle sauvegarde réussie, le script purge les archives reconnues datant d'au moins 30 jours. Les copies hors serveur Windows ne sont pas purgées automatiquement ; voir backend/README.md.

## Retour arrière préparé

Avant la mise à jour, noter le commit installé et préserver les images actives, par exemple en les taguant avec un nom de release à partir des identifiants renvoyés par `docker inspect`. Conserver une copie de la configuration Compose de cette release, sans modifier les secrets. Ne pas lancer `docker image prune` avant validation.

En cas d'échec, maintenir l'API arrêtée. Choisir explicitement si le schéma est compatible avec l'ancienne release. Si oui, relancer les anciennes images via un override Compose qui pointe vers leurs tags et `up --no-build`. Si une restauration de base est nécessaire, elle écrase les données postérieures à la sauvegarde : vérifier le fichier et la release choisis avant l'opération, puis restaurer les DEUX bases et relancer les images correspondantes. Aucun rollback automatique de données n'est effectué.

Commande de restauration MySQL, dans un scénario de récupération approuvé :
```bash
gunzip -c ../backups/mysql_TIMESTAMP.sql.gz | docker compose exec -T database sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" mybank'
```

Commande MongoDB correspondante :
```bash
gunzip -c ../backups/mongo_TIMESTAMP.archive.gz | docker compose exec -T mongodb sh -c 'exec mongorestore --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --drop'
```

Tester la restauration sur des bases isolées avant d'utiliser cette procédure en production. Les sauvegardes locales du 5 octobre ont été créées avant la migration puis restaurées avec succès dans des bases isolées : MySQL et 172 documents MongoDB, sans erreur.

## Recette après mise à jour

Vérifier la santé locale de l'API, HTTPS sur les trois domaines, connexion utilisateur/admin avec des comptes fictifs, CRUD opérations, budgets/alertes, profil, notifications, reset capturé dans Mailpit et affichage mobile. Examiner les logs sans publier les tokens. Vérifier la tâche de renouvellement des certificats et les sauvegardes planifiées sur le serveur.
