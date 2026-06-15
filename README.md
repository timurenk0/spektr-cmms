# PRIORITY
- Edit maintenance logic (leave as it is - ok, but dangerous. adds events, not replaces) (add overhaulCounter or nah)
- Move all document upload to backend to ensure submission atomicity (no duplicate requests from frontend atleast)
- Event shift logic to shift and count from the event endDate, not start (think about continuous non-several-day events) 
- Disable maintenance event submission button after first click (document upload duplication issue)

# ISSUES
- Change JWT_SECRET to something more serious
- When moving events serviceEndDate not checked (meh who cares anyways it's their problem)

- usefulLifeSpan to remainingLifeSpan + overhaul logic
    - hadOverhaul column is present now (rename to hasOverhaul or smth)
    - add separate hadOverhaul or overhaulCounter to keep track of remainingLifeSpan and max allowed health score

# FEATURES
- Trim EVERY form input
- Search bar for maintenance list
- Change the TabList in theme to "legacy" version
- Prettify activities log
- User position in the company for laughs and giggles (maintenance event by position separation in the future)

