/* ═══════════════════════════════════════════════
   WALLZ — PROJECT APPLICATION FORM → GOOGLE SHEETS
   Paste into the Google Sheet's Extensions → Apps Script editor.
   Each submission from wallz.ae is added as a new row, and an email
   summary is sent to the account that owns this script.

   Not served by the website; kept here for reference only.
   ═══════════════════════════════════════════════ */

var SHEET_NAME = 'Applications';
var TIMEZONE = 'Asia/Dubai';

/* Form field sent by js/main.js → column heading in the sheet */
var FIELDS = [
  ['q1', 'Which statement feels most like you today?'],
  ['q2', 'What would make this project successful?'],
  ['q3', 'Scale of project'],
  ['q4', 'Property type'],
  ['q5', 'Project location'],
  ['q6', 'Area (Dubai)'],
  ['q7', 'How Wallz should be involved'],
  ['q8', 'First renovation?'],
  ['q9', 'Where in the journey'],
  ['q10', 'What matters most'],
  ['q11', 'Estimated investment'],
  ['q12', 'The home they want to create'],
  ['name', 'Name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['contact', 'Preferred contact'],
  ['source', 'Heard about Wallz from']
];

/* Run once from the editor: creates the sheet and headings, and asks for permissions */
function setup() {
  var sheet = getSheet_();
  Logger.log('Ready: ' + sheet.getParent().getUrl());
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var p = (e && e.parameter) || {};
    var sheet = getSheet_();
    var submitted = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm');

    var row = [submitted].concat(FIELDS.map(function (f) {
      return clean_(p[f[0]]);
    }));
    sheet.appendRow(row);

    notify_(p, submitted);

    return json_({ result: 'success' });
  } catch (err) {
    return json_({ result: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* Lets you open the web app URL in a browser to confirm it's deployed */
function doGet() {
  return json_({ result: 'ok', message: 'Wallz form endpoint is running' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    var headers = ['Submitted'].concat(FIELDS.map(function (f) { return f[1]; }));
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function notify_(p, submitted) {
  var to = Session.getEffectiveUser().getEmail();
  var name = text_(p.name) || 'Someone';

  var body = FIELDS.map(function (f) {
    return f[1] + ':\n' + (text_(p[f[0]]) || '—');
  }).join('\n\n');

  var options = {};
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text_(p.email))) options.replyTo = text_(p.email);

  MailApp.sendEmail(to, 'New Wallz project application — ' + name,
    'Submitted ' + submitted + ' (Dubai time)\n\n' + body, options);
}

function text_(v) {
  return String(v == null ? '' : v).trim();
}

/* For the sheet only: stops a value starting with = + - @ (e.g. "+971…")
   from being read as a formula. The apostrophe is hidden in the cell. */
function clean_(v) {
  v = text_(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
