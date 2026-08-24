# PRIORITY
- Calendar event add equipment name to the title (make copyable)

- Changing working hours in equipment details page adjusts maintenance schedule (check!!! if edit was made a week ago but equipment worked for 3 days only during that week)
- Working Hours edit 2+ hours moves the maintenance schedule
- Maint working hours not enough (every 200h, only 100h passed)

- Health index MIN value at 30% (Overhaul required banner)

- Edit maintenance logic (leave as it is - ok, but dangerous. adds events, not replaces) (add overhaulCounter )


# ISSUES
- Change JWT_SECRET to something more serious
- Probably wanna change equipment overhaul counter update to raw sql query (avoid race condition or whatever)
- When moving events serviceEndDate not checked (meh who cares anyways it's their problem)

- usefulLifeSpan to remainingLifeSpan + overhaul logic
    - hadOverhaul column is present now (rename to hasOverhaul or smth)
    - add separate hadOverhaul or overhaulCounter to keep track of remainingLifeSpan and max allowed health score

# FEATURES
- Trim EVERY form input
- Think of old ass equipment with recent overhaul. How to count health index? (input for last overhaul date upon addition)
- Select thumbnail photo from all photos list
- Search bar for maintenance list
- Change the TabList in theme to "legacy" version
- User position in the company for laughs and giggles (maintenance event by position separation in the future)