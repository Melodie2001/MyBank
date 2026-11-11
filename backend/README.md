# Backend (Symfony)

## Sauvegardes sur le VPS

Depuis `/home/ubuntu/MyBank/backend`, créer une sauvegarde des deux bases :

```bash
sudo env COMPOSE_FILE=/home/ubuntu/MyBank/backend/docker-compose.yaml bash scripts/backup-databases.sh
```

Les fichiers privés sont enregistrés dans `/home/ubuntu/MyBank/backups`. Le script vérifie leur compression avant de publier les fichiers finaux. Le message final donne leur horodatage.

Tester une paire de sauvegardes en remplaçant l'horodatage par celui affiché :

```bash
sudo bash scripts/test-backup-restore.sh 20261111_023001
```

Le test utilise deux conteneurs temporaires sans réseau ni ports publiés. Il importe les archives, contrôle les tables MySQL et valide les collections MongoDB. Les conteneurs et leurs volumes anonymes sont supprimés à la sortie, même en cas d'échec. Les bases de production ne sont pas modifiées. Prévoir de l'espace disque pour une seconde copie des bases et de la mémoire pour MySQL et MongoDB supplémentaires. Un résultat positif valide la restauration technique, pas l'exhaustivité métier des données.

La tâche quotidienne du VPS est configurée à 02 h 30 (heure du serveur), avec journal `/var/log/nexo-backups.log`. Vérifier ce journal après le premier passage automatique. Après une sauvegarde réussie, le script supprime les archives reconnues datant d'au moins 30 jours. Les archives restent sur le même VPS : conserver également une copie hors du serveur, dans un emplacement privé.

`export-latest-backup.sh` exporte la dernière paire complète sur la sortie standard. Pour une copie Windows automatique, l'installer comme fichier root non modifiable par ubuntu à `/usr/local/sbin/nexo-export-backups` et utiliser une clé SSH dédiée avec une entrée `authorized_keys` forcée à `sudo -n /bin/bash /usr/local/sbin/nexo-export-backups`, préfixée par l'option OpenSSH `restrict`. Ne jamais utiliser cette clé comme accès interactif général. `pull-backups.ps1` télécharge cette archive avec une clé privée conservée hors du dépôt dans le profil Windows, vérifie les noms des deux fichiers et enregistre `last-success.txt` uniquement après succès. Il refuse une clé d'hôte inconnue ou modifiée. Les copies locales ne sont pas purgées automatiquement. La tâche Windows doit tourner sous le compte propriétaire de la clé lorsque sa session est ouverte ; un PC éteint ne peut pas télécharger.

## Contrôles de livraison du 11 novembre 2026

- Le dépôt serveur est au commit `f1f6daf`, sur `develop`, avec une pipeline GitHub réussie. Les services sont démarrés, le backend est healthy et les 21 migrations sont appliquées.
- La sauvegarde `20261111_023001` a été restaurée dans des conteneurs temporaires : 10 tables MySQL contrôlées OK et 64 documents MongoDB restaurés sans échec.
- La copie hors VPS a été téléchargée dans `Documents/NexoFinance-Backups`. La tâche Windows `NexoFinance-Backup`, prévue à 9 h, a été déclenchée pour contrôle et s'est terminée avec le code 0. Le script installé pour cette tâche est une copie de `scripts/pull-backups.ps1` : le mettre à jour séparément si le script versionné change.
- Le renouvellement HTTPS est planifié sur le VPS dans `/etc/cron.d/nexo-certificates`, à 3 h 17 et 15 h 17 (heure du serveur). Les trois renouvellements simulés Certbot (`renew --dry-run`) ont réussi.

Ces vérifications portent sur la livraison indiquée ; elles ne remplacent pas les contrôles après une future mise à jour. Les fichiers runtime, clés privées et archives de sauvegarde restent hors du dépôt.
