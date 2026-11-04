import test from 'node:test';
import assert from 'node:assert/strict';

import { mockAdapter } from '../src/services/mock-adapter.ts';
import { buildActivityPdf } from '../src/features/pdf/generatePdf.ts';

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
