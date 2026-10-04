# Tontines et cotisations

## Base de données

Appliquer la migration `20261001000001_tontines_and_cotisations.sql` au projet Supabase avant de déployer l’application. Les tirages et les confirmations de paiements sont atomiques côté base. Une contrainte empêche qu’un participant gagne deux fois pendant la même rotation.

## Tirages automatiques sur Railway

L’application tente un tirage quand le créateur consulte sa tontine à l’échéance et quand le dernier règlement est confirmé. Pour couvrir les groupes sans visite à cette date, créer un service Railway Cron avec une fréquence quotidienne et la commande de démarrage :

```text
node scripts/run-tontine-cron.mjs
```

Ajouter dans Railway `TONTINE_CRON_URL=https://<domaine-production>/api/cron/tontines/draw` et la même valeur privée `CRON_SECRET` à l’application et au service cron. Le tirage n’est effectué qu’à partir de la date d’échéance, lorsque tous les membres actifs ont payé. Les règlements de tontine sont confirmés manuellement par le créateur après réception hors application.

## Paiements de cotisations

Les contributions utilisent le prestataire déjà configuré dans l’application. Le webhook `/api/webhooks/geniuspay` vérifie la signature, puis le montant et la devise via le prestataire avant de compter une contribution comme payée. Le total et la progression sont calculés exclusivement à partir des contributions confirmées.
