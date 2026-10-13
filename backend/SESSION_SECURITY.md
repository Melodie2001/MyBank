# Sessions : comportement et mise en service

Les comptes doivent être actifs pour utiliser un JWT ou renouveler une session. Un code OAuth est également refusé lorsque le compte n'est plus actif au moment de l'échange.

Le JWT contient user_id et session_version. Les deux valeurs sont comparées au compte chargé depuis SQL à chaque authentification. Cela empêche notamment un ancien JWT d'accéder à un nouveau compte créé avec la même adresse email.

Le rejet, le retour au statut pending, le changement ou la réinitialisation du mot de passe incrémentent la version et suppriment les refresh tokens et codes OAuth du compte. La suppression du compte retire également ces jetons. Les écritures sont regroupées dans une transaction SQL. Une réactivation permet une nouvelle connexion, sans restaurer les sessions précédentes.

Après un changement de mot de passe depuis le profil, l'interface efface les identifiants locaux et affiche la page de connexion avec un message de confirmation. La déconnexion ordinaire conserve pour l'instant son comportement local ; sa révocation serveur reste une amélioration distincte.

## Migration requise

La migration Version20261003120000 ajoute user.session_version avec la valeur initiale 0. Elle doit être appliquée avant d'activer ce code sur une base existante. Elle a été exécutée uniquement sur des bases de test isolées pendant cette intervention ; les conteneurs applicatifs existants n'ont pas été reconstruits ou redéployés.

Exécuter les migrations habituelles avec l'image contenant ce changement avant de démarrer le nouveau backend. Ne pas utiliser doctrine:schema:update --force.

Les JWT émis avant cette évolution n'ont pas les nouveaux champs et sont refusés. Un frontend disposant d'un refresh token valide peut renouveler automatiquement sa session ; sinon, une nouvelle connexion est nécessaire. Les nouveaux JWT émis lors du refresh portent également les deux champs.

## Validation

SessionSecurityTest couvre suspension et réactivation, plusieurs sessions d'un même compte, changement de mot de passe, échec de changement, réinitialisation et réutilisation du lien, lien expiré, échange OAuth après rejet, suppression et recréation avec la même adresse email. Les tests d'intégration CI incluent ce fichier.

Les tests d'intégration doivent utiliser des bases fictives distinctes, des clés JWT de test et un transport email nul. Ils exercent les réponses avec le client Symfony, MySQL et MongoDB. Ils ne valident ni les écrans dans un navigateur ni l'envoi d'un vrai email.
