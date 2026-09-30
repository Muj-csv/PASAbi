/**
 * PASAbi UI strings, EN / FIL. Ported from docs/design/code/src/design/copy.ts
 * (wording source: docs/design/SCREENS.md) plus the keys the connected app
 * needed, marked "added". Every UI string lives here (CLAUDE.md).
 *
 * Rules (DESIGN_BRIEF §9, PRD BR-017): sentence case, word budgets, caveats
 * are constants, never "successfully / please / oops / verified / confirmed",
 * never "safe" outside "I'm safe", never "responders received".
 * Filipino is a first draft: a native speaker must pass it before the demo.
 */
export type Lang = "en" | "fil";

const en = {
  // Status band
  "band.offline": "Offline · reports stay on this phone",
  "band.online": "Online",
  "band.online.ready": "Online · ready offline", // added: plan §23A.5
  "band.station": "Station · {name}",
  "band.offline.station": "Offline · local data only",
  "band.online.station": "Online · uploaded {time}",
  "band.responder": "Responder view · last sync {time}",
  "band.responder.never": "Responder view", // added
  "band.storage": "· storage almost full",

  // Home
  "home.count": "reports on this phone",
  "home.countEmpty": "Nothing on this phone yet",
  "home.urgent": "{n} urgent",
  "home.last": "Your last report",
  "home.rateLimit": "6 reports this hour. Try again at {time}.",
  "home.mine": "My reports", // added
  "home.settings": "Settings", // added
  "action.report": "Report",
  "action.report.sub": "What's happening?",
  "action.passOn": "Pass on",
  "action.receive": "Receive",
  "action.safe": "I'm safe",

  // Report flow
  "report.q1": "What's happening?",
  "report.q2": "How many need help?",
  "report.notSure": "Not sure",
  "report.q3": "What did you see?",
  "report.q3.ph": "e.g. Water above the road near the chapel",
  "report.q4": "Where?",
  "report.gps.finding": "Finding location", // added
  "report.gps.ok": "Location found",
  "report.gps.none": "Location not found",
  "report.landmark": "Purok or landmark",
  "report.landmark.optional": "Landmark (optional)",
  "report.next": "Next",
  "report.save": "Save report",
  "nav.back": "Back",
  "nav.cancel": "Cancel", // added
  "nav.less": "Fewer", // added: stepper minus label for screen readers
  "nav.more": "More", // added

  // Categories (BR-001)
  "cat.MEDICAL": "Medical",
  "cat.TRAPPED": "Trapped",
  "cat.STRUCTURAL": "Damage",
  "cat.FLOOD": "Flood",
  "cat.ROAD_BLOCKED": "Road blocked",
  "cat.MISSING_PERSON": "Missing person",
  "cat.WATER_FOOD": "Water & food",
  "cat.SHELTER": "Shelter",
  "cat.SAFE_CHECKIN": "I'm safe",

  // Slip + stamps (BR-015)
  "slip.status.saved": "Saved on this phone only.",
  "slip.status.passed": "Passed to another phone.",
  "slip.status.station": "Reached a station.",
  "slip.status.uploaded": "Uploaded from this phone.",
  "slip.grouped": "Grouped with reports from {n} other phones.",
  "slip.grouped.one": "Grouped with a report from 1 other phone.", // added
  "slip.missing": "This report is no longer on this phone.", // added
  "stamp.saved": "Saved",
  "stamp.passed": "Passed on",
  "stamp.station": "At station",
  "stamp.uploaded": "Uploaded",
  "stamp.ack": "Ack {time}",
  "stamp.acknowledged": "Acknowledged",
  "stamp.acknowledgedAt": "Acknowledged {time}", // added
  "stamp.resolved": "Resolved",
  "action.passItOn": "Pass it on",
  "action.done": "Done",

  // Pass on / receive
  "pass.title": "Pass on",
  "pass.hint": "Hold this up to the other phone.",
  "pass.batch": "Batch {i} of {n} · {count} reports",
  "pass.batch.one": "Batch {i} of {n} · 1 report", // added: singular
  "pass.pause": "Pause",
  "pass.resume": "Resume",
  "pass.next": "Next batch",
  "pass.scanReceipt": "Scan their receipt",
  "pass.scanReceiptHint": "Point at the receipt on their phone.", // added
  "pass.swap": "Swap roles to get theirs.",
  "pass.done": "Passed on {n}",
  "pass.doneStation": "Reached a station.", // added
  "pass.empty": "Nothing on this phone to pass on.",
  "pass.wrongReceipt": "That receipt is for another code.", // added
  "recv.title": "Receive", // added
  "recv.aim": "Point at their code.",
  "recv.progress": "Hold steady · {i} of {n}",
  "recv.got": "Got {n}",
  "recv.new": "{m} new",
  "recv.showReceipt": "Show receipt",
  "recv.receiptHint": "Let them scan this.",
  "recv.again": "Receive more", // added
  "recv.wrongBatch": "That code is from another batch.", // added
  "err.cantRead": "Can't read it. Tilt away from light.",
  "err.cantRead.2": "Can't read it. Move the phones apart a little.",
  "err.cantRead.3": "Can't read it. Keep the code inside the frame.",
  "err.camera": "Camera is off for PASAbi.",
  "err.cameraHint": "Allow the camera in Settings, then try again.", // added: a web app can't open Settings
  "err.tryAgain": "Try again", // added

  // My reports
  "mine.title": "My reports", // added
  "mine.tab": "Mine",
  "carrying.tab": "Carrying",
  "mine.empty": "Nothing reported yet.",
  "carrying.empty": "Not carrying anyone else's reports yet.", // added
  "delete.q": "Delete from this phone?",
  "delete.body": "Copies already passed on stay.",
  "delete.yes": "Delete",
  "delete.no": "Keep",
  "undo": "Undo",
  "undo.deleted": "Deleted.", // added

  // Settings
  "settings.title": "Settings", // added
  "settings.language": "Language",
  "settings.saves": "What PASAbi saves",
  "settings.saves.what": "What you report",
  "settings.saves.where": "Location, if found",
  "settings.saves.when": "Time",
  "settings.saves.noName": "Not your name",
  "settings.saves.noNumber": "Not your number",
  "settings.saves.noAccount": "No account",
  "settings.storage.kept": "This phone keeps PASAbi data.", // added
  "settings.storage.risk": "iOS may clear this data if space runs low.", // added
  "settings.station": "Station mode",
  "settings.station.hint": "The PIN only hides station mode on a shared phone.", // added
  "settings.station.name": "Station name", // added
  "settings.station.namePh": "e.g. Brgy. Hall", // added
  "settings.station.setPin": "Choose a PIN", // added
  "settings.station.pin": "PIN", // added
  "settings.station.start": "Start station", // added
  "settings.station.open": "Open station", // added
  "settings.responder": "Responder view", // added
  "pin.wrong": "Wrong PIN",
  "pin.short": "Use at least 4 digits.", // added
  "safe.title": "Tell the barangay you're safe.",
  "safe.go": "Check in",

  // Station ledger (evidence strings use a no-break space so a number never wraps away from its word)
  "ledger.title": "Situation",
  "ledger.counts": "{open} open · {resolved} resolved",
  "ledger.lastUpdate": "Last update here {time}",
  "ledger.sort": "By priority",
  "ledger.markSeen": "Mark seen",
  "ledger.empty": "No reports yet.",
  "ledger.allOld": "Everything here is over 3 hours old.",
  "mark.new": "New",
  "mark.phones": "More phones", // added: engine's newly_corroborated
  "mark.up": "Moved up", // added: engine's escalated (score rose)
  "fresh.fresh": "fresh",
  "fresh.aging": "aging",
  "fresh.stale": "old",
  "old.note": "May have changed.",
  "ev.phones": "{n} phones",
  "ev.phone": "1 phone",
  "ev.reports": "{n} reports",
  "ev.report": "1 report",
  "ev.people": "{n} people",
  "ev.person": "1 person", // added: singular
  "cov.title": "Coverage",
  "cov.high": "Many phones",
  "cov.limited": "Few phones",
  "cov.stale": "Quiet since {time}",
  "cov.none": "No reports",
  "cov.unnamed": "No area named",

  // Incident
  "inc.back": "Ledger",
  "inc.rank": "{ordinal} of {n} open",
  "inc.status.open": "Open · not acknowledged",
  "inc.status.acked": "Open · acknowledged",
  "inc.status.resolved": "Resolved {time}. A new report reopens it.",
  "inc.phones": "phones",
  "inc.reports": "reports",
  "inc.phone": "phone", // added: singular
  "inc.report": "report", // added: singular
  "inc.gone": "This incident changed. Open the ledger again.", // added
  "fact.lastHeard": "Last heard",
  "fact.firstHeard": "First heard",
  "fact.freshness": "Freshness",
  "fact.people": "People",
  "fact.people.value": "Up to {n}", // changed: the engine keeps the largest count, not the latest
  "fact.people.none": "Not reported",
  "fact.spread": "Spread",
  "fact.spread.value": "Within {m} m",
  "why.title": "Why {ordinal}?",
  "why.total": "Total",
  "why.more": "{n} more phones", // added
  "why.more.one": "1 more phone", // added
  "why.noMore": "No other phones", // added
  "why.noPeople": "No people count", // added
  "why.unacked": "Not acknowledged", // added
  "why.acked": "Acknowledged", // added
  "why.age": "Age of latest report", // added
  "gap.nearby": "Reported nearby",
  "gap.unheard": "Haven't heard about",
  "log.title": "Log",
  "log.reported": "{src} reported",
  "log.reportedAgain": "{src} reported again",
  "log.acked": "Acknowledged here",
  "log.resolved": "Resolved here",
  "log.ackedBy": "Acknowledged by {src}", // added
  "log.resolvedBy": "Resolved by {src}", // added
  "action.ack": "Acknowledge",
  "action.resolve": "Resolve",
  "undo.resolved": "Resolved.",

  // Station
  "station.title": "Station", // added
  "station.held": "reports held",
  "station.storage": "{n} of {max}",
  "station.lastUpload": "Last upload",
  "station.never": "Not yet", // added
  "station.connection": "Connection", // added
  "station.name": "Station name", // added
  "station.upload": "Upload now",
  "station.needsNet": "Needs internet.",
  "station.notConnected": "No responder database connected yet.", // added
  "station.uploaded": "Uploaded {n}", // added
  "station.uploadFailed": "Not uploaded. Still on this phone.",
  "station.retry": "Try again",
  "station.expected": "Expected areas", // added: FR-017, was S3
  "station.expected.hint": "Areas you expect reports from. Silence shows as No reports.", // added
  "station.expected.ph": "e.g. Purok 5", // added
  "station.expected.add": "Add area", // added
  "station.expected.remove": "Remove {area}", // added: screen-reader label
  "station.expected.full": "The list is full.", // added
  "station.leave": "Leave station mode",
  "tab.ledger": "Ledger",
  "tab.station": "Station",

  // Nearby by Bluetooth (D-033, added)
  "near.title": "Nearby phones",
  "near.inRange": "{n} phones in range",
  "near.inRange.one": "1 phone in range",
  "near.none": "No phones in range yet.",
  "near.range": "Shows who is in range, not how far.",
  "near.webOnly": "Bluetooth needs the PASAbi app. Use the QR above.",
  "near.off": "Bluetooth is off for PASAbi.",
  "near.turnOn": "Turn on Bluetooth",
  "near.ping": "Ping nearby",
  "near.pinging": "Passing on",
  "near.done": "Passed on to {n} phones",
  "near.done.one": "Passed on to 1 phone",
  "near.failed": "Couldn't reach them. Try again.",
  "near.me": "This phone",
  "near.webOnlyRecv": "Bluetooth needs the PASAbi app. Scan their QR below.",
  "near.waiting": "Waiting for nearby phones to ping.",
  "near.gotFrom": "Got {n} by Bluetooth · {m} new · {time}",
  "start.title": "Before you start",
  "start.body": "PASAbi works best with these on. No internet needed.",
  "start.bt": "Bluetooth",
  "start.loc": "Location",
  "start.btWhy": "To pass reports to phones near you.",
  "start.locWhy": "To attach where you are to a report.",
  "start.on": "On",
  "start.btOff": "Off. Turn it on in Control Center.",
  "start.btDenied": "Not allowed. Turn it on in Settings.",
  "start.locDenied": "Not allowed. You can still name a purok.",
  "start.locNone": "Not on this phone. Name a purok instead.",
  "start.webBt": "Needs the PASAbi app. QR works here.",
  "start.allow": "Allow",
  "start.later": "Not now",
  "start.continue": "Continue",
  "bt.hint": "If Bluetooth is off, turn it on in Settings.",

  // Responder view (W1)
  "resp.since": "Since last sync", // added
  "resp.nothing": "Nothing new since last sync.", // added
  "resp.new": "{n} new", // added
  "resp.more": "{n} more phones", // added
  "resp.up": "{n} moved up", // added
  "resp.resolved": "{n} resolved", // added
  "resp.all": "All", // added
  "resp.refresh": "Refresh", // added
  "resp.loading": "Loading uploaded reports", // added
  "resp.error": "Can't reach the responder database.", // added
  "resp.empty": "Nothing uploaded yet.", // added
} as const;

export type CopyKey = keyof typeof en;

const fil: Record<CopyKey, string> = {
  "band.offline": "Offline · nasa phone na ito ang ulat",
  "band.online": "Online",
  "band.online.ready": "Online · handa kahit offline",
  "band.station": "Istasyon · {name}",
  "band.offline.station": "Offline · lokal na datos lang",
  "band.online.station": "Online · na-upload {time}",
  "band.responder": "Para sa responder · huling sync {time}",
  "band.responder.never": "Para sa responder",
  "band.storage": "· halos puno na ang storage",

  "home.count": "ulat sa phone na ito",
  "home.countEmpty": "Wala pang laman ang phone na ito",
  "home.urgent": "{n} apurahan",
  "home.last": "Huling ulat mo",
  "home.rateLimit": "6 na ulat na ngayong oras. Subukan ulit sa {time}.",
  "home.mine": "Mga ulat ko",
  "home.settings": "Settings",
  "action.report": "Mag-ulat",
  "action.report.sub": "Ano'ng nangyayari?",
  "action.passOn": "Ipasa",
  "action.receive": "Tumanggap",
  "action.safe": "Ligtas ako",

  "report.q1": "Ano'ng nangyayari?",
  "report.q2": "Ilan ang kailangan ng tulong?",
  "report.notSure": "Hindi sigurado",
  "report.q3": "Ano'ng nakita mo?",
  "report.q3.ph": "hal. Tubig lampas daan malapit sa kapilya",
  "report.q4": "Saan?",
  "report.gps.finding": "Hinahanap ang lokasyon",
  "report.gps.ok": "Nahanap ang lokasyon",
  "report.gps.none": "Hindi mahanap ang lokasyon",
  "report.landmark": "Purok o palatandaan",
  "report.landmark.optional": "Palatandaan (opsyonal)",
  "report.next": "Susunod",
  "report.save": "I-save ang ulat",
  "nav.back": "Bumalik",
  "nav.cancel": "Kanselahin",
  "nav.less": "Bawasan",
  "nav.more": "Dagdagan",

  "cat.MEDICAL": "Medikal",
  "cat.TRAPPED": "Na-trap",
  "cat.STRUCTURAL": "Pinsala",
  "cat.FLOOD": "Baha",
  "cat.ROAD_BLOCKED": "Sarado ang daan",
  "cat.MISSING_PERSON": "Nawawala",
  "cat.WATER_FOOD": "Tubig at pagkain",
  "cat.SHELTER": "Matutuluyan",
  "cat.SAFE_CHECKIN": "Ligtas ako",

  "slip.status.saved": "Naka-save lang sa phone na ito.",
  "slip.status.passed": "Naipasa na sa ibang phone.",
  "slip.status.station": "Umabot na sa istasyon.",
  "slip.status.uploaded": "Na-upload mula sa phone na ito.",
  "slip.grouped": "Kasama ng ulat mula sa {n} pang phone.",
  "slip.grouped.one": "Kasama ng ulat mula sa 1 pang phone.",
  "slip.missing": "Wala na sa phone na ito ang ulat.",
  "stamp.saved": "Naka-save",
  "stamp.passed": "Naipasa",
  "stamp.station": "Nasa istasyon",
  "stamp.uploaded": "Na-upload",
  "stamp.ack": "Natanggap {time}",
  "stamp.acknowledged": "Natanggap",
  "stamp.acknowledgedAt": "Natanggap {time}",
  "stamp.resolved": "Tapos na",
  "action.passItOn": "Ipasa",
  "action.done": "Tapos",

  "pass.title": "Ipasa",
  "pass.hint": "Itapat ito sa kabilang phone.",
  "pass.batch": "Batch {i} ng {n} · {count} ulat",
  "pass.batch.one": "Batch {i} ng {n} · 1 ulat",
  "pass.pause": "Ihinto",
  "pass.resume": "Ituloy",
  "pass.next": "Susunod",
  "pass.scanReceipt": "I-scan ang resibo",
  "pass.scanReceiptHint": "Itapat sa resibo sa phone nila.",
  "pass.swap": "Magpalit para makuha ang sa kanila.",
  "pass.done": "Naipasa {n}",
  "pass.doneStation": "Umabot na sa istasyon.",
  "pass.empty": "Walang maipapasa mula sa phone na ito.",
  "pass.wrongReceipt": "Para sa ibang code ang resibong iyan.",
  "recv.title": "Tumanggap",
  "recv.aim": "Itapat sa code nila.",
  "recv.progress": "Huwag galawin · {i} ng {n}",
  "recv.got": "Natanggap {n}",
  "recv.new": "{m} bago",
  "recv.showReceipt": "Ipakita ang resibo",
  "recv.receiptHint": "Ipa-scan ito sa kanila.",
  "recv.again": "Tumanggap pa",
  "recv.wrongBatch": "Galing sa ibang batch ang code na iyan.",
  "err.cantRead": "Hindi mabasa. Iiwas sa ilaw.",
  "err.cantRead.2": "Hindi mabasa. Ilayo nang kaunti ang mga phone.",
  "err.cantRead.3": "Hindi mabasa. Panatilihin ang code sa loob ng frame.",
  "err.camera": "Naka-off ang camera para sa PASAbi.",
  "err.cameraHint": "Payagan ang camera sa Settings, saka subukan ulit.",
  "err.tryAgain": "Subukan ulit",

  "mine.title": "Mga ulat ko",
  "mine.tab": "Akin",
  "carrying.tab": "Dala ko",
  "mine.empty": "Wala ka pang ulat.",
  "carrying.empty": "Wala ka pang dalang ulat ng iba.",
  "delete.q": "Burahin sa phone na ito?",
  "delete.body": "Mananatili ang mga naipasa na.",
  "delete.yes": "Burahin",
  "delete.no": "Huwag",
  "undo": "Ibalik",
  "undo.deleted": "Nabura.",

  "settings.title": "Settings",
  "settings.language": "Wika",
  "settings.saves": "Ano ang sine-save ng PASAbi",
  "settings.saves.what": "Ang iniulat mo",
  "settings.saves.where": "Lokasyon, kung nahanap",
  "settings.saves.when": "Oras",
  "settings.saves.noName": "Hindi ang pangalan mo",
  "settings.saves.noNumber": "Hindi ang numero mo",
  "settings.saves.noAccount": "Walang account",
  "settings.storage.kept": "Iniingatan ng phone ang datos ng PASAbi.",
  "settings.storage.risk": "Puwedeng burahin ito ng iOS kapag kulang ang espasyo.",
  "settings.station": "Station mode",
  "settings.station.hint": "Tinatago lang ng PIN ang station mode sa hiram na phone.",
  "settings.station.name": "Pangalan ng istasyon",
  "settings.station.namePh": "hal. Brgy. Hall",
  "settings.station.setPin": "Pumili ng PIN",
  "settings.station.pin": "PIN",
  "settings.station.start": "Simulan ang istasyon",
  "settings.station.open": "Buksan ang istasyon",
  "settings.responder": "Para sa responder",
  "pin.wrong": "Maling PIN",
  "pin.short": "Gumamit ng hindi bababa sa 4 na numero.",
  "safe.title": "Ipaalam sa barangay na ligtas ka.",
  "safe.go": "Mag-check in",

  "ledger.title": "Sitwasyon",
  "ledger.counts": "{open} bukas · {resolved} tapos na",
  "ledger.lastUpdate": "Huling update dito {time}",
  "ledger.sort": "Ayon sa priyoridad",
  "ledger.markSeen": "Nakita na",
  "ledger.empty": "Wala pang ulat.",
  "ledger.allOld": "Lahat dito ay lampas 3 oras na.",
  "mark.new": "Bago",
  "mark.phones": "Mas maraming phone",
  "mark.up": "Umakyat",
  "fresh.fresh": "bago",
  "fresh.aging": "lumilipas",
  "fresh.stale": "luma",
  "old.note": "Baka nagbago na.",
  "ev.phones": "{n} phone",
  "ev.phone": "1 phone",
  "ev.reports": "{n} ulat",
  "ev.report": "1 ulat",
  "ev.people": "{n} tao",
  "ev.person": "1 tao",
  "cov.title": "Saklaw",
  "cov.high": "Maraming phone",
  "cov.limited": "Kaunting phone",
  "cov.stale": "Tahimik mula {time}",
  "cov.none": "Walang ulat",
  "cov.unnamed": "Walang pangalang lugar",

  "inc.back": "Talaan",
  "inc.rank": "ika-{ordinal} sa {n} bukas",
  "inc.status.open": "Bukas · hindi pa natatanggap",
  "inc.status.acked": "Bukas · natanggap",
  "inc.status.resolved": "Tapos na {time}. Bubuksan muli ng bagong ulat.",
  "inc.phones": "phone",
  "inc.reports": "ulat",
  "inc.phone": "phone",
  "inc.report": "ulat",
  "inc.gone": "Nagbago ang insidenteng ito. Buksan ulit ang talaan.",
  "fact.lastHeard": "Huling ulat",
  "fact.firstHeard": "Unang ulat",
  "fact.freshness": "Kasariwaan",
  "fact.people": "Tao",
  "fact.people.value": "Hanggang {n}",
  "fact.people.none": "Hindi naiulat",
  "fact.spread": "Lawak",
  "fact.spread.value": "Sakop ng {m} m",
  "why.title": "Bakit ika-{ordinal}?",
  "why.total": "Kabuuan",
  "why.more": "{n} pang phone",
  "why.more.one": "1 pang phone",
  "why.noMore": "Walang ibang phone",
  "why.noPeople": "Walang bilang ng tao",
  "why.unacked": "Hindi pa natatanggap",
  "why.acked": "Natanggap",
  "why.age": "Tanda ng huling ulat",
  "gap.nearby": "May ulat sa malapit",
  "gap.unheard": "Wala pang ulat tungkol sa",
  "log.title": "Talaan ng pangyayari",
  "log.reported": "Nag-ulat si {src}",
  "log.reportedAgain": "Nag-ulat ulit si {src}",
  "log.acked": "Tinanggap dito",
  "log.resolved": "Tinapos dito",
  "log.ackedBy": "Tinanggap ni {src}",
  "log.resolvedBy": "Tinapos ni {src}",
  "action.ack": "Tanggapin",
  "action.resolve": "Tapusin",
  "undo.resolved": "Tapos na.",

  "station.title": "Istasyon",
  "station.held": "ulat na hawak",
  "station.storage": "{n} sa {max}",
  "station.lastUpload": "Huling upload",
  "station.never": "Wala pa",
  "station.connection": "Koneksyon",
  "station.name": "Pangalan ng istasyon",
  "station.upload": "I-upload ngayon",
  "station.needsNet": "Kailangan ng internet.",
  "station.notConnected": "Wala pang konektadong database ng responder.",
  "station.uploaded": "Na-upload {n}",
  "station.uploadFailed": "Hindi na-upload. Nasa phone pa rin.",
  "station.retry": "Subukan ulit",
  "station.expected": "Inaasahang lugar",
  "station.expected.hint": "Mga lugar na inaasahang may ulat. Walang ulat ang lalabas kapag tahimik.",
  "station.expected.ph": "hal. Purok 5",
  "station.expected.add": "Idagdag",
  "station.expected.remove": "Alisin ang {area}",
  "station.expected.full": "Puno na ang listahan.",
  "station.leave": "Umalis sa station mode",
  "tab.ledger": "Talaan",
  "tab.station": "Istasyon",

  "near.title": "Mga phone sa malapit",
  "near.inRange": "{n} phone sa malapit",
  "near.inRange.one": "1 phone sa malapit",
  "near.none": "Wala pang phone sa malapit.",
  "near.range": "Kung sino ang abot, hindi kung gaano kalayo.",
  "near.webOnly": "Kailangan ng PASAbi app para sa Bluetooth. Gamitin ang QR sa itaas.",
  "near.off": "Naka-off ang Bluetooth para sa PASAbi.",
  "near.turnOn": "Buksan ang Bluetooth",
  "near.ping": "Ipasa sa malapit",
  "near.pinging": "Ipinapasa",
  "near.done": "Naipasa sa {n} phone",
  "near.done.one": "Naipasa sa 1 phone",
  "near.failed": "Hindi sila maabot. Subukan ulit.",
  "near.me": "Itong phone",
  "near.webOnlyRecv": "Kailangan ng PASAbi app para sa Bluetooth. I-scan ang QR nila sa ibaba.",
  "near.waiting": "Naghihintay ng ping mula sa malapit.",
  "near.gotFrom": "Natanggap {n} sa Bluetooth · {m} bago · {time}",
  "start.title": "Bago magsimula",
  "start.body": "Mas gagana ang PASAbi kapag naka-on ang mga ito. Walang internet.",
  "start.bt": "Bluetooth",
  "start.loc": "Lokasyon",
  "start.btWhy": "Para maipasa ang ulat sa mga phone sa malapit.",
  "start.locWhy": "Para malaman kung saan galing ang ulat.",
  "start.on": "Naka-on",
  "start.btOff": "Naka-off. Buksan sa Control Center.",
  "start.btDenied": "Hindi pinayagan. Buksan sa Settings.",
  "start.locDenied": "Hindi pinayagan. Puwede pa ring pangalanan ang purok.",
  "start.locNone": "Wala sa phone na ito. Pangalanan na lang ang purok.",
  "start.webBt": "Kailangan ng PASAbi app. Gumagana rito ang QR.",
  "start.allow": "Payagan",
  "start.later": "Mamaya na",
  "start.continue": "Magpatuloy",
  "bt.hint": "Kung naka-off ang Bluetooth, buksan ito sa Settings.",

  "resp.since": "Mula huling sync",
  "resp.nothing": "Walang bago mula huling sync.",
  "resp.new": "{n} bago",
  "resp.more": "{n} dagdag na phone",
  "resp.up": "{n} umakyat",
  "resp.resolved": "{n} tapos na",
  "resp.all": "Lahat",
  "resp.refresh": "I-refresh",
  "resp.loading": "Kinukuha ang mga na-upload",
  "resp.error": "Hindi maabot ang database ng responder.",
  "resp.empty": "Wala pang na-upload.",
};

/**
 * Fixed caveats (BR-013, BR-014, BR-017). Screens use these and never
 * paraphrase them. At most once per screen, in the SCREENS.md position.
 */
export const CAVEATS: Record<Lang, { noReport: string; coverage: string; why: string; counts: string }> = {
  en: {
    noReport: "No report doesn't mean none.",
    coverage: "Last 3 hours. No report doesn't mean none.",
    why: "Sorted by fixed rules. Not a danger rating.",
    counts: "Counts phones, not people.",
  },
  fil: {
    noReport: "Walang ulat, hindi ibig sabihing wala.",
    coverage: "Huling 3 oras. Walang ulat, hindi ibig sabihing wala.",
    why: "Inayos ayon sa takdang patakaran. Hindi sukat ng panganib.",
    counts: "Bilang ng phone, hindi ng tao.",
  },
};

const tables: Record<Lang, Record<CopyKey, string>> = { en, fil };

/** translate("pass.batch", "en", { i: 1, n: 2, count: 60 }) → "Batch 1 of 2 · 60 reports" */
export function translate(key: CopyKey, lang: Lang, vars?: Record<string, string | number>): string {
  let s = tables[lang][key] ?? en[key];
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}
