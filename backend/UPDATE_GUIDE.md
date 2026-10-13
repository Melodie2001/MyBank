# Mise à jour de Nexo Finance

## Connexion et vérification préalable

L'alias enregistré sur ce poste est `ssh nexo`. La tentative du 5 octobre 2026 a expiré sur le port 22 : il faut rétablir l'accès au serveur avant toute mise à jour publique. La disponibilité du serveur n'est pas confirmée.

Sur le serveur, vérifier le commit installé, `git status`, les services, les certificats et les variables du `.env` sans afficher les secrets. Conserver les clés JWT et le `.env` de production. `FRONTEND_URL` doit désigner le site public ; `MAILER_DSN` peut rester configuré vers Mailpit si la capture de test est le comportement souhaité.

## Local

Depuis `backend` :
```bash
docker compose -f docker-compose.yaml -f compose.override.yaml -f compose.local.yaml up -d --build
```
`compose.local.yaml` construit les interfaces avec les URL localhost. Ne pas l'inclure en production. La configuration standard construit les interfaces avec les domaines publics.

## Serveur

Publier uniquement les fichiers applicatifs, migrations, tests et configuration nécessaires. Exclure `.env`, clés JWT, sauvegardes, données temporaires et rapports contenant des données personnelles. Un push sur main déclenche le déploiement automatique si les contrôles GitHub réussissent et les secrets SSH sont configurés. Prévoir une courte indisponibilité pendant les sauvegardes et migrations.

Pour une mise à jour manuelle, après publication et contrôle du dépôt serveur propre :
```bash
cd ~/MyBank
git pull --ff-only origin main
cd backend
bash scripts/deploy.sh
```

Le script valide Compose, construit les images, stoppe l'API, sauvegarde les deux bases, applique les migrations puis démarre et vérifie les services. Il exige que MySQL/MongoDB soient déjà démarrés. Il ne supprime aucun volume. Si la sauvegarde ou une migration échoue, l'API reste arrêtée pour une intervention explicite.

Les sauvegardes SQL/MongoDB sont compressées et leur intégrité gzip est contrôlée. Elles sont privées (`umask 077`) et conservées dans `backups/`, exclu de Git. Copiez-les aussi vers un stockage sûr indépendant du serveur ; leur rétention n'est pas automatisée par le nouveau script.

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
