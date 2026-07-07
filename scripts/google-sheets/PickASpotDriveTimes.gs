/**
 * Pick A Spot — Google Sheets drive-time calculator
 *
 * Full setup (import example CSV, install this script, connect the app):
 *   scripts/google-sheets/SETUP.md in the Pick A Spot GitHub repo
 *
 * Quick start:
 * 1. Open your restaurant spreadsheet → Extensions → Apps Script
 * 2. Paste this file (replace default Code.gs contents)
 * 3. Run setupConfigSheet once (or create Config sheet manually)
 * 4. Enter your home address in Config!B1
 * 5. Reload the spreadsheet — menu Pick A Spot → Update all drive times
 *
 * Address lookup:
 *   Pick A Spot → Look up missing addresses (fills empty address cells from name + location)
 *
 * Required columns on the Restaurants sheet (row 1 headers):
 *   address, driveTimeMin, distance
 * Also recommended: name, location
 *
 * Distance labels:
 *   In-town       — within Norman, OK city limits
 *   Short Drive   — under 35 minutes
 *   Longer Drive  — 35–65 minutes
 *   Destination   — over 65 minutes
 */

var DRIVE_SHORT_MAX = 35;
var DRIVE_LONGER_MAX = 65;
var RESTAURANTS_SHEET = 'Restaurants';
var CONFIG_SHEET = 'Config';
var HOME_CELL = 'B1';
var SECRET_CELL = 'B2';

var NORMAN_BBOX = {
  south: 35.18,
  north: 35.29,
  west: -97.52,
  east: -97.37
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Pick A Spot')
    .addItem('Look up missing addresses', 'lookupAllAddresses')
    .addItem('Look up addresses (selected rows)', 'lookupSelectedAddresses')
    .addSeparator()
    .addItem('Update all drive times', 'updateAllDriveTimes')
    .addItem('Update selected rows', 'updateSelectedDriveTimes')
    .addSeparator()
    .addItem('Set up Config sheet', 'setupConfigSheet')
    .addItem('Show write-back setup', 'showWriteBackSetup')
    .addToUi();
}

function setupConfigSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var config = ss.getSheetByName(CONFIG_SHEET);
  if (!config) {
    config = ss.insertSheet(CONFIG_SHEET);
  }
  config.getRange('A1').setValue('Home address');
  config.getRange('B1').setValue('123 Main St, Norman, OK 73069');
  config.getRange('A2').setValue('App write secret');
  config.getRange('B2').setValue(Utilities.getUuid());
  config.getRange('A3').setValue('Drive time bins');
  config.getRange('A4').setValue('In-town');
  config.getRange('B4').setValue('Within Norman city limits');
  config.getRange('A5').setValue('Short Drive');
  config.getRange('B5').setValue('Under ' + DRIVE_SHORT_MAX + ' min');
  config.getRange('A6').setValue('Longer Drive');
  config.getRange('B6').setValue(DRIVE_SHORT_MAX + '–' + DRIVE_LONGER_MAX + ' min');
  config.getRange('A7').setValue('Destination');
  config.getRange('B7').setValue('Over ' + DRIVE_LONGER_MAX + ' min');
  config.setColumnWidth(1, 140);
  config.setColumnWidth(2, 320);
  SpreadsheetApp.getUi().alert(
    'Config sheet ready.\n\n' +
    '1. Edit Config!' + HOME_CELL + ' with your home address\n' +
    '2. Copy Config!' + SECRET_CELL + ' into Pick A Spot → Settings → Save to Google Sheet\n' +
    '3. In Apps Script: Deploy → New deployment → Web app (see Pick A Spot → Show write-back setup)'
  );
}

function getSecret_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var config = ss.getSheetByName(CONFIG_SHEET);
  if (!config) return '';
  return String(config.getRange(SECRET_CELL).getValue() || '').trim();
}

function showWriteBackSetup() {
  SpreadsheetApp.getUi().alert(
    'Save Pick A Spot changes back to this Google Sheet:\n\n' +
    'In Google Sheets & Apps Script:\n' +
    '1. Run Pick A Spot → Set up Config sheet (creates secret in Config!' + SECRET_CELL + ')\n' +
    '2. Extensions → Apps Script → Deploy → New deployment → Type: Web app\n' +
    '   Execute as: Me\n' +
    '   Who has access: Anyone\n' +
    '3. Copy the Apps Script Web app URL (not your sheet link)\n\n' +
    'In Pick A Spot:\n' +
    '4. Settings → Save to Google Sheet\n' +
    '5. Paste the Web app URL and Config!' + SECRET_CELL + ' secret → Save Google Sheet connection\n\n' +
    'New restaurants and visit logs will save to this sheet automatically.'
  );
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var secret = getSecret_();
    if (!secret || payload.secret !== secret) {
      return jsonResponse_({ error: 'Unauthorized' });
    }
    if (payload.action === 'upsert') {
      upsertRestaurant_(payload.restaurant);
      return jsonResponse_({ ok: true });
    }
    if (payload.action === 'upsertBatch') {
      var list = payload.restaurants || [];
      for (var i = 0; i < list.length; i++) {
        upsertRestaurant_(list[i]);
      }
      return jsonResponse_({ ok: true, count: list.length });
    }
    if (payload.action === 'delete') {
      deleteRestaurantById_(payload.id);
      return jsonResponse_({ ok: true });
    }
    return jsonResponse_({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ error: String(err) });
  }
}

function fieldForHeader_(header, r) {
  var key = String(header || '').trim();
  var ratings = r.ratings || {};
  if (key === 'id') return r.id || '';
  if (key === 'name') return r.name || '';
  if (key === 'location') return r.location || '';
  if (key === 'tier') return r.tier || '';
  if (key === 'tags') return (r.tags || []).join('; ');
  if (key === 'reasons' || key === 'reason') return (r.reasons || []).join('; ');
  if (key === 'address') return r.address || '';
  if (key === 'distance') return r.distance || '';
  if (key === 'driveTimeMin') return r.driveTimeMin !== '' && r.driveTimeMin != null ? r.driveTimeMin : '';
  if (key === 'dateSaved') return r.dateSaved || '';
  if (key === 'lastVisited') return r.lastVisited || '';
  if (key === 'food') return ratings.food != null ? ratings.food : '';
  if (key === 'vibe') return ratings.vibe != null ? ratings.vibe : '';
  if (key === 'service') return ratings.service != null ? ratings.service : '';
  if (key === 'parking') return ratings.parking || '';
  if (key === 'cost') return ratings.cost || '';
  if (key === 'notes') return r.notes || '';
  return '';
}

function findRestaurantRow_(sheet, cols, r) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  if (cols.id && r.id) {
    for (var row = 2; row <= lastRow; row++) {
      if (String(sheet.getRange(row, cols.id).getValue()).trim() === String(r.id).trim()) {
        return row;
      }
    }
  }

  if (cols.name && r.name) {
    var target = String(r.name).trim().toLowerCase();
    for (var row2 = 2; row2 <= lastRow; row2++) {
      if (String(sheet.getRange(row2, cols.name).getValue()).trim().toLowerCase() === target) {
        return row2;
      }
    }
  }

  return null;
}

function upsertRestaurant_(r) {
  if (!r || !r.name) throw new Error('Restaurant name is required');

  var sheet = getRestaurantsSheet_();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = headerMap_(sheet);
  var values = headers.map(function(h) { return fieldForHeader_(h, r); });
  var targetRow = findRestaurantRow_(sheet, cols, r);

  if (targetRow) {
    sheet.getRange(targetRow, 1, 1, values.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
}

function deleteRestaurantById_(id) {
  if (!id) return;
  var sheet = getRestaurantsSheet_();
  var cols = headerMap_(sheet);
  if (!cols.id) return;

  var lastRow = sheet.getLastRow();
  for (var row = lastRow; row >= 2; row--) {
    if (String(sheet.getRange(row, cols.id).getValue()).trim() === String(id).trim()) {
      sheet.deleteRow(row);
      return;
    }
  }
}

function getHomeAddress_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var config = ss.getSheetByName(CONFIG_SHEET);
  if (!config) {
    throw new Error('Missing Config sheet. Run Pick A Spot → Set up Config sheet first.');
  }
  var home = String(config.getRange(HOME_CELL).getValue() || '').trim();
  if (!home) {
    throw new Error('Set your home address in Config!' + HOME_CELL);
  }
  return home;
}

function getRestaurantsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(RESTAURANTS_SHEET) || ss.getActiveSheet();
  return sheet;
}

function headerMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || '').trim();
    if (key) map[key] = i + 1;
  }
  return map;
}

function isInNorman_(lat, lng) {
  return lat >= NORMAN_BBOX.south && lat <= NORMAN_BBOX.north &&
         lng >= NORMAN_BBOX.west && lng <= NORMAN_BBOX.east;
}

function geocode_(query) {
  var geocoder = Maps.newGeocoder();
  var response = geocoder.geocode(query);
  if (!response || !response.results || response.results.length === 0) {
    return null;
  }
  var result = response.results[0];
  var loc = result.geometry.location;
  var city = '';
  var components = result.address_components || [];
  for (var i = 0; i < components.length; i++) {
    var types = components[i].types || [];
    if (types.indexOf('locality') !== -1) {
      city = String(components[i].long_name || '').toLowerCase();
      break;
    }
  }
  return { lat: loc.lat, lng: loc.lng, city: city };
}

function searchQuery_(name, location) {
  var n = String(name || '').trim();
  var loc = String(location || '').trim();
  if (n && loc) return n + ', ' + loc + ', Oklahoma';
  if (n) return n + ', Oklahoma';
  return '';
}

function lookupFormattedAddress_(name, location) {
  var query = searchQuery_(name, location);
  if (!query) return null;

  var geocoder = Maps.newGeocoder();
  var response = geocoder.geocode(query);
  if (!response || !response.results || response.results.length === 0) {
    return null;
  }
  return response.results[0].formatted_address || null;
}

function lookupAddressRows_(sheet, rowNumbers, overwrite) {
  var cols = headerMap_(sheet);
  if (!cols.address) {
    throw new Error('Sheet needs an address column in row 1.');
  }
  if (!cols.name) {
    throw new Error('Sheet needs a name column in row 1.');
  }

  var updated = 0;
  var skipped = 0;
  var notFound = 0;

  for (var i = 0; i < rowNumbers.length; i++) {
    var rowNum = rowNumbers[i];
    var row = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
    var existing = cols.address ? String(row[cols.address - 1] || '').trim() : '';
    if (existing && !overwrite) {
      skipped++;
      continue;
    }

    var name = cols.name ? String(row[cols.name - 1] || '').trim() : '';
    var location = cols.location ? String(row[cols.location - 1] || '').trim() : '';
    if (!name) {
      skipped++;
      continue;
    }

    var address = lookupFormattedAddress_(name, location);
    Utilities.sleep(300);

    if (!address) {
      notFound++;
      continue;
    }

    sheet.getRange(rowNum, cols.address).setValue(address);
    updated++;
  }

  return { updated: updated, skipped: skipped, notFound: notFound };
}

function lookupAllAddresses() {
  var sheet = getRestaurantsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No restaurant rows found.');
    return;
  }

  var rows = [];
  for (var r = 2; r <= lastRow; r++) {
    rows.push(r);
  }

  var result = lookupAddressRows_(sheet, rows, false);
  SpreadsheetApp.getUi().alert(
    'Address lookup complete.\n\nFilled: ' + result.updated +
    '\nSkipped (already had address): ' + result.skipped +
    '\nNot found: ' + result.notFound
  );
}

function lookupSelectedAddresses() {
  var sheet = getRestaurantsSheet_();
  var range = sheet.getActiveRange();
  if (!range) {
    SpreadsheetApp.getUi().alert('Select one or more restaurant rows first.');
    return;
  }

  var rowNumbers = [];
  for (var r = range.getRow(); r <= range.getLastRow(); r++) {
    if (r > 1) rowNumbers.push(r);
  }
  if (rowNumbers.length === 0) {
    SpreadsheetApp.getUi().alert('Select data rows below the header.');
    return;
  }

  var result = lookupAddressRows_(sheet, rowNumbers, false);
  SpreadsheetApp.getUi().alert(
    'Address lookup complete.\n\nFilled: ' + result.updated +
    '\nSkipped (already had address): ' + result.skipped +
    '\nNot found: ' + result.notFound
  );
}

function getDriveMinutes_(origin, destination) {
  var directions = Maps.newDirectionFinder()
    .setOrigin(origin)
    .setDestination(destination)
    .setMode(Maps.DirectionFinder.Mode.DRIVING)
    .getDirections();

  if (!directions || !directions.routes || directions.routes.length === 0) {
    return null;
  }
  var leg = directions.routes[0].legs[0];
  var seconds = typeof leg.duration === 'object' ? leg.duration.value : leg.duration;
  return Math.round(seconds / 60);
}

function assignLabel_(minutes, geo, location) {
  if (geo && (isInNorman_(geo.lat, geo.lng) || geo.city === 'norman')) {
    return 'In-town';
  }
  if (location === 'Norman') {
    return 'In-town';
  }
  if (minutes == null || isNaN(minutes)) {
    return '';
  }
  if (minutes < DRIVE_SHORT_MAX) return 'Short Drive';
  if (minutes <= DRIVE_LONGER_MAX) return 'Longer Drive';
  return 'Destination';
}

function restaurantQuery_(row, cols) {
  var address = cols.address ? String(row[cols.address - 1] || '').trim() : '';
  if (address) return address;
  var name = cols.name ? String(row[cols.name - 1] || '').trim() : '';
  var location = cols.location ? String(row[cols.location - 1] || '').trim() : '';
  if (name && location) return name + ', ' + location + ', Oklahoma';
  if (name) return name + ', Oklahoma';
  return '';
}

function updateRows_(sheet, rowNumbers) {
  var home = getHomeAddress_();
  var cols = headerMap_(sheet);
  if (!cols.address && !cols.name) {
    throw new Error('Sheet needs at least an address or name column.');
  }
  if (!cols.driveTimeMin || !cols.distance) {
    throw new Error('Sheet needs driveTimeMin and distance columns in row 1.');
  }

  var updated = 0;
  var skipped = 0;

  for (var i = 0; i < rowNumbers.length; i++) {
    var rowNum = rowNumbers[i];
    var row = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
    var query = restaurantQuery_(row, cols);
    if (!query) {
      skipped++;
      continue;
    }

    var location = cols.location ? String(row[cols.location - 1] || '').trim() : '';
    var geo = geocode_(query);
    Utilities.sleep(300);

    var minutes = null;
    var label = '';

    if (geo && (isInNorman_(geo.lat, geo.lng) || geo.city === 'norman' || location === 'Norman')) {
      label = 'In-town';
      minutes = '';
    } else if (geo) {
      minutes = getDriveMinutes_(home, query);
      Utilities.sleep(300);
      label = assignLabel_(minutes, geo, location);
    } else {
      skipped++;
      continue;
    }

    sheet.getRange(rowNum, cols.driveTimeMin).setValue(minutes === '' ? '' : minutes);
    sheet.getRange(rowNum, cols.distance).setValue(label);
    updated++;
  }

  return { updated: updated, skipped: skipped };
}

function updateAllDriveTimes() {
  var sheet = getRestaurantsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No restaurant rows found.');
    return;
  }

  var rows = [];
  for (var r = 2; r <= lastRow; r++) {
    rows.push(r);
  }

  var result = updateRows_(sheet, rows);
  SpreadsheetApp.getUi().alert(
    'Drive times updated.\n\nUpdated: ' + result.updated + '\nSkipped: ' + result.skipped
  );
}

function updateSelectedDriveTimes() {
  var sheet = getRestaurantsSheet_();
  var range = sheet.getActiveRange();
  if (!range) {
    SpreadsheetApp.getUi().alert('Select one or more restaurant rows first.');
    return;
  }

  var rowNumbers = [];
  for (var r = range.getRow(); r <= range.getLastRow(); r++) {
    if (r > 1) rowNumbers.push(r);
  }
  if (rowNumbers.length === 0) {
    SpreadsheetApp.getUi().alert('Select data rows below the header.');
    return;
  }

  var result = updateRows_(sheet, rowNumbers);
  SpreadsheetApp.getUi().alert(
    'Selected rows updated.\n\nUpdated: ' + result.updated + '\nSkipped: ' + result.skipped
  );
}
