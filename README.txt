VISION OF LOVE — CHARITY SYSTEM
================================

This project follows the supplied functionality guide and the
provided visual reference.

FILES
-----
index.html
distribution.html
donation.html
delete-search.html
package-allocation.html
style.css
script.js
server.js

IMAGES/
  hero.jpg

LOGOS/
  PNG-only interface/logo files

TEXTFILE/
  distribution.txt
  donation.txt
  delete-search.txt
  package-allocation.txt

RUN LOCALLY
-----------
1. Install Node.js.
2. Open a terminal in this project folder.
3. Run:

   node server.js

4. Open:

   http://localhost:3000

IMPORTANT
---------
Do not double-click the HTML files if you want TXT persistence.
The local server is what allows the JavaScript to communicate with
the backend and save data into TEXTFILE/*.txt.

FUNCTIONS INCLUDED
------------------
- Home navigation
- Distribution / Family Records
- Family validation
- Save family records
- Display family records
- Filter family records
- Update family records
- Clear form
- Donation save/display/clear
- Search records
- Delete with confirmation
- Package add/display/update/delete/clear
- Print displayed information
- Download displayed information
- Responsive/mobile layout
- Required PNG logo/icon set
- No Profile, Logout or Exit controls

DATA FORMAT
-----------
The TXT files use one JSON record per line. They remain ordinary
text files while allowing reliable structured read/write operations.
