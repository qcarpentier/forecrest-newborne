# Glow Up - Revenue Streams & Fee Engine

> Documentation technique et business des flux de revenus de la plateforme Glow Up.
> Basee sur le code source (`calculations.js`, `defaults.js`, `config.js`).

---

## Table des matieres

1. [Architecture des revenus](#architecture-des-revenus)
2. [Stream 1 : Commission par reservation (Core)](#stream-1--commission-par-reservation-core)
3. [Frais Stripe par methode de paiement](#frais-stripe-par-methode-de-paiement)
4. [Frais Glow Up par methode de paiement](#frais-glow-up-par-methode-de-paiement)
5. [Scenarios tarifaires](#scenarios-tarifaires)
6. [Stripe Connect (frais de versement)](#stripe-connect-frais-de-versement)
7. [Arrondi et prix client](#arrondi-et-prix-client)
8. [Porteur de frais (Fee Bearer)](#porteur-de-frais-fee-bearer)
9. [Stream 2 : Shine+ (abonnement end-user)](#stream-2--shine-abonnement-end-user)
10. [Stream 3 : Sponsored Listings](#stream-3--sponsored-listings)
11. [Stream 4 : Pro Subscription](#stream-4--pro-subscription)
12. [Stream 5 : Marketplace](#stream-5--marketplace)
13. [Stream 6 : Brand Data](#stream-6--brand-data)
14. [Stream 7 : Brand Ads](#stream-7--brand-ads)
15. [Stream 8 : Enterprise / Glow Up Business](#stream-8--enterprise--glow-up-business)
16. [Stream 9 : White-Label](#stream-9--white-label)
17. [Classification commerciale (Tiers S/A/B/C/D)](#classification-commerciale-tiers-sabcd)
18. [Commissions commerciales](#commissions-commerciales)
19. [Fiscalite belge (ISOC, ONSS, PP)](#fiscalite-belge-isoc-onss-pp)
20. [Formules cles](#formules-cles)

---

## Architecture des revenus

Glow Up genere ses revenus via **9 streams** independants. Le stream principal (commission par reservation) represente le coeur du modele. Les autres streams sont activables individuellement.

```
Revenue Total = Commission Core + Shine+ + Sponsored + ProSub
              + Marketplace + Brand Data + Brand Ads + Enterprise + White-Label
```

Le MRR total des streams annexes est calcule par `calcExtraStreamsMRR()` dans `calculations.js`.

---

## Stream 1 : Commission par reservation (Core)

C'est le moteur principal. Pour chaque reservation traitee via la plateforme, Glow Up preleve une **commission** calculee par methode de paiement, apres deduction des frais Stripe.

### Flux d'une reservation

```
Client paie (basket + fee) → Stripe preleve ses frais → Glow Up garde sa commission → Pro recoit le reste
```

### Formule par reservation (`bkg()`)

```
gf  = SUM(mix_i * (basket * guVar_i + guFix_i))     Commission brute GU (blended)
rf  = round(gf)                                       Commission arrondie (affichee au client)
cp  = basket + clientFee                               Montant total charge au client
sc  = SUM(mix_i * (cp * sVar_i + sFix_i))             Cout Stripe (blended)
netHT = (rf - sc) / (1 + TVA)                         Revenu net HT de Glow Up
```

Ou `mix_i` est la part de chaque methode de paiement dans le volume total (somme = 100%).

---

## Frais Stripe par methode de paiement

Source : [stripe.com/fr-be/pricing](https://stripe.com/fr-be/pricing), mars 2026.

### Terminal (TPE physique)

| Methode | ID | sVar (%) | sFix (EUR) | Notes |
|---------|-----|----------|------------|-------|
| Carte EEE (Visa, MC) | `card_tpe` | 1,40% | 0,10 | Cartes europeennes, tarif le plus courant |
| Bancontact (carte physique) | `bancontact_tpe` | 1,40% | 0,10 | Meme tarif que carte EEE sur terminal |
| Carte internationale (hors EEE) | `card_intl_tpe` | 2,90% | 0,10 | Touristes, cartes US/UK/etc. |

### Online (paiement en ligne)

| Methode | ID | sVar (%) | sFix (EUR) | Notes |
|---------|-----|----------|------------|-------|
| Carte EEE standard | `card_online` | 1,50% | 0,25 | Visa/MC/Bancontact en ligne |
| Carte EEE premium (Amex) | `card_premium_online` | 1,90% | 0,25 | American Express, cartes premium |
| Carte internationale (hors EEE) | `card_intl_online` | 3,25% | 0,25 | Paiements cross-border |
| Bancontact online | `bancontact_online` | 0,00% | 0,35 | Flat fee uniquement, pas de % |

### Virements

| Methode | ID | sVar (%) | sFix (EUR) | Notes |
|---------|-----|----------|------------|-------|
| SEPA Direct Debit | `sepa_debit` | 0,00% | 0,35 | Prelevement automatique |
| SEPA Bank Transfer | `sepa_transfer` | 0,50% | 0,00 | Virement bancaire (plafonne 5 EUR) |

### Cash

| Methode | ID | sVar (%) | sFix (EUR) | Notes |
|---------|-----|----------|------------|-------|
| Especes | `cash` | 0,00% | 0,00 | Aucun frais Stripe (pas de traitement) |

---

## Frais Glow Up par methode de paiement

La commission Glow Up (`guVar` + `guFix`) varie par methode ET par scenario tarifaire.
Ci-dessous les valeurs par defaut (**scenario "Growth"**) :

### Terminal (TPE)

| Methode | guVar (%) | guFix (EUR) | Mix defaut |
|---------|-----------|-------------|------------|
| Carte EEE | 2,90% | 0,20 | 25% |
| Bancontact TPE | 2,50% | 0,15 | 12% |
| Carte internationale TPE | 4,50% | 0,20 | 3% |

### Online

| Methode | guVar (%) | guFix (EUR) | Mix defaut |
|---------|-----------|-------------|------------|
| Carte EEE online | 2,90% | 0,50 | 13% |
| Carte premium (Amex) | 3,50% | 0,50 | 2% |
| Carte internationale online | 4,90% | 0,50 | 2% |
| Bancontact online | 1,50% | 0,50 | 8% |

### Virements & Cash

| Methode | guVar (%) | guFix (EUR) | Mix defaut |
|---------|-----------|-------------|------------|
| SEPA Direct Debit | 1,00% | 0,35 | 3% |
| SEPA Bank Transfer | 1,00% | 0,00 | 2% |
| Cash | 0,00% | 0,00 | 30% |

**Mix total = 100%** (somme de toutes les methodes).

---

## Scenarios tarifaires

Quatre scenarios predefinit dans `FEE_SCENARIOS` ajustent uniquement les `guVar`/`guFix` de Glow Up (les frais Stripe restent fixes) :

| Scenario | Philosophie | guVar typique (carte EEE TPE) | guFix typique |
|----------|-------------|-------------------------------|---------------|
| **Accessible** | Adoption maximale, marges fines | 2,00% | 0,15 |
| **Balanced** | Equilibre marge/adoption | 2,20% | 0,15 |
| **Growth** (defaut) | Croissance rentable | 2,90% | 0,20 |
| **Premium** | Marges elevees, positionnement haut | 3,90% | 0,30 |

Chaque scenario definit les 10 methodes de paiement avec leurs guVar/guFix specifiques.

### Exemple comparatif sur un panier de 30 EUR (carte EEE TPE)

| Scenario | Commission GU | Frais Stripe | Net GU (HT) |
|----------|--------------|--------------|--------------|
| Accessible | 0,75 EUR | 0,52 EUR | 0,19 EUR |
| Balanced | 0,81 EUR | 0,53 EUR | 0,23 EUR |
| Growth | 1,07 EUR | 0,54 EUR | 0,44 EUR |
| Premium | 1,47 EUR | 0,54 EUR | 0,77 EUR |

---

## Stripe Connect (frais de versement)

En plus des frais par transaction, Stripe Connect facture des frais de **versement** (payout) aux comptes connectes des pros. Calcules annuellement par `connectAnnual()`.

### Parametres

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| `cVar` | 0,25% | Frais variable par versement (sur le volume) |
| `cFix` | 0,10 EUR | Frais fixe par versement |
| `connectMonthly` | 2 EUR | Frais mensuel du compte Connect |
| `payoutsPerMonth` | 4 | Nombre de versements par mois |

### Formule annuelle

```
payoutsPerYear = payoutsPerMonth * 12 * (opW / 52)
annPayoutFee   = basket * medY * cVar + payoutsPerYear * cFix
annAccountFee  = connectMonthly * 12
totalConnect   = annPayoutFee + annAccountFee
```

### Exemple (panier 30 EUR, 5 520 reservations/an)

```
payoutsPerYear = 4 * 12 * (46/52) = 42 versements
annPayoutFee   = 30 * 5520 * 0.0025 + 42 * 0.10 = 414 + 4.20 = 418.20 EUR
annAccountFee  = 2 * 12 = 24 EUR
totalConnect   = 442.20 EUR
```

---

## Arrondi et prix client

La commission brute GU (`gf`) est arrondie avant affichage au client. Trois systemes :

### 1. Arrondi par palier (defaut) — `roundScaled()`

```js
roundingScale: [
  { upTo: 1.00, step: 0.10 },   // < 1 EUR : arrondi au 10 ct
  { upTo: 3.00, step: 0.25 },   // 1-3 EUR : arrondi au 25 ct
  { upTo: 999,  step: 0.50 },   // > 3 EUR : arrondi au 50 ct
]
```

Arrondi toujours vers le **haut** (`Math.ceil`).

### 2. Arrondi psychologique — `roundPsych()`

Arrondi a l'entier superieur + terminaison (`.49` ou `.99`).
Exemple : `1.07 → 1.49` ou `1.07 → 1.99`

### 3. Arrondi fixe — `roundStep()`

Arrondi vers le haut au pas fixe (0.10, 0.25, 0.50, 1.00).

### Delta d'arrondi

```
delta = rf - gf     // surplus d'arrondi, entierement conserve par Glow Up
```

Ce delta est un **revenu additionnel** par reservation.

---

## Porteur de frais (Fee Bearer)

Le parametre `feeBearer` determine qui paie la commission :

| Mode | `clientFee` | Ce que le client paie | Ce que le pro recoit |
|------|-------------|----------------------|---------------------|
| **client** (defaut) | `rf` | `basket + rf` | `basket` |
| **split** | `rf / 2` | `basket + rf/2` | `basket - rf/2` |
| **pro** | `0` | `basket` | `basket - rf` |

La base de calcul Stripe (`cp`) est toujours ce que le client paie reellement.

---

## Stream 2 : Shine+ (abonnement end-user)

Abonnement premium pour les utilisateurs finaux de l'app.

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| `price` | 4,99 EUR/mois | Prix de l'abonnement |
| `conversionRate` | 5% | % d'utilisateurs actifs qui souscrivent |
| `churnRate` | 8%/mois | Taux de desabonnement mensuel |

### Formule MRR

```
MRR_shine = floor(activeUsers * conversionRate) * price
```

---

## Stream 3 : Sponsored Listings

Les pros paient pour mettre en avant leurs creneaux dans l'app.

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| `cpa` | 0,99 EUR | Cout par action (clic/reservation) |
| `adoptionRate` | 15% | % d'etablissements qui sponsorisent |
| `bookingsPerMonth` | 50 | Reservations sponsorisees par pro/mois |

### Formule MRR

```
MRR_sponsored = floor(totalEstablishments * adoptionRate) * bookingsPerMonth * cpa
```

---

## Stream 4 : Pro Subscription

Abonnement hebdomadaire pour les pros (outils avances, analytics).

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| `priceWeek` | 3,99 EUR/sem | Prix hebdomadaire |
| `conversionRate` | 20% | % d'etablissements abonnes |
| `churnRate` | 5%/mois | Desabonnement |

### Formule MRR

```
MRR_proSub = floor(totalEstablishments * conversionRate) * priceWeek * 4.33
```

---

## Stream 5 : Marketplace

Marketplace de produits cosmetiques/beaute. Commission sur chaque commande.

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| `commissionRate` | 15% | Commission sur chaque commande |
| `avgOrderValue` | 45 EUR | Panier moyen |
| `ordersPerProMonth` | 2 | Commandes par pro/mois |
| `adoptionRate` | 30% | % d'etablissements actifs |

### Formule MRR

```
MRR_marketplace = floor(totalEstablishments * adoptionRate) * ordersPerProMonth * avgOrderValue * commissionRate
```

---

## Stream 6 : Brand Data

Vente de donnees agregees (tendances beaute, preferences consommateurs) aux marques cosmetiques.

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| `monthlyPrice` | 2 500 EUR/mois | Prix par client marque |
| `clients` | 0 | Nombre de marques clientes |

### Formule MRR

```
MRR_brandData = clients * monthlyPrice
```

---

## Stream 7 : Brand Ads

Publicite in-app pour les marques beaute/cosmetique.

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| `cpm` | 15 EUR | Cout pour 1 000 impressions |
| `impressionsPerUser` | 10 | Impressions par utilisateur actif/mois |
| `fillRate` | 40% | Taux de remplissage publicitaire |

### Formule MRR

```
MRR_brandAds = activeUsers * impressionsPerUser * fillRate * cpm / 1000
```

---

## Stream 8 : Enterprise / Glow Up Business

Programme bien-etre en entreprise : acces Glow Up pour les employes via l'employeur.

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| `clients` | 0 | Entreprises clientes |
| `avgEmployees` | 200 | Employes moyens par entreprise |
| `feePerEmployee` | 2,50 EUR/mois | Fee par employe |
| `adoptionRate` | 40% | % d'employes qui utilisent |

### Formule MRR

```
MRR_enterprise = clients * avgEmployees * adoptionRate * feePerEmployee
```

---

## Stream 9 : White-Label

Solution white-label pour chaines hotelieres avec spa/wellness integre.

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| `clients` | 0 | Chaines hotelieres clientes |
| `setupFee` | 15 000 EUR | Frais d'installation (one-shot) |
| `monthlyLicense` | 2 500 EUR/mois | Licence mensuelle |
| `revenueSharePct` | 2% | Revenue share sur les reservations |
| `avgEstablishmentsPerClient` | 5 | Hotels par chaine |
| `avgBasketPerEstablishment` | 55 EUR | Panier moyen |
| `avgMonthlyBookingsPerEstablishment` | 800 | Reservations/mois/hotel |

### Formule MRR

```
MRR_whiteLabel = clients * (monthlyLicense + avgEstablishments * avgMonthlyBookings * avgBasket * revenueSharePct)
```

### Exemple (1 chaine, 5 hotels)

```
Revenue share = 5 * 800 * 55 * 0.02 = 4 400 EUR/mois
MRR = 2 500 + 4 400 = 6 900 EUR/mois
+ setup fee one-shot: 15 000 EUR
```

---

## Classification commerciale (Tiers S/A/B/C/D)

Chaque etablissement est classe selon son revenu net annuel projete pour Glow Up et le taux de commission effectif (`feel`).

### Seuils (defaut)

| Tier | Revenu net annuel min | Condition supplementaire |
|------|----------------------|--------------------------|
| **S** | >= 1 000 EUR | feel <= 4% (bon feeling) |
| **A** | >= 700 EUR | feel <= 5% (acceptable) |
| **B** | >= 400 EUR | — |
| **C** | >= 200 EUR | — |
| **D** | < 200 EUR | — |

### Formule

```
netYearly = netHT_per_booking * medianBookings_year - connectAnnual
tier = f(netYearly, feel, thresholds)
```

### Sensibilite client (feel)

```
feel = gf / basket     // ratio commission/panier
```

| Seuil | Perception |
|-------|------------|
| < 2,5% | Fluide — le client ne remarque pas la commission |
| 2,5% - 4% | Sensible — le client percoit la commission |
| > 4% | Friction — risque de perte de reservation |

---

## Commissions commerciales

Commissions versees aux apporteurs d'affaires (internes ou partenaires externes).

### Internes

```
commission = netFeesYear * signed * internalPct * (durationMonths / 12)
```

- `internalPct` : 15% (defaut)
- `durationMonths` : 12 mois

### Externes (programme partenaire)

Programme inspire du modele Odoo. Trois tiers :

| Tier | Commission | Clients min/an | Sessions formation/an |
|------|-----------|----------------|----------------------|
| **Silver** | 5% | 15 | 2 |
| **Gold** | 10% | 90 | 3 |
| **Diamond** | 15% | 200 | 4 |

```
commission = netFeesYear * signed * tierPct * (durationMonths / 12)
```

---

## Fiscalite belge (ISOC, ONSS, PP)

### ISOC (impot des societes) — `calcIsoc()`

Deux tranches progressives :

```
isocR = min(EBITDA, 100 000) * 20%          // taux reduit PME
isocS = max(EBITDA - 100 000, 0) * 25%      // taux standard
isoc  = isocR + isocS
taux_effectif = isoc / EBITDA
```

Reserve legale : `min(net_profit * 5%, capital_social * 10%)`

### Salaires — `salCalc()`

Calcul inverse (du net au brut) :

```
brutO = net / (1 - ONSS_employee - precompte)
ONSS_employee  = brutO * 13,07%
Precompte prof = brutO * 17,23%
ONSS_patronal  = brutO * 25,07%
Cout employeur = brutO + ONSS_patronal
```

### TVA

- Taux standard : **21%** (services beaute/bien-etre en Belgique)
- Applique sur la commission GU : `netHT = (rf - sc) / 1.21`

---

## Formules cles

### Revenue net par reservation

```
netHT = (roundedFee - stripeCost) / (1 + 0.21)
```

### Revenue net annuel par etablissement

```
netAnnual = netHT * medianBookingsYear - connectAnnualTotal
```

### MRR total extra streams

```
MRR_extra = shine + sponsored + proSub + marketplace + brandData + brandAds + enterprise + whiteLabel
```

### ARR total

```
ARR = (netAnnual * signedEstablishments) + (MRR_extra * 12)
```

### Marge nette

```
EBITDA = ARR - charges_annuelles
Net_profit = EBITDA - ISOC
```

---

## Annexe : Calcul complet sur un exemple

**Hypotheses :**
- Panier moyen : 30 EUR
- Methode : Carte EEE sur TPE (mix 25%)
- Scenario : Growth

```
1. Commission GU brute  = 30 * 2,9% + 0,20      = 1,07 EUR
2. Arrondi (palier)     = ceil(1,07 / 0,50) * 0,50 = 1,50 EUR
3. Delta d'arrondi      = 1,50 - 1,07              = 0,43 EUR
4. Client paie          = 30 + 1,50                = 31,50 EUR
5. Cout Stripe          = 31,50 * 1,4% + 0,10     = 0,54 EUR
6. Net HT GU            = (1,50 - 0,54) / 1,21    = 0,79 EUR
7. Feel                 = 1,07 / 30                = 3,57%
```

**Annualise (5 520 reservations/an) :**
```
Net annuel (hors Connect) = 0,79 * 5 520 = 4 361 EUR
Connect annuel            = 442 EUR
Net annuel final          = 3 919 EUR → Tier S
```
