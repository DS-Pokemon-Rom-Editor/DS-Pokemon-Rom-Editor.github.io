## 🐛 Crash & Bug Fixes

| What changed | What to check |
|--------------|----------------|
| Fixed crash in Spawn Editor when values went out of range | Try editing spawns with extreme or unusual values – no crash |
| Fixed crash when saving a Trainer (especially with AI flags) | Save any trainer, especially one with AI flags set |
| Fixed crash when force-unpacking all NARCs | Run force unpack on a ROM – no crash |
| Fixed crash when opening a ROM while an extracted folder already exists | Open a ROM when its extracted data is already present |
| Fixed crash in move editor from invalid ability (2nd slot in DPPT) | Edit Pokémon moves – no unexpected crash |
| Fixed crash from hex parsing issues | Use any hex input field (e.g., level scripts) |
| Fixed crash from wrong flytable reading (closes #9) | Fly to different locations in-game after editing maps |

---

## 🧠 New Features & Editors (Need Testing)

| Feature | What to check |
|---------|----------------|
| **Bug Contest Editor** added under Special Encounters | Edit Bug Contest encounter data – saves and loads correctly |
| **Honey Tree Editor** added | Edit honey tree encounters – saves and applies in-game |
| **Trainer Text Editor** added | Edit trainer battle text (intro, victory, etc.) |
| **Research Helper** + Scripts research tab | Use the Research Tool to inspect scripts and headers |
| **Header Watch** in research tool | Watch ROM headers change in real time |
| **Bulk Learnset Editor** import feature | Import/export learnsets in bulk |
| **Special sprite var overworld actors** now in dropdown | When editing overworld actors, the special sprite var appears in the dropdown |

---

## 🧩 UI / Usability Improvements

| What changed | What to check |
|--------------|----------------|
| **Hover tooltips** in script editor – shows which message string buffer matches which command | Hover over script commands that use string buffers |
| **Double-click** an event list item to jump to that action | In event editor, double-click any event entry |
| Warning popup when a Pokémon has too many moves – dismissible per project | Add >4 moves to a mon – warning appears; dismiss it, then reopen project – warning state remembered |
| ROM title no longer truncated at first period (fixes #109) | Open a ROM named like `MyRom.v4.nds` – title shows full name |
| **AI flag tooltips** added in Trainer Editor | Hover over AI checkboxes – see explanation |
| CSV export now includes all data needed for full Showdown dex docs | Export CSV and verify completeness |
| Removed unused matrix colors (vanilla-only) | No visual change; just cleaner |
| Option to create supporting files when adding a new header | Add a new header – supporting files are created automatically |

---

## 🔁 Script / Text / Encoding Fixes

| What changed | What to check |
|--------------|----------------|
| Fixed level script being added to dropdown twice | Open level script dropdown – no duplicates |
| Fixed hex handling in level scripts (addresses #8 fully) | Edit level scripts with hex values – saves correctly |
| Fixed string replacement issues in ScriptDatabase | Scripts with text placeholders work |
| Male/female symbols now use prefixed versions | In-game text shows gender symbols correctly |
| Fixed German SoulSilver text issues | Open German SoulSilver ROM – text displays properly |
| Fixed ROM / text conversion issues | Save text edits, rebuild ROM, play on hardware/emulator |
| Fixed text archive rebuild (via chatot update) | Edit any text, save – rebuilds correctly |
| Fixed language not being passed to chatot correctly | Edit text in non-English ROMs – changes stick |
| Fixed “Expand Trainer Names” text inconsistency (#31) | Use patch toolbox to expand trainer names – no text corruption |

---

## 🛠️ Under the Hood (Low Risk, But Test If You Have Time)

| What changed | What to check |
|--------------|----------------|
| Migrated from ndstool to ds-rom | Open ROM, save ROM, rebuild – works as before |
| ARM9 expansion compatibility checks improved | Editing ROMs that need ARM9 expansion (Platinum, HGSS) |
| JP HGSS now supports ARM9 expansion | Open JP HGSS ROM and use features that require expansion |
| Fixed multiboot issue (ds-rom update) | ROM builds correctly |
| Removed unnecessary auto-assign workflow file | No visible change |
| Fixed path issue in chatot | Text archives rebuild correctly |

---

## ⚠️ Known / Addressed Issues (from your list)

| Issue # | Summary | Fixed in PR |
|---------|---------|--------------|
| #8 | Move editor selection/range issues | #95, #96 |
| #9 | Flytable crash | #122 |
| #31 | Trainer name expansion text inconsistency | #124 |
| #79 | Bulk learnset editor filtered selection bug | #93 |
| #91 | Need help linking string buffer commands to tooltips | #92, #94 |
| #109 | ROM title truncated at period | #112 |
| #146 | Bug contest editor missing | #148 |

---

## ✅ Quick Test Checklist for Testers

- [ ] Open a ROM, save it, rebuild – no crashes  
- [ ] Edit a spawn in Spawn Editor  
- [ ] Edit a trainer and save  
- [ ] Use hex fields anywhere (level scripts, moves, etc.)  
- [ ] Hover over script commands and AI flags  
- [ ] Double-click event list items  
- [ ] Open a ROM with periods in the filename  
- [ ] Try Bug Contest Editor and Honey Tree Editor  
- [ ] Export CSV and check completeness  
- [ ] Test on German SoulSilver if available  