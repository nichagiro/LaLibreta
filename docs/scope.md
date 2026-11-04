# Alcance Funcional y Exclusiones del Producto

## Contexto del Producto
Aplicación web personal y ligera para un trabajador independiente colombiano, orientada a registrar y controlar las actividades que le generan ingresos económicos, gestionar sus clientes, controlar saldos pendientes y emitir comprobantes en PDF para envío manual vía WhatsApp.

---

## 1. Módulos y Entidades dentro del Alcance

### 1.1 Clientes
- **Campos**: Nombre completo (obligatorio), teléfono (opcional), correo electrónico (opcional), notas libres (opcional), estado (`is_active`).
- **Historial**: Consulta de actividades y pagos asociados al cliente.
- **Totales derivados**: Total facturado al cliente, dinero recibido y saldo pendiente acumulado.
- **Política de borrado**: Borrado lógico (`is_active = false`). No se permite borrado físico si el cliente tiene actividades registradas.

### 1.2 Actividades (Servicios y Ventas)
- **Campos**:
  - Cliente asociado.
  - Tipo: `service` (Servicio) o `sale` (Venta).
  - Categoría.
  - Título escrito manualmente (texto libre, sin catálogo ni selector rígido).
  - Descripción libre (multilínea, donde el usuario puede desglosar detalles si lo desea).
  - Fecha de la actividad (`YYYY-MM-DD`).
  - Valor total (`total_value` en COP enteros). Un único valor total por actividad.
  - Estado operativo: `pending` (pendiente), `in_progress` (en proceso), `completed` (finalizada), `cancelled` (cancelada).
  - Notas internas (privadas, jamás aparecen en el PDF).
  - Observaciones públicas (destinadas a imprimirse en el PDF).
- **Cálculos derivados de pagos**:
  - Total recibido (`total_received`).
  - Saldo pendiente (`balance_pending`).
  - Estado del pago derivado: `pending` (sin abonos), `partial` (abonos parciales), `paid` (completamente pagado).
- **Regla de Cancelación**:
  - Si el estado pasa a `cancelled`, el saldo pendiente por cobrar se establece automáticamente en **$0** para no distorsionar la cartera de cobros pendientes. Los abonos ya recibidos antes de la cancelación se mantienen en el historial financiero de dinero cobrado.

### 1.3 Pagos y Abonos
- **Campos**:
  - Actividad asociada.
  - Fecha del pago (`YYYY-MM-DD`, independiente de la fecha de la actividad).
  - Monto (`amount` en COP enteros).
  - Método de pago (`transferencia_bancaria`, `nequi`, `daviplata`, `efectivo`, `tarjeta`, `otro`).
  - Nota u observación opcional.
- **Reglas**:
  - **No sobrepagos**: No se admite registrar un abono cuyo monto supere el saldo pendiente de la actividad (`balance_pending`).
  - No se pueden agregar abonos a actividades con estado `cancelled`.

### 1.4 Categorías
- **Campos**: Nombre, estado (`is_active`).
- **Comportamiento**: Se pueden crear, renombrar y desactivar.
- **Integridad**: Desactivar una categoría (`is_active = false`) no elimina ni altera el historial de actividades asociadas a ella.
- **Categorías sugeridas de inicio**:
  1. *Sistemas*
  2. *Desarrollo web*
  3. *Recreación y eventos*
  4. *Venta de artículos*
  5. *Otros*

### 1.5 Resumen Financiero y Métricas
- Filtro por rango de fechas (desde / hasta).
- **Valor de actividades registradas**: Suma de `total_value` de actividades activas (no canceladas) cuya fecha esté en el rango.
- **Dinero recibido**: Suma de pagos cuya fecha de pago (`payment_date`) caiga en el rango (independiente de cuándo se hizo la actividad).
- **Saldo pendiente**: Total adeudado por los clientes en el período analizado.
- **Conteo operativo**: Total de actividades registradas, pendientes, en proceso, finalizadas y canceladas.
- **Regla terminológica obligatoria**: **Nunca usar la palabra "Ganancia"**; los cobros representan ingresos o cobros brutos, no utilidad neta contable.

### 1.6 Configuración del Propietario
- Nombre completo del profesional independiente.
- Nombre comercial opcional.
- Datos de contacto (teléfono, correo).
- Instrucciones de pago (cuentas bancarias, números Nequi/Daviplata para ser impresos en el PDF).
- Logo opcional (almacenable como URL o Base64 liviano).

### 1.7 Comprobante en PDF
- Resumen claro de la actividad (servicio o venta).
- Referencia legible (código o ID).
- Datos del profesional emisor y del cliente.
- Fechas de actividad y emisión.
- Título y descripción detallada.
- Desglose de valor total, abonos realizados y saldo pendiente actual.
- Observaciones públicas.
- Instrucciones de pago del emisor.
- **Exclusiones de seguridad**: NUNCA debe incluir las notas internas.
- **Descarga local**: Se genera en el navegador para que el usuario lo guarde y lo adjunte manualmente en WhatsApp.
- **Leyenda aclaratoria**: No debe tener formato ni leyendas de factura electrónica ni hacer mención de validación DIAN.

---

## 2. Límites Explícitos y Fuera de Alcance (Out of Scope)

Los siguientes conceptos quedan **estrictamente fuera del alcance** del proyecto:
- ❌ Suscripciones, membresías o renovaciones recurrentes automáticas.
- ❌ Módulo de gastos, costos operativos, compras a proveedores o cálculo de utilidades netas.
- ❌ Gestión de inventario o stock físico.
- ❌ Catálogo estructurado de productos o servicios con tablas de ítems/precios unitarios/cantidades.
- ❌ Facturación electrónica obligatoria de la DIAN o generación de XML / CUFE.
- ❌ Pasarelas de pago online (Wompi, MercadoPago, Stripe, PSE).
- ❌ Integración automática con la API de WhatsApp o bots de mensajería (el envío es manual por el usuario).
- ❌ Portal externo para clientes o inicio de sesión de terceros.
- ❌ Registro público de usuarios multitenant.
- ❌ Manejo de equipos de trabajo, comisiones o múltiples sedes.
