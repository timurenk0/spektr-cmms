# PRIORITY
- Reduce health index after incomplete emergency and overhaul???
- Edit maintenance logic (leave as it is - ok, but dangerous. adds events, not replaces) (add overhaulCounter )
- Maint working hours not enough (every 200h, only 100h passed)
- Disable maintenance event submission button after first click (document upload duplication issue)
    - Move all document upload to backend to ensure submission atomicity (no duplicate requests from frontend atleast)

- Event turn incomplete in DB after 7-10 days logic

# ISSUES
- Change JWT_SECRET to something more serious
- Probably wanna change equipment overhaul counter update to raw sql query (avoid race condition or whatever)
- When moving events serviceEndDate not checked (meh who cares anyways it's their problem)

- usefulLifeSpan to remainingLifeSpan + overhaul logic
    - hadOverhaul column is present now (rename to hasOverhaul or smth)
    - add separate hadOverhaul or overhaulCounter to keep track of remainingLifeSpan and max allowed health score

# FEATURES
- Trim EVERY form input
- Search bar for maintenance list
- Change the TabList in theme to "legacy" version
- User position in the company for laughs and giggles (maintenance event by position separation in the future)