# PRIORITY
- Calendar event add equipment name to the title (make copyable)
- Pop-up when health index input is higher than ideal (are you sure | previous overhaul case)
- Changing working hours in equipment details page adjusts maintenance schedule
- Think of old ass equipment with recent overhaul. How to count health index? (input for last overhaul date upon addition)
- Out of service status deletes future maintenance
- Health index MIN value at 30% (Overhaul required banner)

- Working Hours edit 2+ hours moves the maintenance schedule
- Reduce health index after incomplete emergency and overhaul???
    - What to do on incomplete emergency/overhaul event????
- Edit maintenance logic (leave as it is - ok, but dangerous. adds events, not replaces) (add overhaulCounter )
- Maint working hours not enough (every 200h, only 100h passed)
- Move all document upload to backend to ensure submission atomicity (no duplicate requests from frontend atleast)


# ISSUES
- Change JWT_SECRET to something more serious
- Probably wanna change equipment overhaul counter update to raw sql query (avoid race condition or whatever)
- When moving events serviceEndDate not checked (meh who cares anyways it's their problem)

- usefulLifeSpan to remainingLifeSpan + overhaul logic
    - hadOverhaul column is present now (rename to hasOverhaul or smth)
    - add separate hadOverhaul or overhaulCounter to keep track of remainingLifeSpan and max allowed health score

# FEATURES
- Select thumbnail photo from all photos list
- Trim EVERY form input
- Search bar for maintenance list
- Change the TabList in theme to "legacy" version
- User position in the company for laughs and giggles (maintenance event by position separation in the future)