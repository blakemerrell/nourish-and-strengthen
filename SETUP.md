# Sharing one plan between two phones

Without this, the app saves everything in whatever browser you opened it in. Your
phone and your wife's phone keep separate favorites, separate weeks, separate lists.

This connects both phones to one shared record. It is free — nothing here approaches
the paid tier, and there is no card to enter.

Roughly five minutes.

---

## 1. Make a Firebase project

1. Go to **<https://console.firebase.google.com>** and sign in with your Google account.
2. **Create a project**. Name it anything — `storehouse-recipes` works.
3. It offers Google Analytics. Turn it **off**; you do not need it.
4. Wait for it to finish, then **Continue**.

## 2. Turn on the database

1. In the left sidebar: **Build → Firestore Database**.
2. **Create database**.
3. Pick a location near you (`nam5 (United States)` is fine). This cannot be changed later.
4. When it asks for a mode, choose **Start in production mode**. Step 4 sets the rules.

## 3. Turn on anonymous sign-in

This is what stops strangers from reaching the database. Neither of you makes an
account or types a password — the app signs itself in silently.

1. Left sidebar: **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Anonymous** → toggle **Enable** → **Save**.

## 4. Set the security rules

1. Back in **Firestore Database**, open the **Rules** tab.
2. Replace everything there with this:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function houseFields() {
      return ['favs', 'weeks', 'active', 'mine', 'edits', 'pantry', 'pantryNew',
        'kitchen', 'src', 'rate', 'opts', 'low', 'members', 'lastInvite',
        'plan', 'checked', 'myday', 'diners'];
    }

    function mapOf(d, k, most) { return !(k in d) || (d[k] is map && d[k].size() <= most); }

    function houseShape(d) {
      return d.keys().hasOnly(houseFields())
        && (!('favs' in d) || (d.favs is list && d.favs.size() <= 2000))
        && mapOf(d, 'weeks', 300) && mapOf(d, 'mine', 2000) && mapOf(d, 'edits', 1000)
        && mapOf(d, 'pantry', 2000) && mapOf(d, 'pantryNew', 1000)
        && mapOf(d, 'kitchen', 2000) && mapOf(d, 'src', 2000) && mapOf(d, 'rate', 2000)
        && mapOf(d, 'opts', 100) && mapOf(d, 'low', 2000)
        && mapOf(d, 'plan', 50) && mapOf(d, 'checked', 2000) && mapOf(d, 'myday', 50)
        && mapOf(d, 'diners', 20)
        && (!('active' in d) || (d.active is string && d.active.size() <= 64))
        && (!('members' in d) || (d.members is list && d.members.size() <= 50))
        && (!('lastInvite' in d) || (d.lastInvite is string && d.lastInvite.size() <= 64));
    }

    function shrinksByOne(k) {
      return !(k in resource.data)
        || request.resource.data[k].size() >= resource.data[k].size() - 1;
    }

    function keepsWhatItHas() {
      return request.resource.data.keys().hasAll(resource.data.keys().removeAll(['myday']))
        && shrinksByOne('weeks') && shrinksByOne('mine') && shrinksByOne('edits')
        && shrinksByOne('favs') && shrinksByOne('pantryNew');
    }

    function named() {
      return request.auth.token.get('firebase', {}).get('sign_in_provider', '') != 'anonymous';
    }

    function membersByThemselves() {
      let was = resource.data.get('members', []);
      let now = request.resource.data.get('members', []);
      let before = was.toSet();
      let after = now.toSet();
      let me = [request.auth.uid].toSet();
      return now == was || (named() && now.size() == after.size()
        && (after == before.union(me) || after == before.difference(me)));
    }

    function dinerOk(e) {
      return e is map && e.keys().hasOnly(['n', 'kc', 'p']) && e.keys().hasAll(['n', 'kc', 'p'])
        && e.n is string && e.n.size() >= 1 && e.n.size() <= 30
        && e.kc is int && e.kc >= 150 && e.kc <= 3000
        && e.p is int && e.p >= 0 && e.p <= 400;
    }

    function ownDinerOk(d) {
      return !(request.auth.uid in d) || dinerOk(d[request.auth.uid]);
    }

    function dinersByThemselves() {
      let after = request.resource.data.get('diners', {});
      let changed = after.diff(resource.data.get('diners', {})).affectedKeys();
      return changed.size() == 0
        || (named() && changed.hasOnly([request.auth.uid]) && ownDinerOk(after));
    }

    match /households/{code} {
      allow get: if request.auth != null;
      allow create: if request.auth != null
        && houseShape(request.resource.data)
        && request.resource.data.get('members', []).toSet()
          .difference([request.auth.uid].toSet()).size() == 0
        && request.resource.data.get('diners', {}).keys().hasOnly([request.auth.uid])
        && ownDinerOk(request.resource.data.get('diners', {}))
        && (named() || (request.resource.data.get('members', []).size() == 0
          && request.resource.data.get('diners', {}).size() == 0));
      allow update: if request.auth != null
        && houseShape(request.resource.data)
        && keepsWhatItHas()
        && membersByThemselves()
        && dinersByThemselves();
      allow list, delete: if false;
    }

    match /users/{uid} {
      allow get, create, update, delete: if request.auth != null && request.auth.uid == uid;
      allow list: if false;
    }

    match /users/{uid}/train/{year} {
      allow get, list, delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && year.matches('^[0-9]{4}$');
    }

    match /invites/{token} {
      allow get: if request.auth != null
        && (resource == null
          || (resource.data.used == false && resource.data.exp > request.time.toMillis()));
      allow create: if request.auth != null
        && request.resource.data.keys().hasOnly(['house', 'by', 'made', 'exp', 'used'])
        && request.resource.data.by == request.auth.uid
        && request.resource.data.used == false
        && request.resource.data.house is string
        && request.resource.data.exp is int
        && request.resource.data.exp > request.time.toMillis()
        && request.resource.data.exp <= request.time.toMillis() + 8 * 86400000
        && request.auth.uid in get(/databases/$(database)/documents/households/$(request.resource.data.house)).data.get('members', []);
      allow update: if request.auth != null
        && named()
        && resource.data.used == false
        && resource.data.exp > request.time.toMillis()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['used', 'usedBy'])
        && request.resource.data.used == true
        && request.resource.data.usedBy == request.auth.uid;
      allow list, delete: if false;
    }
  }
}
```

> **Already set up? Paste these again.** They now also stop anyone holding a
> household code from wiping the household in one write, from taking other
> people off its members list, or from filling it with anything the app never
> writes; and an invite link stops giving the household's code away once it
> has been used or has expired, and cannot be made to last longer than eight
> days. Nothing the app does is refused by them — `tests/rules/` checks that
> against the Firestore emulator, every write the app makes and every one it
> should not. Until you publish them the app works exactly as before; it just
> is not protected.
>
> **Old private My Day codes.** Before My Day moved to accounts, some copies
> kept a person's day — weigh-ins included — in the `households` collection
> under a private code, in a field called `myday`. The app no longer knows
> those codes, so it cannot clear them itself. In **Firestore Database →
> Data**, open `households`, add a filter on the field `myday` (not equal to
> null), and delete the documents it finds. The rules above let a signed-in
> client clear that one field, which is all the app would ever need.
>
> **Sharing dinner numbers?** Plan my week can hold a dinner to each
> person's Nourish plan once they share it from *Sync & sharing*. That writes
> one entry under `diners` in the household — a name, and a dinner's calories
> and protein — and the rules above are what let a person write their own and
> nobody else's. Until you publish them the household refuses it, and the
> switch says so; nothing else about sharing changes.
>
> **Adding Strengthen's yearly records?** Your rules have
> everything above except the three lines starting `match /users/{uid}/train/{year}`.
> Paste the whole block above over what is there (it is the same as
> `firestore.rules` in this repository, without the comments) and press
> **Publish**. Until you do, Strengthen keeps every workout in your one account
> record, as before — which fills at about 1 MB, roughly three years of training —
> and Settings says so. After, the next time the app opens it copies your workouts
> into one record per year, and only then takes them out of the old record.

The split matters. `read` is two permissions wearing one name — `get`, which
fetches the one household whose code you typed, and `list`, which queries the
collection and hands back all of them. The app never lists: it asks for exactly
one document by its code and nothing else. Granting `list` therefore buys you
nothing and costs you the whole premise, because a household code stops being a
secret worth keeping the moment someone can ask for every code there is. And
anyone can ask — the app signs visitors in anonymously by design, so
`request.auth != null` is true for every person who opens the page.

`delete` is off for the same reason it is never used: nothing in the app removes
a household, so nothing should be allowed to.

3. **Publish**. Typing them is not enough — an unpublished rule is not in force.

> The same rules are kept in `firestore.rules` in this repository, so what is
> supposed to be live is reviewable rather than only remembered. If you would
> rather not use the console: `firebase login` once, then
> `firebase deploy --only firestore:rules` from the project folder does the
> same thing. Or let GitHub publish them, below.

### Publishing the rules from GitHub

Set up once, and every change to `firestore.rules` that reaches `main` is
published by itself (`.github/workflows/rules.yml`), after the same emulator
check the pull request passed. It needs a key that can do one thing: publish
security rules.

1. Open [Create service account](https://console.cloud.google.com/iam-admin/serviceaccounts/create)
   in Google Cloud, with your Firebase project chosen at the top.
2. **Service account name:** `rules-publisher`. **Create and continue**.
3. **Role:** type *Firebase Rules Admin*, choose it. **Continue**, then **Done**.
4. In the list, click `rules-publisher@…` → the **Keys** tab → **Add key** →
   **Create new key** → **JSON** → **Create**. A `.json` file downloads.
5. In GitHub: the repository's **Settings → Secrets and variables → Actions →
   New repository secret**. **Name:** `FIREBASE_RULES_KEY`. **Secret:** the whole
   contents of that `.json` file. **Add secret**.
6. Delete the downloaded `.json` file. GitHub keeps the only copy it needs.

To publish what is on `main` now: **Actions → rules → Run workflow**. The
job's last line says `Published firestore.rules (sha256 …)` once the live rules
read back as this file. The key can publish rules and nothing else: it cannot
read or change the households, and it is refused for any project but the one in
`.firebaserc`. To stop it, delete the key in Google Cloud.

This says: only a signed-in app can touch the household records, and nothing else in
the database is reachable at all.

## 5. Copy your six values into the app

1. Click the **gear** next to *Project Overview* → **Project settings**.
2. Scroll to **Your apps** and click the **`</>`** (web) icon.
3. Nickname it anything. **Do not** tick "Firebase Hosting". → **Register app**.
4. It shows a code block containing `const firebaseConfig = { ... }`.
5. Open **`src/config.js`** in this project and copy each value across, keeping the
   quotes:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSy…",
  authDomain: "storehouse-recipes.firebaseapp.com",
  projectId: "storehouse-recipes",
  storageBucket: "storehouse-recipes.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123"
};
```

Save the file. If the app is online, push the change so both phones get it: a
push to `main` is published by the **deploy** workflow, which needs Pages set to
publish from GitHub Actions (**Settings → Pages → Source → GitHub Actions**, once —
see *Putting it online* in the README). The phones pick the new build up the next
time the app is opened; the *Sync & sharing* sheet names the build each is running.

> These values are not secrets — every web app that uses Firebase ships them in
> plain sight, and they are safe in a public repository. The security rules in
> step 4 are what actually protect the data.

**A different Firebase project means one more line to change.** `index.html` carries
a content-security policy — the list of hosts the page may load from, talk to and
frame — and it names this project's auth domain in `frame-src`
(`https://storehouse-recipe-book.firebaseapp.com`). Put your `authDomain` there, or
Google sign-in by popup will be refused. The same goes for any new outside service
the app is taught to use: a host missing from the policy is blocked without a word on
screen, which is why `tests/csp.test.js` reads every host the code fetches from and
fails when the policy does not allow it.

## 6. Pair the two phones

1. Open the app and tap **Local** in the top-right corner.
2. It offers a household code, something like `KETTLE-4827-ORCHARD`. Tap
   **Use this code**. The badge turns to **Synced**.
3. On the other phone, open the same link, tap the badge, type that same code into
   *Or type a code you already have*, and tap **Join**.

That is it. Favorites, every week you have planned, which one is showing, and the
shopping-list check-offs are now the same on both.

Whatever was already saved on the first phone seeds the shared record, so you do not
lose a week you had already planned. The second phone adopts the shared version.

---

## Worth knowing

**The code is the key.** There is no password. Anyone who has the household code can
see and change your meal plan and shopping list. Keep it between the two of you. What
is in there is a grocery list — no names, no addresses, no payment anything — so the
practical risk is small, but that is the honest description.

**It works without signal.** Changes made offline queue up and go out when the phone
reconnects. The badge reads *Offline* while it waits.

**Both editing at once is fine.** Adding a recipe to Tuesday touches only Tuesday, and
ticking off milk touches only milk, so you will not overwrite each other.

**To stop sharing on one device**, tap the badge → *Stop sharing on this device*. That
device keeps its current copy and stops sending changes; the other phone is untouched.

## If something goes wrong

**Badge says "Sync issue"** — open the panel and read the message underneath.

- *Firestore refused the connection* → step 3 or step 4 did not take. Check that
  Anonymous sign-in is enabled and that the rules were **published**, not just typed.
- *Could not start syncing* → usually no internet, or an ad-blocker blocking
  `gstatic.com`. The app keeps saving on the device either way.

**Badge stays "Local"** — `src/config.js` still has empty values, or the edited file
was not pushed to where the phone loads the app from. Check that the latest **deploy**
run in the Actions tab is green; a red *Publish* step that names the Pages source means
the setting above has not been switched yet.

**Nothing appears on the second phone** — check the code matches exactly, including the
hyphens. It is case-insensitive; the app upper-cases it for you.
