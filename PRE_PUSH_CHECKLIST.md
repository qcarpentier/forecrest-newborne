# Pre-Push Checklist — Forecrest

> Checklist obligatoire avant chaque commit & push. À lire et suivre systématiquement.

---

## 1. Versioning

- [ ] Bumper `VERSION` dans `src/constants/config.js`
- [ ] Bumper `RELEASE_DATE` dans `src/constants/config.js`
- [ ] Bumper `version` dans `package.json`
- [ ] Format : `major.minor.feature.fix` (cf. CLAUDE.md)

## 2. Changelog

- [ ] Nouvelle entrée en tête de `src/constants/changelog.js`
- [ ] Clés i18n ajoutées dans `src/i18n/fr/reference.js` ET `src/i18n/en/reference.js`
- [ ] Types corrects : `feature`, `fix`, `improvement`, `breaking`

## 3. Roadmap & Sitemap

- [ ] Items complétés marqués `status: "done"` dans `src/pages/RoadmapPage.jsx`
- [ ] Nouvelles pages/composants ajoutés dans `src/pages/SitemapPage.jsx`

## 4. Credits

- [ ] Nouvelles dépendances ajoutées dans `src/pages/CreditsPage.jsx`
- [ ] Dépendances supprimées retirées de CreditsPage

## 5. Code Review

- [ ] **Dead code** — imports, variables, fonctions inutilisées supprimés
- [ ] **Barrel imports** — tout importé depuis `"../components"`, `"../utils"`, `"../constants"`
- [ ] **Hardcoded colors** — aucune couleur hex dans les styles inline (sauf Recharts + brand data)
- [ ] **Hardcoded strings** — tous les textes user-facing en `lk === "fr" ? ... : ...` ou `t.key`
- [ ] **Orthographe** — vérifier les accents et typos dans les strings FR
- [ ] **Conventions** — `var` uniquement, `function(){}` uniquement, pas de `let`/`const`/`=>`

## 6. i18n

- [ ] Nouvelles clés ajoutées dans BOTH `fr/*.js` ET `en/*.js`
- [ ] Pas de strings FR-only ou EN-only visibles par l'utilisateur
- [ ] Fallbacks cohérents (même texte dans les deux langues si clé manquante)

## 7. Audit financier

- [ ] **Mapping PCMN** — les codes 60xx→achats, 61xx-64xx→exploitation, 63xx→amortissement, 65xx→financier
- [ ] **Totaux cohérents** — même chiffre d'affaires dans Overview, Revenus, Compte de résultats, Comptabilité
- [ ] **Projection multi-année** — croissance composée correcte (`Math.pow(1 + rate, year - 1)`)
- [ ] **TVA** — 21% standard, 6% réduit, 0% exonéré, appliqué correctement
- [ ] **ISOC** — 20% sur premiers 100K, 25% au-delà
- [ ] **ONSS** — 13.07% salarié, 25.07% patronal (sauf étudiants, intérimaires)
- [ ] **Salaires** — calcul inverse net→brut correct
- [ ] **One-time costs** — uniquement comptés en année 1
- [ ] **Actif = Passif** dans le bilan prévisionnel
- [ ] **Edge cases** — division par zéro, valeurs nulles, tableaux vides

## 8. Tests & Build

- [ ] `npx vitest run` — 240+ tests passent
- [ ] `npx vite build` — build sans erreurs
- [ ] Pas de warnings dans la console navigateur

## 9. UI/UX

- [ ] Dark mode vérifié sur les nouvelles pages/composants
- [ ] WCAG AA contraste respecté (texte sur fond)
- [ ] Portails pour les overlays `position: fixed`
- [ ] Touch targets minimum 40px (sauf `header` size 32px)

---

## Quand exécuter cette checklist

- **Avant chaque push** sur `dev` ou `main`
- **Après chaque session de travail** majeure
- **Après un batch de fixes** (code review, bug fixes)

## Audit financier périodique

Réaliser un audit complet des calculs financiers :
- À chaque modification de `src/utils/calculations.js`, `revenueCalc.js`, `balanceSheetCalc.js`, `kpis.js`
- À chaque modification de `IncomeStatementPage`, `BalanceSheetPage`, `CashFlowPage`, `AccountingPage`
- À chaque ajout/modification de champs qui impactent les calculs (growthRate, linkedStream, TVA, PCMN)
