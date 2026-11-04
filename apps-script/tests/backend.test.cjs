const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');

class MockRange {
  constructor(sheet, row, column, rowCount, columnCount) {
    Object.assign(this, { sheet, row, column, rowCount, columnCount });
  }

  getValues() {
    return Array.from({ length: this.rowCount }, (_, rowOffset) =>
      Array.from({ length: this.columnCount }, (_, columnOffset) =>
        this.sheet.cell(this.row + rowOffset, this.column + columnOffset)
      )
    );
  }

  setValues(values) {
    values.forEach((row, rowOffset) => row.forEach((value, columnOffset) =>
      this.sheet.setCell(this.row + rowOffset, this.column + columnOffset, value)
    ));
    return this;
  }

  setValue(value) {
    this.sheet.setCell(this.row, this.column, value);
    return this;
  }

  setFontWeight() {
    return this;
  }
}

class MockSheet {
  constructor(name) {
    this.name = name;
    this.rows = [];
  }

  cell(row, column) {
    return this.rows[row - 1]?.[column - 1] ?? '';
  }

  setCell(row, column, value) {
    while (this.rows.length < row) this.rows.push([]);
    while (this.rows[row - 1].length < column) this.rows[row - 1].push('');
    this.rows[row - 1][column - 1] = value;
  }

  getRange(row, column, rowCount = 1, columnCount = 1) {
    return new MockRange(this, row, column, rowCount, columnCount);
  }

  getDataRange() {
    const width = Math.max(1, ...this.rows.map((row) => row.length));
    return this.getRange(1, 1, Math.max(1, this.rows.length), width);
  }

  getLastColumn() {
    return Math.max(1, ...this.rows.map((row) => row.length));
  }

  getLastRow() {
    return this.rows.length;
  }

  appendRow(row) {
    this.rows.push([...row]);
  }

  setFrozenRows() {}

  deleteRow(row) {
    this.rows.splice(row - 1, 1);
  }
}

class MockSpreadsheet {
  constructor() {
    this.sheets = new Map();
    this.failReads = false;
  }

  getSheetByName(name) {
    if (this.failReads) throw new Error('Spreadsheet service unavailable');
    return this.sheets.get(name) || null;
  }

  insertSheet(name) {
    const sheet = new MockSheet(name);
    this.sheets.set(name, sheet);
    return sheet;
  }
}

function createBackend() {
  const spreadsheet = new MockSpreadsheet();
  let locked = false;
  const context = {
    console,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    isFinite,
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (key) => key === 'AUTH_TOKEN' ? 'test-token' : null }),
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          if (locked) return false;
          locked = true;
          return true;
        },
        releaseLock: () => { locked = false; },
      }),
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text) => ({ text, setMimeType() { return this; } }),
    },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeDigest: (_, input) => crypto.createHash('sha256').update(input).digest(),
      base64Encode: (input) => Buffer.from(input).toString('base64'),
      formatDate: (date) => new Date(date.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
  };
  vm.runInNewContext(source, context, { filename: 'Code.gs' });
  return {
    spreadsheet,
    request(action, payload = {}, token = 'test-token') {
      const result = context.doPost({ postData: { contents: JSON.stringify({ token, action, payload }) } });
      return JSON.parse(result.text);
    },
  };
}

function createFixture(backend) {
  const client = backend.request('createClient', { name: 'Cliente de prueba', request_id: 'client_0001' }).data;
  const category = backend.request('createCategory', { name: 'Servicios' }).data;
  const activity = backend.request('createActivity', {
    client_id: client.id,
    category_id: category.id,
    type: 'service',
    title: 'Trabajo de prueba',
    description: 'Descripción',
    activity_date: '2026-11-04',
    total_value: 100000,
    status: 'pending',
    internal_notes: 'Dato privado de prueba',
    public_notes: 'Observación pública',
    request_id: 'activity_0001',
  }).data;
  return { client, category, activity };
}

test('crea y consulta clientes con identificador estable', () => {
  const backend = createBackend();
  const created = backend.request('createClient', { name: 'Ana', request_id: 'client_0002' });
  assert.equal(created.success, true);
  assert.match(created.data.id, /^cli_/);
  assert.equal(backend.request('getClients').data[0].name, 'Ana');
});

test('registra actividad y deriva abono parcial y pago completo', () => {
  const backend = createBackend();
  const { activity } = createFixture(backend);
  const partial = backend.request('addPayment', {
    activity_id: activity.id, payment_date: '2026-11-05', amount: 40000,
    payment_method: 'nequi', request_id: 'payment_0001',
  });
  assert.equal(partial.success, true);
  let saved = backend.request('getActivities').data[0];
  assert.equal(saved.balance_pending, 60000);
  assert.equal(saved.payment_status, 'partial');
  const final = backend.request('addPayment', {
    activity_id: activity.id, payment_date: '2026-11-06', amount: 60000,
    payment_method: 'efectivo', request_id: 'payment_0002',
  });
  assert.equal(final.success, true);
  saved = backend.request('getActivities').data[0];
  assert.equal(saved.balance_pending, 0);
  assert.equal(saved.payment_status, 'paid');
});

test('rechaza montos y referencias no válidos', () => {
  const backend = createBackend();
  const badAmount = backend.request('createActivity', {
    client_id: 'cli_missing', category_id: 'cat_missing', type: 'service',
    title: 'Prueba', activity_date: '2026-11-04', total_value: '200', request_id: 'activity_0002',
  });
  assert.equal(badAmount.error.code, 'INVALID_MONETARY_VALUE');
  const missing = backend.request('addPayment', {
    activity_id: 'act_missing', payment_date: '2026-11-04', amount: 100,
    payment_method: 'nequi', request_id: 'payment_0005',
  });
  assert.equal(missing.error.code, 'ENTITY_NOT_FOUND');
});

test('rechaza sobrepagos y pagos de actividades canceladas, conservando el abono histórico', () => {
  const backend = createBackend();
  const { activity } = createFixture(backend);
  assert.equal(backend.request('addPayment', {
    activity_id: activity.id, payment_date: '2026-11-04', amount: 100001, payment_method: 'nequi', request_id: 'payment_0006',
  }).error.code, 'OVERPAYMENT_NOT_ALLOWED');
  assert.equal(backend.request('addPayment', {
    activity_id: activity.id, payment_date: '2026-11-04', amount: 25000,
    payment_method: 'nequi', request_id: 'payment_0003',
  }).success, true);
  assert.equal(backend.request('cancelActivity', { id: activity.id }).success, true);
  const saved = backend.request('getActivities').data[0];
  assert.equal(saved.balance_pending, 0);
  assert.equal(saved.payment_status, 'partial');
  assert.equal(backend.request('addPayment', {
    activity_id: activity.id, payment_date: '2026-11-05', amount: 1000,
    payment_method: 'nequi', request_id: 'payment_0007',
  }).error.code, 'CANNOT_PAY_CANCELLED');
});

test('desactivar categoría conserva actividades históricas', () => {
  const backend = createBackend();
  const { category, activity } = createFixture(backend);
  assert.equal(backend.request('toggleCategoryStatus', { id: category.id, is_active: false }).success, true);
  assert.equal(backend.request('getActivities').data[0].id, activity.id);
  const newActivity = backend.request('createActivity', {
    client_id: activity.client_id, category_id: category.id, type: 'service', title: 'Otro',
    activity_date: '2026-11-04', total_value: 0, request_id: 'activity_0003',
  });
  assert.equal(newActivity.error.code, 'VALIDATION_ERROR');
});

test('impide modificar el valor acordado después de un abono', () => {
  const backend = createBackend();
  const { activity } = createFixture(backend);
  backend.request('addPayment', {
    activity_id: activity.id, payment_date: '2026-11-04', amount: 1000,
    payment_method: 'nequi', request_id: 'payment_0008',
  });
  const rejected = backend.request('updateActivity', { id: activity.id, total_value: 200000 });
  assert.equal(rejected.error.code, 'PAYMENT_CONFLICT');
  const updated = backend.request('updateActivity', { id: activity.id, title: 'Título editado' });
  assert.equal(updated.data.title, 'Título editado');
  assert.equal(updated.data.total_value, 100000);
});

test('calcula el dinero recibido por fecha de pago y no por fecha de actividad', () => {
  const backend = createBackend();
  const { activity } = createFixture(backend);
  backend.request('addPayment', {
    activity_id: activity.id, payment_date: '2026-12-01', amount: 10000,
    payment_method: 'nequi', request_id: 'payment_0004',
  });
  assert.equal(backend.request('getSummary', { from: '2026-12-01', to: '2026-12-31' }).data.total_money_received, 10000);
  assert.equal(backend.request('getSummary', { from: '2026-11-01', to: '2026-11-30' }).data.total_money_received, 0);
});

test('deduplica reintentos y rechaza el mismo identificador con datos distintos', () => {
  const backend = createBackend();
  const payload = { name: 'Reintento', request_id: 'retry_00001' };
  const first = backend.request('createClient', payload);
  const retried = backend.request('createClient', payload);
  assert.equal(retried.data.id, first.data.id);
  assert.equal(backend.request('getClients').data.length, 1);
  assert.equal(backend.request('createClient', { name: 'Diferente', request_id: payload.request_id }).error.code, 'IDEMPOTENCY_CONFLICT');
});

test('amplía cabeceras legacy sin alterar los registros existentes', () => {
  const backend = createBackend();
  const sheet = backend.spreadsheet.insertSheet('Clientes');
  sheet.appendRow(['id', 'name', 'phone', 'email', 'notes', 'is_active', 'created_at', 'updated_at']);
  sheet.appendRow(['cli_legacy', 'Cliente anterior', '', '', '', true, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']);
  const created = backend.request('createClient', { name: 'Nuevo', request_id: 'client_0003' });
  assert.equal(created.success, true);
  assert.equal(sheet.rows[1][1], 'Cliente anterior');
  assert.equal(backend.request('getClients').data.length, 2);
  assert.deepEqual(sheet.rows[0].slice(8), ['request_id', 'request_action', 'request_fingerprint']);
});

test('requiere claves de idempotencia para operaciones de creación', () => {
  const backend = createBackend();
  assert.equal(backend.request('createClient', { name: 'Sin clave' }).error.code, 'INVALID_REQUEST');
});

test('no expone notas internas en datos para PDF', () => {
  const backend = createBackend();
  const { activity } = createFixture(backend);
  const result = backend.request('getActivityPdfData', { id: activity.id });
  assert.equal(result.success, true);
  assert.equal(JSON.stringify(result.data).includes('Dato privado de prueba'), false);
  assert.equal(result.data.activity.public_notes, 'Observación pública');
});

test('rechaza accesos no autorizados y oculta errores de Sheets', () => {
  const backend = createBackend();
  assert.equal(backend.request('getClients', {}, 'incorrecto').error.code, 'UNAUTHORIZED');
  backend.spreadsheet.failReads = true;
  const failure = backend.request('getClients');
  assert.equal(failure.error.code, 'SHEETS_FAILURE');
  assert.equal(failure.error.message.includes('Spreadsheet service unavailable'), false);
});
