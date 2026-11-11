import test from 'node:test';
import assert from 'node:assert/strict';

import { mockAdapter } from '../src/services/mock-adapter.ts';
import { buildActivityPdf } from '../src/features/pdf/generatePdf.ts';
import { sheetsApi } from '../src/services/sheets-api.ts';
import { api } from '../src/services/api.ts';
import { normalizeDate, formatDateEs, formatDateLongEs } from '../src/theme/format.ts';
import { routeFromHash, parseHash } from '../src/router.ts';

test('1. Flujo de Clientes: creación, consulta y desactivación lógica', async () => {
  mockAdapter.resetData();

  // Crear cliente
  const newClient = await mockAdapter.createClient({
    name: 'Consultoría Integral SAS',
    phone: '+57 320 890 1234',
    email: 'contacto@consultoria.co',
    notes: 'Cliente preferencial',
  });

  assert.ok(newClient.id.startsWith('cli_'));
  assert.equal(newClient.name, 'Consultoría Integral SAS');
  assert.equal(newClient.is_active, true);

  // Consultar listado
  const clients = await mockAdapter.getClients();
  const found = clients.find((c) => c.id === newClient.id);
  assert.ok(found);

  // Desactivación lógica (toggleClientStatus)
  const toggled = await mockAdapter.toggleClientStatus({ id: newClient.id, is_active: false });
  assert.equal(toggled.is_active, false);

  const clientsAfter = await mockAdapter.getClients();
  const foundAfter = clientsAfter.find((c) => c.id === newClient.id);
  assert.equal(foundAfter?.is_active, false);
});

test('2. Flujo de Actividades: creación, cálculos de saldo y abono parcial', async () => {
  mockAdapter.resetData();

  const clients = await mockAdapter.getClients();
  const activeClient = clients.find((c) => c.is_active);
  assert.ok(activeClient);
  const categories = await mockAdapter.getCategories();
  const activeCategory = categories.find((c) => c.is_active);
  assert.ok(activeCategory);

  // Crear actividad con valor total $ 500.000 COP
  const activity = await mockAdapter.createActivity({
    client_id: activeClient.id,
    type: 'service',
    category_id: activeCategory.id,
    title: 'Desarrollo de landing page con catálogo',
    description: 'Diseño responsive y optimización móvil.',
    activity_date: '2026-11-04',
    total_value: 500000,
    status: 'in_progress',
    internal_notes: 'Costo de dominio propio: $ 60.000',
    public_notes: 'Incluye soporte por 30 días.',
  });

  assert.ok(activity.id.startsWith('act_'));
  assert.equal(activity.total_value, 500000);
  assert.equal(activity.total_received, 0);
  assert.equal(activity.balance_pending, 500000);
  assert.equal(activity.payment_status, 'pending');

  // Registrar abono parcial de $ 200.000 COP
  const payment = await mockAdapter.addPayment({
    activity_id: activity.id,
    payment_date: '2026-11-04',
    amount: 200000,
    payment_method: 'transferencia_bancaria',
    notes: 'Anticipo 40%',
  });

  assert.ok(payment.id.startsWith('pay_'));
  assert.equal(payment.amount, 200000);

  // Consultar actividades y verificar cálculos autoritativos
  const acts = await mockAdapter.getActivities();
  const updatedAct = acts.find((a) => a.id === activity.id);
  assert.ok(updatedAct);
  assert.equal(updatedAct.total_received, 200000);
  assert.equal(updatedAct.balance_pending, 300000);
  assert.equal(updatedAct.payment_status, 'partial');
});

test('3. Regla financiera: impedimento de sobrepagos (OVERPAYMENT_NOT_ALLOWED)', async () => {
  mockAdapter.resetData();

  const acts = await mockAdapter.getActivities();
  const target = acts.find((a) => (a.balance_pending ?? 0) > 0);
  assert.ok(target);
  const excessiveAmount = (target.balance_pending ?? 0) + 50000;

  await assert.rejects(
    async () => {
      await mockAdapter.addPayment({
        activity_id: target.id,
        payment_date: '2026-11-04',
        amount: excessiveAmount,
        payment_method: 'nequi',
      });
    },
    (err) => {
      assert.equal(err.code, 'OVERPAYMENT_NOT_ALLOWED');
      return true;
    }
  );
});

test('4. Regla financiera: no modificar total_value cuando existen pagos (PAYMENT_CONFLICT)', async () => {
  mockAdapter.resetData();

  const acts = await mockAdapter.getActivities();
  const actWithPayments = acts.find((a) => (a.total_received ?? 0) > 0);
  assert.ok(actWithPayments);

  await assert.rejects(
    async () => {
      await mockAdapter.updateActivity({
        id: actWithPayments.id,
        total_value: actWithPayments.total_value + 100000,
      });
    },
    (err) => {
      assert.equal(err.code, 'PAYMENT_CONFLICT');
      return true;
    }
  );
});

test('5. Regla de Cancelación: saldo pasa a 0 y se conservan pagos históricos', async () => {
  mockAdapter.resetData();

  const acts = await mockAdapter.getActivities();
  const actWithPayments = acts.find((a) => (a.total_received ?? 0) > 0 && a.status !== 'cancelled');
  assert.ok(actWithPayments);
  const previousReceived = actWithPayments.total_received;

  // Cancelar la actividad
  const cancelled = await mockAdapter.cancelActivity({ id: actWithPayments.id });
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.balance_pending, 0);
  assert.equal(cancelled.total_received, previousReceived);
  assert.equal(cancelled.payment_status, 'partial');

  // No se admiten pagos en actividades canceladas
  await assert.rejects(
    async () => {
      await mockAdapter.addPayment({
        activity_id: cancelled.id,
        payment_date: '2026-11-04',
        amount: 10000,
        payment_method: 'efectivo',
      });
    },
    (err) => {
      assert.equal(err.code, 'CANNOT_PAY_CANCELLED');
      return true;
    }
  );
});

test('6. Categorías: creación, renombrado y desactivación sin afectar historial', async () => {
  mockAdapter.resetData();

  // Crear categoría
  const newCat = await mockAdapter.createCategory({ name: 'Animación Digital' });
  assert.ok(newCat.id.startsWith('cat_'));
  assert.equal(newCat.name, 'Animación Digital');

  // Renombrar categoría
  const renamed = await mockAdapter.updateCategory({ id: newCat.id, name: 'Animación y 3D' });
  assert.equal(renamed.name, 'Animación y 3D');

  // Desactivar categoría
  const toggled = await mockAdapter.toggleCategoryStatus({ id: newCat.id, is_active: false });
  assert.equal(toggled.is_active, false);

  // Comprobar que actividades existentes no se borran
  const activities = await mockAdapter.getActivities();
  assert.ok(activities.length > 0);
});

test('7. Integridad de Comprobante PDF: datos 100% públicos sin notas internas', async () => {
  mockAdapter.resetData();

  const acts = await mockAdapter.getActivities();
  const actWithNotes = acts.find((a) => a.internal_notes && a.public_notes);
  assert.ok(actWithNotes);

  const pdfData = await mockAdapter.getActivityPdfData({ id: actWithNotes.id });

  // Verificaciones de seguridad mandatorias
  assert.ok(pdfData.reference_code.startsWith('ACT-2026-'));
  assert.equal(pdfData.activity.public_notes, actWithNotes.public_notes);
  assert.equal('internal_notes' in pdfData.activity, false);
  assert.equal('notes' in pdfData.client, false);

  // Generar el binario PDF con pdf-lib y validar que no lance error
  const pdfBytes = await buildActivityPdf(pdfData);
  assert.ok(pdfBytes instanceof Uint8Array);
  assert.ok(pdfBytes.length > 500);

  // Los primeros bytes de un PDF válido corresponden al encabezado %PDF
  const header = String.fromCharCode(...pdfBytes.slice(0, 5));
  assert.equal(header, '%PDF-');
});

test('8. Resumen Financiero: cálculos correctos dentro de rango', async () => {
  mockAdapter.resetData();

  const summary = await mockAdapter.getSummary({
    from: '2026-11-01',
    to: '2026-11-30',
  });

  assert.equal(typeof summary.total_activities_value, 'number');
  assert.equal(typeof summary.total_money_received, 'number');
  assert.equal(typeof summary.total_balance_pending, 'number');
  assert.ok(summary.activities_count.total >= 0);
  assert.ok(summary.activities_count.completed >= 0);
});

test('9. Reintentos: reenvío idéntico conservando la clave de idempotencia', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  let transportFailures = 0;

  const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });

  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: init.body });
    if (transportFailures > 0) {
      transportFailures -= 1;
      throw new TypeError('fetch failed');
    }
    return okResponse({
      success: true,
      data: {
        id: 'cli_test_0001',
        name: 'Prueba',
        phone: '',
        email: '',
        notes: '',
        is_active: true,
        created_at: '2026-11-06T00:00:00.000Z',
        updated_at: '2026-11-06T00:00:00.000Z',
      },
      timestamp: '2026-11-06T00:00:00.000Z',
    });
  };

  try {
    sheetsApi.configure('https://example.test/exec', 'token-de-prueba');

    // (a) Falla de transporte: la operación crítica se reenvía con el cuerpo exacto
    transportFailures = 1;
    const retried = await sheetsApi.execute('createClient', {
      name: 'Cliente Con Reintento',
      request_id: 'client_prueba_0001',
    });
    assert.equal(retried.id, 'cli_test_0001');
    assert.equal(calls.length, 2);
    assert.equal(calls[0].body, calls[1].body);
    assert.equal(JSON.parse(calls[1].body).payload.request_id, 'client_prueba_0001');

    // (b) Si los dos intentos fallan, el reintento del usuario reutiliza el request_id
    calls.length = 0;
    transportFailures = 2;
    await assert.rejects(
      () => api.createClient({ name: 'Cliente Persistente', phone: '+57 300 000 0000' }),
      (err) => err.code === 'NETWORK_FAILURE'
    );
    assert.equal(calls.length, 2);

    transportFailures = 0;
    const created = await api.createClient({ name: 'Cliente Persistente', phone: '+57 300 000 0000' });
    assert.ok(created.id);
    assert.equal(calls.length, 3);
    const firstAttempt = JSON.parse(calls[0].body);
    const userRetry = JSON.parse(calls[2].body);
    assert.equal(firstAttempt.action, 'createClient');
    assert.equal(firstAttempt.payload.request_id, userRetry.payload.request_id);

    // (c) Un error de la aplicación (success: false) jamás se reintenta
    calls.length = 0;
    globalThis.fetch = async (url, init) => {
      calls.push(init.body);
      return okResponse({
        success: false,
        error: { code: 'OVERPAYMENT_NOT_ALLOWED', message: 'El monto supera el saldo pendiente.' },
        timestamp: '2026-11-06T00:00:00.000Z',
      });
    };
    await assert.rejects(
      () =>
        sheetsApi.execute('addPayment', {
          activity_id: 'act_0001',
          payment_date: '2026-11-06',
          amount: 50000,
          payment_method: 'nequi',
          request_id: 'pay_prueba_0001',
        }),
      (err) => err.code === 'OVERPAYMENT_NOT_ALLOWED'
    );
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('10. Formato y normalización de fechas: soporte de formato completo de Google Sheets', () => {
  const sheetsDateStr = 'Sun Feb 08 2026 00:00:00 GMT-0500 (hora estándar de Colombia)';

  // normalizeDate convierte a YYYY-MM-DD
  assert.equal(normalizeDate(sheetsDateStr), '2026-02-08');
  assert.equal(normalizeDate('2026-02-08'), '2026-02-08');
  assert.equal(normalizeDate('2026-02-08T00:00:00.000Z'), '2026-02-08');

  // formatDateEs formatea correctamente la cadena devuelta por Sheets
  const formatted = formatDateEs(sheetsDateStr);
  assert.ok(formatted.includes('8') && formatted.includes('feb') && formatted.includes('2026'));

  // formatDateLongEs
  const longFormatted = formatDateLongEs(sheetsDateStr);
  assert.ok(longFormatted.includes('8') && longFormatted.includes('febrero') && longFormatted.includes('2026'));
});

test('10b. Normalización de fechas: formatos numéricos y de hoja', () => {
  // Formato numérico de hoja: mes/día/año.
  assert.equal(normalizeDate('11/08/2026'), '2026-11-08');
  // Con día > 12 no hay ambigüedad: es día/mes/año.
  assert.equal(normalizeDate('25/10/2026'), '2026-10-25');
  // Año/mes/día con separadores distintos.
  assert.equal(normalizeDate('2026/11/08'), '2026-11-08');
  // ISO con espacio en vez de "T".
  assert.equal(normalizeDate('2026-11-08 00:00:00'), '2026-11-08');
  // Nombres de mes sueltos.
  assert.equal(normalizeDate('Nov 08 2026'), '2026-11-08');
  assert.equal(normalizeDate('08 Nov 2026'), '2026-11-08');
});

test('11. Creación de actividad y registro de pago inmediato automático', async () => {
  mockAdapter.resetData();

  const clients = await mockAdapter.getClients();
  const client = clients.find((c) => c.is_active);
  assert.ok(client);
  const categories = await mockAdapter.getCategories();
  const category = categories.find((c) => c.is_active);
  assert.ok(category);

  // Crear actividad
  const act = await mockAdapter.createActivity({
    client_id: client.id,
    type: 'service',
    category_id: category.id,
    title: 'Mantenimiento de servidor y migración',
    activity_date: '2026-11-09',
    total_value: 450000,
  });

  assert.equal(act.total_value, 450000);
  assert.equal(act.payment_status, 'pending');
  assert.equal(act.balance_pending, 450000);

  // Registrar pago inmediato por el total
  const payment = await mockAdapter.addPayment({
    activity_id: act.id,
    payment_date: '2026-11-09',
    amount: act.total_value,
    payment_method: 'transferencia_bancaria',
    notes: 'Pago recibido al momento de la creación',
  });

  assert.ok(payment.id.startsWith('pay_'));
  assert.equal(payment.amount, 450000);

  // Comprobar que en getActivities el saldo se calcula autoritativamente como pagado
  const acts = await mockAdapter.getActivities();
  const updatedAct = acts.find((a) => a.id === act.id);
  assert.ok(updatedAct);
  assert.equal(updatedAct.total_received, 450000);
  assert.equal(updatedAct.balance_pending, 0);
  assert.equal(updatedAct.payment_status, 'paid');
});

test('12. Selectores sin valor asignado: el backend rechaza valores no elegidos', async () => {
  mockAdapter.resetData();

  const clients = await mockAdapter.getClients();
  const client = clients.find((c) => c.is_active);
  assert.ok(client);
  const categories = await mockAdapter.getCategories();
  const category = categories.find((c) => c.is_active);
  assert.ok(category);

  // Un estado vacío no puede llegar a la base de datos.
  await assert.rejects(
    () =>
      mockAdapter.createActivity({
        client_id: client.id,
        type: 'service',
        category_id: category.id,
        title: 'Actividad sin estado asignado',
        activity_date: '2026-11-10',
        total_value: 120000,
        status: '',
      }),
    (err) => {
      assert.equal(err.code, 'VALIDATION_ERROR');
      return true;
    }
  );

  // Un método de pago vacío tampoco.
  const act = await mockAdapter.createActivity({
    client_id: client.id,
    type: 'service',
    category_id: category.id,
    title: 'Actividad con estado válido',
    activity_date: '2026-11-10',
    total_value: 120000,
    status: 'pending',
  });

  await assert.rejects(
    () =>
      mockAdapter.addPayment({
        activity_id: act.id,
        payment_date: '2026-11-10',
        amount: 120000,
        payment_method: '',
      }),
    (err) => {
      assert.equal(err.code, 'VALIDATION_ERROR');
      return true;
    }
  );

  // Con el método elegido, el abono sí se registra.
  const payment = await mockAdapter.addPayment({
    activity_id: act.id,
    payment_date: '2026-11-10',
    amount: 120000,
    payment_method: 'efectivo',
  });
  assert.equal(payment.amount, 120000);
  assert.equal(payment.payment_method, 'efectivo');
});

test('13. Enrutamiento y Deep Linking: resolución de rutas con parámetros en ruta y query string', () => {
  assert.equal(routeFromHash('#/actividades?id=act_90caf568'), 'activities');
  assert.equal(routeFromHash('#/actividades'), 'activities');
  assert.equal(routeFromHash('#/actividades/act_90caf568'), 'activities');
  assert.equal(routeFromHash('#/actividades/act_90caf568/editar'), 'activities');
  assert.equal(routeFromHash('#/activities?ref=123'), 'activities');
  assert.equal(routeFromHash('#/clientes?search=maria'), 'clients');
  assert.equal(routeFromHash('#/inicio?from=2026-11-01'), 'dashboard');
  assert.equal(routeFromHash(''), 'dashboard');

  // Pruebas de parseHash para rutas canónicas segmentadas
  const parsedDetail = parseHash('#/actividades/act_90caf568');
  assert.equal(parsedDetail.route, 'activities');
  assert.equal(parsedDetail.id, 'act_90caf568');
  assert.equal(parsedDetail.action, null);

  const parsedEdit = parseHash('#/actividades/act_90caf568/editar');
  assert.equal(parsedEdit.route, 'activities');
  assert.equal(parsedEdit.id, 'act_90caf568');
  assert.equal(parsedEdit.action, 'edit');

  // Retrocompatibilidad con query string
  const parsedQuery = parseHash('#/actividades?id=act_12345&action=edit');
  assert.equal(parsedQuery.route, 'activities');
  assert.equal(parsedQuery.id, 'act_12345');
  assert.equal(parsedQuery.action, 'edit');
});

test('14. Caché en memoria nativa en ApiService: lectura rápida e invalidación por mutación', async () => {
  api.setMockMode(true);
  try {
    api.resetMockData();

    // Primera consulta: llena la caché
    const initial = await api.getActivities();
    assert.ok(Array.isArray(initial));

    // Segunda consulta: debe retornar la misma referencia en memoria (0 ms)
    const cached = await api.getActivities();
    assert.equal(cached, initial);

    // Consulta forzada con forceRefresh: omite la caché y devuelve nueva referencia
    const forced = await api.getActivities({ forceRefresh: true });
    assert.notEqual(forced, initial);

    // Mutación: crear una nueva actividad invalida automáticamente la caché
    const clients = await api.getClients();
    const categories = await api.getCategories();
    const created = await api.createActivity({
      client_id: clients[0].id,
      category_id: categories[0].id,
      type: 'service',
      title: 'Actividad para probar invalidación de caché',
      activity_date: '2026-11-15',
      total_value: 300000,
    });

    // La siguiente consulta debe retornar los datos frescos incluyendo la nueva actividad
    const afterMutation = await api.getActivities();
    assert.notEqual(afterMutation, initial);
    assert.ok(afterMutation.some((a) => a.id === created.id));
  } finally {
    api.setMockMode(false);
  }
});
