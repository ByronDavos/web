# Οδηγίες Εκτέλεσης (Backend, Frontend, Βάση)

Αυτές οι οδηγίες βασίζονται στην εκφώνηση της άσκησης *Σύστημα Υποστήριξης Διπλωματικών* και στο παρόν repository.

## 1) Βάση Δεδομένων (MySQL/MariaDB)

1. Δημιούργησε βάση και σχήμα:
   ```sql
   SOURCE WEB-database/create.sql;
   SOURCE WEB-database/indexes.sql;
   ```
   (προαιρετικά, χρησιμοποίησε και `WEB-database/insert_users_hashed.sql` αν θέλεις μόνο τους users).

2. Επιβεβαίωσε ότι η βάση `web_database` δημιουργήθηκε και ότι υπάρχουν δεδομένα-δείγματα
   (>=10 φοιτητές, >=5 διδάσκοντες).

> **Σημείωση για passwords**: Τα hashes στους seed χρήστες είναι ήδη έγκυρα Bcrypt (12 rounds).
> Αν έχεις δικά σου δεδομένα, μπορείς να τα περάσεις μέσω του endpoint `/api/import` (δες παρακάτω)
> και θα παραχθούν τυχαίοι κωδικοί που επιστρέφονται στην απόκριση. 

## 2) Backend (Node.js + Express)

1. Αντιγραφή `.env` από `.env.example` και συμπλήρωση τιμών (DB, JWT):
   ```bash
   cd web/WEB-back-end
   cp .env.example .env
   # Άλλαξε JWT_SECRET και DB_* κατάλληλα
   ```

2. Εγκατάσταση εξαρτήσεων (αν λείπουν):
   ```bash
   npm install
   ```

3. Εκκίνηση backend:
   ```bash
   npm start
   ```
   Θα ακούει στο `http://localhost:3000` (ή στο `PORT` που όρισες).

- Το CORS είναι ρυθμισμένο ώστε να δέχεται **πολλαπλά origins** (π.χ. `http://127.0.0.1:5500, http://localhost:5500`) και requests χωρίς `Origin` (π.χ. από `file://`).

## 3) Frontend (στατικές σελίδες)

Χρησιμοποίησε έναν απλό static server π.χ. VSCode **Live Server** ή:
```bash
# από τον φάκελο web/front-end
npx http-server -p 5500 -c-1 .
# ή
python3 -m http.server 5500
```
- Από προεπιλογή, το front-end ανιχνεύει το hostname και στοχεύει `http://<hostname>:3000` για API.
- Αν θες άλλο base URL μπορείς να ορίσεις `window.API_BASE` πριν φορτώσουν τα scripts.

## 4) Έλεγχος βασικών flows

- **Σύνδεση**: από `index.html` ή από τις σελίδες `didaskon/*`, `foititis/*`, `grammateia/*`.
- **Θέματα**: δημιουργία/προβολή από το UI του Διδάσκοντα.
- **Αναθέσεις**: `/api/theses/assign`, προσκλήσεις `/api/invitations`.
- **Σημειώσεις / Βαθμολογίες**: `/api/notes`, `/api/grades`.
- **Public feed** (χωρίς login): `GET /feed/announcements?from=YYYY-MM-DD&to=YYYY-MM-DD&format=json|xml`.

## 5) Troubleshooting

- CORS error: έλεγξε τη μεταβλητή `ALLOWED_ORIGIN` στο `.env` (comma-separated origins).
- Σύνδεση DB: έλεγξε ότι η MySQL ακούει στο `DB_HOST:DB_PORT` και ότι υπάρχουν δικαιώματα στον `DB_USER`.
- 404 στα JS modules: Βεβαιώσου ότι σερβίρεις **ολόκληρο** τον φάκελο `web/front-end` στη ρίζα του server (ώστε να υπάρχουν οι διαδρομές `/assets`, `/didaskon`, κ.λπ.).
- Passwords στα seed users: αν δεν τα γνωρίζεις, χρησιμοποίησε το endpoint `/api/import` για να περάσεις τους δικούς σου χρήστες και να πάρεις πίσω τους κωδικούς τους.
