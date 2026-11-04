/**
 * GOOGLE APPS SCRIPT - API BACKENDLESS PARA CONTROL DE INGRESOS
 * 
 * Este script se aloja directamente en el contenedor del Google Spreadsheet privado del propietario.
 * Se publica como "Web App" (Ejecutar como: Yo / Acceso: Cualquiera con el link).
 * La seguridad se valida mediante el token de autenticación (Script Properties: AUTH_TOKEN).
 */

const SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();

// Nombres canónicos de las pestañas
const SHEETS = {
  CLIENTS: 'Clientes',
  CATEGORIES: 'Categorias',
  ACTIVITIES: 'Actividades',
  PAYMENTS: 'Pagos',
  CONFIG: 'Configuracion',
};

/**
 * Manejador principal para peticiones POST desde la SPA
 */
function doPost(e) {
  let lock;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw apiError('INVALID_REQUEST', 'El cuerpo de la petición es obligatorio.');
    }

    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (error) {
      throw apiError('INVALID_REQUEST', 'El cuerpo de la petición debe ser JSON válido.');
    }

    if (!requestData || typeof requestData !== 'object' || Array.isArray(requestData)) {
      throw apiError('INVALID_REQUEST', 'La petición debe ser un objeto JSON.');
    }

    const expectedToken = SCRIPT_PROPERTIES.getProperty('AUTH_TOKEN');
    if (!expectedToken || !requestData.token || requestData.token !== expectedToken) {
      throw apiError('UNAUTHORIZED', 'Token de acceso no válido.');
    }

    if (typeof requestData.action !== 'string' || !requestData.action.trim()) {
      throw apiError('INVALID_REQUEST', 'La acción es obligatoria.');
    }

    const payload = requestData.payload === undefined ? {} : requestData.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw apiError('INVALID_REQUEST', 'El payload debe ser un objeto.');
    }

    validateRequestId(payload.request_id);
    if (['createClient', 'createActivity', 'addPayment'].indexOf(requestData.action) >= 0 && !payload.request_id) {
      throw apiError('INVALID_REQUEST', 'request_id es obligatorio para esta operación.');
    }
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      throw apiError('CONCURRENCY_TIMEOUT', 'El servidor está ocupado. Verifica el resultado antes de reintentar.');
    }

    let result;
    try {
      result = routeAction(requestData.action, payload);
    } catch (routeError) {
      if (routeError && routeError.apiCode) throw routeError;
      throw apiError('SHEETS_FAILURE', 'No fue posible completar la operación en Google Sheets.');
    }
    lock.releaseLock();
    lock = null;
    return jsonResponse(true, result, null);
  } catch (error) {
    if (lock) {
      lock.releaseLock();
    }
    const normalized = normalizeError(error);
    return jsonResponse(false, null, normalized);
  }
}

function apiError(code, message, details) {
  const error = new Error(message);
  error.apiCode = code;
  error.apiDetails = details;
  return error;
}

function normalizeError(error) {
  if (error && error.apiCode) {
    return { code: error.apiCode, message: error.message, details: error.apiDetails };
  }
  const message = error && error.message ? String(error.message) : '';
  if (message.indexOf('Service invoked too many times') >= 0 ||
      message.indexOf('Spreadsheet') >= 0 ||
      message.indexOf('Service error') >= 0) {
    return { code: 'SHEETS_FAILURE', message: 'No fue posible completar la operación en Google Sheets.' };
  }
  return { code: 'INTERNAL_ERROR', message: 'Ocurrió un error interno al procesar la solicitud.' };
}

function validateRequestId(requestId) {
  if (requestId === undefined) return;
  if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(requestId)) {
    throw apiError('INVALID_REQUEST', 'request_id debe tener entre 8 y 100 caracteres alfanuméricos, guion o guion bajo.');
  }
}

function requireObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw apiError('INVALID_REQUEST', 'El payload debe ser un objeto.');
  }
}

function requireString(value, field, required, maxLength) {
  if (value === undefined || value === null || value === '') {
    if (required) throw apiError('VALIDATION_ERROR', 'El campo ' + field + ' es obligatorio.');
    return '';
  }
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw apiError('VALIDATION_ERROR', 'El campo ' + field + ' no es válido.');
  }
  const result = value.trim();
  if (required && !result) throw apiError('VALIDATION_ERROR', 'El campo ' + field + ' es obligatorio.');
  return result;
}

function requireEmail(value, field) {
  const email = requireString(value, field, false, 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw apiError('VALIDATION_ERROR', field + ' debe ser un correo válido.');
  }
  return email;
}

function requireDate(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw apiError('VALIDATION_ERROR', field + ' debe tener formato YYYY-MM-DD.');
  }
  const parts = value.split('-');
  const date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  if (date.toISOString().slice(0, 10) !== value) {
    throw apiError('VALIDATION_ERROR', field + ' no es una fecha válida.');
  }
  return value;
}

function requirePositiveAmount(value, field, allowZero) {
  if (typeof value !== 'number' || !isFinite(value) || Math.floor(value) !== value ||
      (allowZero ? value < 0 : value <= 0)) {
    throw apiError('INVALID_MONETARY_VALUE', field + ' debe ser un monto entero COP válido.');
  }
  return value;
}

function requireId(value, prefix, field) {
  const id = requireString(value, field, true, 100);
  if (id.indexOf(prefix) !== 0) throw apiError('VALIDATION_ERROR', field + ' no tiene un identificador válido.');
  return id;
}

function findRowById(sheet, id) {
  const rows = sheetsReadRows(sheet);
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === id) return { row: i + 1, values: rows[i] };
  }
  return null;
}

function requireEntity(sheet, id, type) {
  const entity = findRowById(sheet, id);
  if (!entity) throw apiError('ENTITY_NOT_FOUND', type + ' no encontrado.');
  return entity;
}

function idempotentRecord(sheet, action, payload) {
  if (!payload.request_id) return null;
  const headers = sheetsReadHeaders(sheet);
  const requestIdIndex = headers.indexOf('request_id');
  const actionIndex = headers.indexOf('request_action');
  const fingerprintIndex = headers.indexOf('request_fingerprint');
  if (requestIdIndex < 0 || actionIndex < 0 || fingerprintIndex < 0) {
    throw apiError('SCHEMA_MIGRATION_REQUIRED', 'La hoja requiere las columnas de idempotencia descritas en la guía de actualización.');
  }
  const fingerprint = requestFingerprint(action, payload);
  const rows = sheetsReadRows(sheet);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][requestIdIndex] !== payload.request_id) continue;
    if (rows[i][actionIndex] !== action || rows[i][fingerprintIndex] !== fingerprint) {
      throw apiError('IDEMPOTENCY_CONFLICT', 'request_id ya fue usado con datos diferentes.');
    }
    return rows[i];
  }
  return null;
}

function requestFingerprint(action, payload) {
  const cleanPayload = {};
  Object.keys(payload).sort().forEach(function (key) {
    if (key !== 'request_id') cleanPayload[key] = payload[key];
  });
  return Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, action + ':' + JSON.stringify(cleanPayload))
  );
}

function appendWithIdempotency(sheet, values, action, payload) {
  const headers = sheetsReadHeaders(sheet);
  while (values.length < headers.length) values.push('');
  values[headers.indexOf('request_id')] = payload.request_id || '';
  values[headers.indexOf('request_action')] = payload.request_id ? action : '';
  values[headers.indexOf('request_fingerprint')] = payload.request_id ? requestFingerprint(action, payload) : '';
  sheetsAppendRow(sheet, values);
}

function getIdempotencyColumns(headers) {
  return headers.concat(['request_id', 'request_action', 'request_fingerprint']);
}

/**
 * Manejador GET básico para diagnóstico o comprobación de disponibilidad
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: {
      status: 'online',
      message: 'API Google Apps Script activa',
      timestamp: new Date().toISOString(),
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Enrutador de acciones
 */
function routeAction(action, payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  switch (action) {
    case 'ping':
      return { message: 'Conexión exitosa con Google Apps Script', version: '1.0.0' };

    case 'getConfig':
      return getConfig(ss);

    case 'updateConfig':
      return updateConfig(ss, payload);

    case 'getClients':
      return getClients(ss);

    case 'createClient':
      return createClient(ss, payload);

    case 'updateClient':
      return updateClient(ss, payload);

    case 'toggleClientStatus':
      return toggleClientStatus(ss, payload.id, payload.is_active);

    case 'getCategories':
      return getCategories(ss);

    case 'createCategory':
      return createCategory(ss, payload);

    case 'updateCategory':
      return updateCategory(ss, payload);

    case 'toggleCategoryStatus':
      return toggleCategoryStatus(ss, payload.id, payload.is_active);

    case 'getActivities':
      return getActivitiesWithCalculatedBalances(ss);

    case 'getPayments':
      return getPayments(ss, payload.activity_id);

    case 'createActivity':
      return createActivity(ss, payload);

    case 'updateActivity':
      return updateActivity(ss, payload);

    case 'cancelActivity':
      return cancelActivity(ss, payload.id);

    case 'addPayment':
      return addPayment(ss, payload);

    case 'deletePayment':
      return deletePayment(ss, payload.id);

    case 'getActivityPdfData':
      return getActivityPdfData(ss, payload.id);

    case 'getSummary':
      return getFinancialSummary(ss, payload.from, payload.to);

    default:
      throw apiError('UNSUPPORTED_ACTION', 'La acción solicitada no está disponible.');
  }
}

// ==========================================
// MÓDULOS DE PERSISTENCIA Y REGLAS DE NEGOCIO
// ==========================================

function getConfig(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.CONFIG, ['key', 'value', 'updated_at']);
  const rows = sheetsReadRows(sheet);
  const allowed = ['owner_name', 'business_name', 'owner_phone', 'owner_email', 'payment_instructions', 'logo_url_or_base64'];
  const config = {
    owner_name: '',
    business_name: '',
    owner_phone: '',
    owner_email: '',
    payment_instructions: '',
    logo_url_or_base64: '',
    updated_at: ''
  };
  for (let i = 1; i < rows.length; i++) {
    if (allowed.indexOf(rows[i][0]) < 0) continue;
    config[rows[i][0]] = String(rows[i][1] || '');
    const updatedAt = String(rows[i][2] || '');
    if (updatedAt > config.updated_at) config.updated_at = updatedAt;
  }
  if (!config.updated_at) delete config.updated_at;
  return config;
}

function updateConfig(ss, payload) {
  requireObject(payload);
  const allowed = ['owner_name', 'business_name', 'owner_phone', 'owner_email', 'payment_instructions', 'logo_url_or_base64'];
  Object.keys(payload).forEach(function (key) {
    if (allowed.indexOf(key) < 0) throw apiError('VALIDATION_ERROR', 'La clave de configuración no está permitida.');
    if (key === 'owner_email') requireEmail(payload[key], key);
    else requireString(payload[key], key, key === 'owner_name', 5000);
  });
  const sheet = getOrCreateSheet(ss, SHEETS.CONFIG, ['key', 'value', 'updated_at']);
  const rows = sheetsReadRows(sheet);
  const now = new Date().toISOString();

  Object.keys(payload).forEach(key => {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheetsWriteRange(sheet, i + 1, 2, [[payload[key], now]]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheetsAppendRow(sheet, [key, payload[key], now]);
    }
  });

  return getConfig(ss);
}

function getClients(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.CLIENTS, [
    'id', 'name', 'phone', 'email', 'notes', 'is_active', 'created_at', 'updated_at'
  ]);
  const rows = sheetsReadRows(sheet);
  const clients = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    clients.push({
      id: String(rows[i][0]),
      name: String(rows[i][1]),
      phone: rows[i][2] ? String(rows[i][2]) : '',
      email: rows[i][3] ? String(rows[i][3]) : '',
      notes: rows[i][4] ? String(rows[i][4]) : '',
      is_active: Boolean(rows[i][5]),
      created_at: String(rows[i][6]),
      updated_at: String(rows[i][7]),
    });
  }
  return clients;
}

function createClient(ss, data) {
  requireObject(data);
  const name = requireString(data.name, 'name', true, 200);
  const phone = requireString(data.phone, 'phone', false, 80);
  const email = requireEmail(data.email, 'email');
  const notes = requireString(data.notes, 'notes', false, 5000);
  const sheet = getOrCreateSheet(ss, SHEETS.CLIENTS, getIdempotencyColumns([
    'id', 'name', 'phone', 'email', 'notes', 'is_active', 'created_at', 'updated_at'
  ]));
  const previous = idempotentRecord(sheet, 'createClient', data);
  if (previous) return clientFromRow(previous);
  const now = new Date().toISOString();
  const id = 'cli_' + Utilities.getUuid();
  appendWithIdempotency(sheet, [
    id,
    name,
    phone,
    email,
    notes,
    true,
    now,
    now
  ], 'createClient', data);
  return { id: id, name: name, phone: phone, email: email, notes: notes, is_active: true, created_at: now, updated_at: now };
}

function clientFromRow(row) {
  return { id: String(row[0]), name: String(row[1]), phone: String(row[2] || ''), email: String(row[3] || ''),
    notes: String(row[4] || ''), is_active: Boolean(row[5]), created_at: String(row[6]), updated_at: String(row[7]) };
}

function updateClient(ss, data) {
  requireObject(data);
  const id = requireId(data.id, 'cli_', 'id');
  const sheet = getOrCreateSheet(ss, SHEETS.CLIENTS, [
    'id', 'name', 'phone', 'email', 'notes', 'is_active', 'created_at', 'updated_at'
  ]);
  const existing = requireEntity(sheet, id, 'Cliente');
  const current = clientFromRow(existing.values);
  const updated = {
    name: data.name === undefined ? current.name : requireString(data.name, 'name', true, 200),
    phone: data.phone === undefined ? current.phone : requireString(data.phone, 'phone', false, 80),
    email: data.email === undefined ? current.email : requireEmail(data.email, 'email'),
    notes: data.notes === undefined ? current.notes : requireString(data.notes, 'notes', false, 5000),
  };
  const now = new Date().toISOString();
  sheetsWriteRange(sheet, existing.row, 2, [[updated.name, updated.phone, updated.email, updated.notes]]);
  sheetsWriteCell(sheet, existing.row, 8, now);
  return { ...current, ...updated, updated_at: now };
}
function getCategories(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.CATEGORIES, ['id', 'name', 'is_active', 'created_at', 'updated_at']);
  const rows = sheetsReadRows(sheet);
  const categories = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    categories.push({
      id: String(rows[i][0]),
      name: String(rows[i][1]),
      is_active: Boolean(rows[i][2]),
      created_at: String(rows[i][3]),
      updated_at: String(rows[i][4]),
    });
  }
  return categories;
}

function createCategory(ss, data) {
  requireObject(data);
  const name = requireString(data.name, 'name', true, 100);
  const sheet = getOrCreateSheet(ss, SHEETS.CATEGORIES, ['id', 'name', 'is_active', 'created_at', 'updated_at']);
  const now = new Date().toISOString();
  const id = 'cat_' + Utilities.getUuid();
  sheetsAppendRow(sheet, [id, name, true, now, now]);
  return { id: id, name: name, is_active: true, created_at: now, updated_at: now };
}

function updateCategory(ss, data) {
  requireObject(data);
  const id = requireId(data.id, 'cat_', 'id');
  const sheet = getOrCreateSheet(ss, SHEETS.CATEGORIES, ['id', 'name', 'is_active', 'created_at', 'updated_at']);
  const existing = requireEntity(sheet, id, 'Categoría');
  const name = data.name === undefined ? String(existing.values[1]) : requireString(data.name, 'name', true, 100);
  const now = new Date().toISOString();
  sheetsWriteCell(sheet, existing.row, 2, name);
  sheetsWriteCell(sheet, existing.row, 5, now);
  return { id: id, name: name, is_active: Boolean(existing.values[2]), created_at: String(existing.values[3]), updated_at: now };
}
/**
 * Devuelve todas las actividades con cálculo autoritativo de abonos recibidos y saldos.
 */
function getActivitiesWithCalculatedBalances(ss, paymentRows) {
  const actSheet = getOrCreateSheet(ss, SHEETS.ACTIVITIES, [
    'id', 'client_id', 'type', 'category_id', 'title', 'description',
    'activity_date', 'total_value', 'status', 'internal_notes', 'public_notes',
    'created_at', 'updated_at'
  ]);
  const paySheet = getOrCreateSheet(ss, SHEETS.PAYMENTS, [
    'id', 'activity_id', 'payment_date', 'amount', 'payment_method', 'notes', 'created_at'
  ]);

  const actRows = sheetsReadRows(actSheet);
  const payRows = paymentRows || sheetsReadRows(paySheet);

  // Mapear pagos acumulados por id de actividad
  const paymentsByAct = {};
  for (let j = 1; j < payRows.length; j++) {
    const actId = String(payRows[j][1]);
    const amount = parseInt(payRows[j][3], 10) || 0;
    if (!paymentsByAct[actId]) {
      paymentsByAct[actId] = { totalReceived: 0, items: [] };
    }
    paymentsByAct[actId].totalReceived += amount;
    paymentsByAct[actId].items.push({
      id: String(payRows[j][0]),
      activity_id: actId,
      payment_date: String(payRows[j][2]),
      amount: amount,
      payment_method: String(payRows[j][4]),
      notes: payRows[j][5] ? String(payRows[j][5]) : '',
      created_at: String(payRows[j][6]),
    });
  }

  const activities = [];
  for (let i = 1; i < actRows.length; i++) {
    if (!actRows[i][0]) continue;
    const id = String(actRows[i][0]);
    const totalValue = parseInt(actRows[i][7], 10) || 0;
    const status = String(actRows[i][8]); // 'pending' | 'in_progress' | 'completed' | 'cancelled'
    const totalReceived = paymentsByAct[id] ? paymentsByAct[id].totalReceived : 0;

    let balancePending = 0;
    let paymentStatus = 'pending';

    if (status === 'cancelled') {
      // Regla de negocio: Actividad cancelada no genera saldo pendiente a cobrar
      balancePending = 0;
      paymentStatus = totalReceived > 0 ? 'partial' : 'pending';
    } else {
      balancePending = Math.max(0, totalValue - totalReceived);
      if (totalReceived >= totalValue) {
        paymentStatus = 'paid';
      } else if (totalReceived > 0) {
        paymentStatus = 'partial';
      } else {
        paymentStatus = 'pending';
      }
    }

    activities.push({
      id: id,
      client_id: String(actRows[i][1]),
      type: String(actRows[i][2]),
      category_id: String(actRows[i][3]),
      title: String(actRows[i][4]),
      description: String(actRows[i][5]),
      activity_date: String(actRows[i][6]),
      total_value: totalValue,
      status: status,
      internal_notes: actRows[i][9] ? String(actRows[i][9]) : '',
      public_notes: actRows[i][10] ? String(actRows[i][10]) : '',
      created_at: String(actRows[i][11]),
      updated_at: String(actRows[i][12]),
      total_received: totalReceived,
      balance_pending: balancePending,
      payment_status: paymentStatus,
    });
  }

  return activities;
}

function createActivity(ss, data) {
  requireObject(data);
  const clientId = requireId(data.client_id, 'cli_', 'client_id');
  const categoryId = requireId(data.category_id, 'cat_', 'category_id');
  const type = data.type;
  if (type !== 'service' && type !== 'sale') throw apiError('VALIDATION_ERROR', 'type debe ser service o sale.');
  const title = requireString(data.title, 'title', true, 200);
  const description = requireString(data.description, 'description', false, 10000);
  const activityDate = requireDate(data.activity_date, 'activity_date');
  const totalValue = requirePositiveAmount(data.total_value, 'total_value', true);
  const status = data.status === undefined ? 'pending' : data.status;
  if (['pending', 'in_progress', 'completed', 'cancelled'].indexOf(status) < 0) {
    throw apiError('VALIDATION_ERROR', 'status no es válido.');
  }
  const sheet = getOrCreateSheet(ss, SHEETS.ACTIVITIES, getIdempotencyColumns([
    'id', 'client_id', 'type', 'category_id', 'title', 'description',
    'activity_date', 'total_value', 'status', 'internal_notes', 'public_notes',
    'created_at', 'updated_at'
  ]));
  const previous = idempotentRecord(sheet, 'createActivity', data);
  if (previous) {
    const existing = getActivitiesWithCalculatedBalances(ss).find(function (activity) { return activity.id === previous[0]; });
    if (!existing) throw apiError('SHEETS_FAILURE', 'No fue posible recuperar la actividad creada.');
    return existing;
  }
  const clientSheet = getOrCreateSheet(ss, SHEETS.CLIENTS, [
    'id', 'name', 'phone', 'email', 'notes', 'is_active', 'created_at', 'updated_at'
  ]);
  if (!Boolean(requireEntity(clientSheet, clientId, 'Cliente').values[5])) {
    throw apiError('VALIDATION_ERROR', 'No se pueden registrar actividades para un cliente inactivo.');
  }
  const categorySheet = getOrCreateSheet(ss, SHEETS.CATEGORIES, ['id', 'name', 'is_active', 'created_at', 'updated_at']);
  if (!Boolean(requireEntity(categorySheet, categoryId, 'Categoría').values[2])) {
    throw apiError('VALIDATION_ERROR', 'No se pueden registrar actividades con una categoría inactiva.');
  }
  const now = new Date().toISOString();
  const id = 'act_' + Utilities.getUuid();
  appendWithIdempotency(sheet, [
    id,
    clientId,
    type,
    categoryId,
    title,
    description,
    activityDate,
    totalValue,
    status,
    requireString(data.internal_notes, 'internal_notes', false, 5000),
    requireString(data.public_notes, 'public_notes', false, 5000),
    now,
    now
  ], 'createActivity', data);

  return {
    id,
    client_id: clientId,
    type: type,
    category_id: categoryId,
    title: title,
    description: description,
    activity_date: activityDate,
    total_value: totalValue,
    status: status,
    internal_notes: requireString(data.internal_notes, 'internal_notes', false, 5000),
    public_notes: requireString(data.public_notes, 'public_notes', false, 5000),
    total_received: 0,
    balance_pending: status === 'cancelled' ? 0 : totalValue,
    payment_status: status !== 'cancelled' && totalValue === 0 ? 'paid' : 'pending',
    created_at: now,
    updated_at: now
  };
}

function updateActivity(ss, data) {
  requireObject(data);
  const id = requireId(data.id, 'act_', 'id');
  const activitySheet = getOrCreateSheet(ss, SHEETS.ACTIVITIES, [
    'id', 'client_id', 'type', 'category_id', 'title', 'description',
    'activity_date', 'total_value', 'status', 'internal_notes', 'public_notes', 'created_at', 'updated_at'
  ]);
  const existing = requireEntity(activitySheet, id, 'Actividad');
  const current = getActivitiesWithCalculatedBalances(ss).find(function (activity) { return activity.id === id; });
  if (!current) throw apiError('ENTITY_NOT_FOUND', 'Actividad no encontrada.');
  if (data.total_value !== undefined && data.total_value !== current.total_value && current.total_received > 0) {
    throw apiError('PAYMENT_CONFLICT', 'No se puede cambiar el valor total de una actividad con pagos registrados.');
  }
  const updatedValues = existing.values.slice(0, 13);
  const references = [
    { key: 'client_id', column: 1, prefix: 'cli_', sheetName: SHEETS.CLIENTS,
      headers: ['id', 'name', 'phone', 'email', 'notes', 'is_active', 'created_at', 'updated_at'], activeIndex: 5 },
    { key: 'category_id', column: 3, prefix: 'cat_', sheetName: SHEETS.CATEGORIES,
      headers: ['id', 'name', 'is_active', 'created_at', 'updated_at'], activeIndex: 2 }
  ];
  references.forEach(function (reference) {
    if (data[reference.key] === undefined) return;
    const ref = requireId(data[reference.key], reference.prefix, reference.key);
    const refSheet = getOrCreateSheet(ss, reference.sheetName, reference.headers);
    const refRow = requireEntity(refSheet, ref, reference.key);
    if (!Boolean(refRow.values[reference.activeIndex])) {
      throw apiError('VALIDATION_ERROR', 'No se puede asociar una referencia inactiva.');
    }
    updatedValues[reference.column] = ref;
  });
  if (data.type !== undefined) {
    if (data.type !== 'service' && data.type !== 'sale') throw apiError('VALIDATION_ERROR', 'type debe ser service o sale.');
    updatedValues[2] = data.type;
  }
  if (data.title !== undefined) updatedValues[4] = requireString(data.title, 'title', true, 200);
  if (data.description !== undefined) updatedValues[5] = requireString(data.description, 'description', false, 10000);
  if (data.activity_date !== undefined) updatedValues[6] = requireDate(data.activity_date, 'activity_date');
  if (data.total_value !== undefined) updatedValues[7] = requirePositiveAmount(data.total_value, 'total_value', true);
  if (data.status !== undefined) {
    if (['pending', 'in_progress', 'completed', 'cancelled'].indexOf(data.status) < 0) {
      throw apiError('VALIDATION_ERROR', 'status no es válido.');
    }
    updatedValues[8] = data.status;
  }
  if (data.internal_notes !== undefined) updatedValues[9] = requireString(data.internal_notes, 'internal_notes', false, 5000);
  if (data.public_notes !== undefined) updatedValues[10] = requireString(data.public_notes, 'public_notes', false, 5000);
  const now = new Date().toISOString();
  updatedValues[12] = now;
  sheetsWriteRange(activitySheet, existing.row, 1, [updatedValues]);
  return getActivitiesWithCalculatedBalances(ss).find(function (activity) { return activity.id === id; });
}

function addPayment(ss, data) {
  requireObject(data);
  const activityId = requireId(data.activity_id, 'act_', 'activity_id');
  const paymentDate = requireDate(data.payment_date, 'payment_date');
  const amount = requirePositiveAmount(data.amount, 'amount', false);
  const methods = ['transferencia_bancaria', 'nequi', 'daviplata', 'efectivo', 'tarjeta', 'otro'];
  if (methods.indexOf(data.payment_method) < 0) throw apiError('VALIDATION_ERROR', 'payment_method no es válido.');
  const notes = requireString(data.notes, 'notes', false, 5000);
  const paySheet = getOrCreateSheet(ss, SHEETS.PAYMENTS, getIdempotencyColumns([
    'id', 'activity_id', 'payment_date', 'amount', 'payment_method', 'notes', 'created_at'
  ]));
  const previous = idempotentRecord(paySheet, 'addPayment', data);
  if (previous) return paymentFromRow(previous);

  const activities = getActivitiesWithCalculatedBalances(ss);
  const target = activities.find(function (activity) { return activity.id === activityId; });
  if (!target) {
    throw apiError('ENTITY_NOT_FOUND', 'Actividad no encontrada.');
  }
  if (target.status === 'cancelled') {
    throw apiError('CANNOT_PAY_CANCELLED', 'No se pueden registrar abonos en una actividad cancelada.');
  }
  if (amount > target.balance_pending) {
    throw apiError('OVERPAYMENT_NOT_ALLOWED', 'El monto supera el saldo pendiente.');
  }
  const now = new Date().toISOString();
  const id = 'pay_' + Utilities.getUuid();
  appendWithIdempotency(paySheet, [
    id,
    activityId,
    paymentDate,
    amount,
    data.payment_method,
    notes,
    now
  ], 'addPayment', data);
  return { id: id, activity_id: activityId, payment_date: paymentDate, amount: amount,
    payment_method: data.payment_method, notes: notes, created_at: now };
}

function paymentFromRow(row) {
  return { id: String(row[0]), activity_id: String(row[1]), payment_date: String(row[2]), amount: Number(row[3]),
    payment_method: String(row[4]), notes: String(row[5] || ''), created_at: String(row[6]) };
}

function cancelActivity(ss, activityId) {
  return updateActivity(ss, { id: requireId(activityId, 'act_', 'id'), status: 'cancelled' });
}

function getFinancialSummary(ss, fromDate, toDate) {
  if ((fromDate && !toDate) || (!fromDate && toDate)) {
    throw apiError('VALIDATION_ERROR', 'from y to deben enviarse juntos.');
  }
  if (fromDate) {
    fromDate = requireDate(fromDate, 'from');
    toDate = requireDate(toDate, 'to');
    if (fromDate > toDate) throw apiError('VALIDATION_ERROR', 'from no puede ser posterior a to.');
  }
  const paySheet = getOrCreateSheet(ss, SHEETS.PAYMENTS, [
    'id', 'activity_id', 'payment_date', 'amount', 'payment_method', 'notes', 'created_at'
  ]);
  const payRows = sheetsReadRows(paySheet);
  const activities = getActivitiesWithCalculatedBalances(ss, payRows);

  let totalActivitiesValue = 0;
  let totalBalancePending = 0;
  const counts = { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 };

  activities.forEach(act => {
    if (!fromDate || !toDate || (act.activity_date >= fromDate && act.activity_date <= toDate)) {
      counts.total++;
      if (counts[act.status] !== undefined) {
        counts[act.status]++;
      }
      if (act.status !== 'cancelled') {
        totalActivitiesValue += act.total_value;
        totalBalancePending += act.balance_pending || 0;
      }
    }
  });

  // Dinero recibido por fecha de pago
  let totalMoneyReceived = 0;
  for (let i = 1; i < payRows.length; i++) {
    const payDate = String(payRows[i][2]);
    const amount = parseInt(payRows[i][3], 10) || 0;
    if (!fromDate || !toDate || (payDate >= fromDate && payDate <= toDate)) {
      totalMoneyReceived += amount;
    }
  }

  return {
    period_from: fromDate || '',
    period_to: toDate || '',
    total_activities_value: totalActivitiesValue,
    total_money_received: totalMoneyReceived,
    total_balance_pending: totalBalancePending,
    activities_count: counts
  };
}

function getPayments(ss, activityId) {
  const sheet = getOrCreateSheet(ss, SHEETS.PAYMENTS, [
    'id', 'activity_id', 'payment_date', 'amount', 'payment_method', 'notes', 'created_at'
  ]);
  if (activityId !== undefined) activityId = requireId(activityId, 'act_', 'activity_id');
  return paymentsFromRows(sheetsReadRows(sheet), activityId);
}

function paymentsFromRows(rows, activityId) {
  const payments = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0] || (activityId && String(rows[i][1]) !== activityId)) continue;
    payments.push(paymentFromRow(rows[i]));
  }
  return payments;
}

function deletePayment(ss, paymentId) {
  paymentId = requireId(paymentId, 'pay_', 'id');
  const sheet = getOrCreateSheet(ss, SHEETS.PAYMENTS, [
    'id', 'activity_id', 'payment_date', 'amount', 'payment_method', 'notes', 'created_at'
  ]);
  const existing = requireEntity(sheet, paymentId, 'Pago');
  sheetsDeleteRow(sheet, existing.row);
  return { id: paymentId, deleted: true };
}

function getActivityPdfData(ss, activityId) {
  activityId = requireId(activityId, 'act_', 'id');
  const paymentSheet = getOrCreateSheet(ss, SHEETS.PAYMENTS, [
    'id', 'activity_id', 'payment_date', 'amount', 'payment_method', 'notes', 'created_at'
  ]);
  const paymentRows = sheetsReadRows(paymentSheet);
  const activity = getActivitiesWithCalculatedBalances(ss, paymentRows).find(function (item) { return item.id === activityId; });
  if (!activity) throw apiError('ENTITY_NOT_FOUND', 'Actividad no encontrada.');
  const client = getClients(ss).find(function (item) { return item.id === activity.client_id; });
  if (!client) throw apiError('ENTITY_NOT_FOUND', 'Cliente asociado no encontrado.');
  const category = getCategories(ss).find(function (item) { return item.id === activity.category_id; });
  const config = getConfig(ss);
  const payments = paymentsFromRows(paymentRows, activity.id).map(function (payment) {
    return { date: payment.payment_date, amount: payment.amount, method: payment.payment_method, notes: payment.notes };
  });
  return {
    reference_code: activity.id,
    generation_date: Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd'),
    issuer: {
      name: String(config.owner_name || ''),
      business_name: String(config.business_name || ''),
      phone: String(config.owner_phone || ''),
      email: String(config.owner_email || ''),
      payment_instructions: String(config.payment_instructions || ''),
      logo: String(config.logo_url_or_base64 || '')
    },
    client: { name: client.name, phone: client.phone || '', email: client.email || '' },
    activity: {
      id: activity.id,
      type: activity.type,
      category_name: category ? category.name : '',
      title: activity.title,
      description: activity.description,
      date: activity.activity_date,
      total_value: activity.total_value,
      total_received: activity.total_received,
      balance_pending: activity.balance_pending,
      public_notes: activity.public_notes || ''
    },
    payments: payments
  };
}

function toggleClientStatus(ss, id, isActive) {
  id = requireId(id, 'cli_', 'id');
  if (typeof isActive !== 'boolean') throw apiError('VALIDATION_ERROR', 'is_active debe ser booleano.');
  const sheet = getOrCreateSheet(ss, SHEETS.CLIENTS, [
    'id', 'name', 'phone', 'email', 'notes', 'is_active', 'created_at', 'updated_at'
  ]);
  const existing = requireEntity(sheet, id, 'Cliente');
  const now = new Date().toISOString();
  sheetsWriteCell(sheet, existing.row, 6, isActive);
  sheetsWriteCell(sheet, existing.row, 8, now);
  return { id: id, is_active: isActive };
}

function toggleCategoryStatus(ss, id, isActive) {
  id = requireId(id, 'cat_', 'id');
  if (typeof isActive !== 'boolean') throw apiError('VALIDATION_ERROR', 'is_active debe ser booleano.');
  const sheet = getOrCreateSheet(ss, SHEETS.CATEGORIES, ['id', 'name', 'is_active', 'created_at', 'updated_at']);
  const existing = requireEntity(sheet, id, 'Categoría');
  const now = new Date().toISOString();
  sheetsWriteCell(sheet, existing.row, 3, isActive);
  sheetsWriteCell(sheet, existing.row, 5, now);
  return { id: id, is_active: isActive };
}

// ==========================================
// UTILIDADES AUXILIARES
// ==========================================

function sheetsReadRows(sheet) {
  return sheet.getDataRange().getValues();
}

function sheetsReadHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function sheetsAppendRow(sheet, values) {
  sheet.appendRow(values);
}

function sheetsWriteRange(sheet, row, column, values) {
  sheet.getRange(row, column, values.length, values[0].length).setValues(values);
}

function sheetsWriteCell(sheet, row, column, value) {
  sheet.getRange(row, column).setValue(value);
}

function sheetsDeleteRow(sheet, row) {
  sheet.deleteRow(row);
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else {
    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    if (!existingHeaders.some(function (header) { return Boolean(header); })) {
      if (sheet.getLastRow() > 1) {
        throw apiError('SCHEMA_MISMATCH', 'La pestaña ' + name + ' contiene datos pero no tiene cabeceras válidas.');
      }
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      return sheet;
    }
    for (let i = 0; i < Math.min(existingHeaders.length, headers.length); i++) {
      if (existingHeaders[i] !== headers[i]) {
        throw apiError('SCHEMA_MISMATCH', 'La estructura de la pestaña ' + name + ' no coincide con el esquema esperado.');
      }
    }
    const missing = headers.filter(function (header) { return existingHeaders.indexOf(header) < 0; });
    if (missing.length) sheet.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]);
  }
  return sheet;
}

function jsonResponse(success, data, error) {
  const payload = {
    success: success,
    data: data === null ? undefined : data,
    error: error === null ? undefined : error,
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
