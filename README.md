# PRIORITY
- Emergency and overhaul events only COMPLETE option and delete future maintenance events allow admins to reevaluate equipment health index on complete
    - Upon emergency repair "activation" ask admin whether to delete ongoing maintenance schedule for this equipment (e.g. emergency takes too long to fit in the current schedule)
    - Overhaul is technically also "Under Repair" status so don't use out of service lil bro
    - Emergency repair count and check in equipment table like overhaul event

- REMOVE .toSpliced() in EventManager and think of normal logic
- Working Hours edit 2+ hours moves the maintenance schedule
- Reduce health index after incomplete emergency and overhaul???
    - What to do on incomplete emergency/overhaul event????
- Edit maintenance logic (leave as it is - ok, but dangerous. adds events, not replaces) (add overhaulCounter )
- Maint working hours not enough (every 200h, only 100h passed)
- Disable maintenance event submission button after first click (document upload duplication issue)
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