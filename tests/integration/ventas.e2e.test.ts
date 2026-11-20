import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { SeedService } from '../../src/database/seeds/seed.service';

describe('Sistema de ventas (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  const base = '/api/v1';
  const pago = (saldoDisponible = 1_000_000_000) => ({ medio: 'TARJETA', saldoDisponible });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await app.get(SeedService).run();
    http = request(app.getHttpServer());
  });

  afterAll(() => app.close());

  it('GET /health responde ok', async () => {
    const res = await http.get('/health').expect(200);
    expect(res.body.data.status).toBe('ok');
  });

  it('lista productos con envoltorio y paginación real', async () => {
    const res = await http.get(`${base}/productos`).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.meta.total).toBe(3);
  });

  it('crea una venta, descuenta stock y al cancelar lo restaura', async () => {
    const venta = await http
      .post(`${base}/ventas`)
      .send({ clienteId: 1, productoId: 1, cantidad: 2, pago: pago() })
      .expect(201);
    // Cliente común (0%) + retiro en sucursal ($0): sin cambios sobre el precio de lista.
    expect(venta.body.data.subtotal).toBe(30000);
    expect(venta.body.data.total).toBe(30000);

    let prod = await http.get(`${base}/productos/1`).expect(200);
    expect(prod.body.data.stock).toBe(8);

    await http.delete(`${base}/ventas/${venta.body.data.id}`).expect(200);
    prod = await http.get(`${base}/productos/1`).expect(200);
    expect(prod.body.data.stock).toBe(10);
  });

  it('aplica descuento VIP y envío normal al crear la venta', async () => {
    const venta = await http
      .post(`${base}/ventas`)
      .send({ clienteId: 4, productoId: 2, cantidad: 5, envio: 'NORMAL', pago: pago() })
      .expect(201);
    // 5 x 8.000 = 40.000 -> VIP -15% = 34.000 -> +5.000
    expect(venta.body.data.subtotal).toBe(40000);
    expect(venta.body.data.total).toBe(39000);
    expect(venta.body.data.envio).toBe('NORMAL');
    await http.delete(`${base}/ventas/${venta.body.data.id}`).expect(200);
  });

  describe('POST /ventas/cotizar', () => {
    it('devuelve las estrategias aplicadas sin crear la venta ni tocar el stock', async () => {
      const res = await http
        .post(`${base}/ventas/cotizar`)
        .send({ clienteId: 4, productoId: 1, cantidad: 11, envio: 'EXPRESS', promociones: ['PROMO5'] })
        .expect(200);

      // 11 x 15.000 = 165.000 -> -15% -> -10% -> -5% -> +10.000
      expect(res.body.data.subtotal).toBe(165000);
      expect(res.body.data.pasos.map((p: { estrategia: string }) => p.estrategia)).toEqual([
        'Cliente VIP',
        'Descuento por cantidad (más de 10)',
        'Promoción especial PROMO5',
        'Envío express',
      ]);
      expect(res.body.data.total).toBe(129913.75);

      const prod = await http.get(`${base}/productos/1`).expect(200);
      expect(prod.body.data.stock).toBe(10);
    });

    it('devuelve 404 si el cliente no existe', async () => {
      await http.post(`${base}/ventas/cotizar`).send({ clienteId: 99, productoId: 1, cantidad: 1 }).expect(404);
    });
  });

  describe('cadena de validación', () => {
    it('rechaza cliente bloqueado (Validar Cliente)', async () => {
      const res = await http
        .post(`${base}/ventas`)
        .send({ clienteId: 3, productoId: 1, cantidad: 1, pago: pago() })
        .expect(400);
      expect(res.body.error.message).toBe('Cliente bloqueado');
    });

    it('rechaza stock insuficiente sin modificar el stock (Validar Stock)', async () => {
      const res = await http
        .post(`${base}/ventas`)
        .send({ clienteId: 1, productoId: 3, cantidad: 99, pago: pago() })
        .expect(400);
      expect(res.body.error.message).toBe('Stock insuficiente');
      const prod = await http.get(`${base}/productos/3`).expect(200);
      expect(prod.body.data.stock).toBe(3);
    });

    it('rechaza el pago cuando el saldo no cubre el precio final (Validar Pago)', async () => {
      const res = await http
        .post(`${base}/ventas`)
        .send({ clienteId: 1, productoId: 1, cantidad: 1, pago: pago(100) })
        .expect(400);
      expect(res.body.error.code).toBe('PAGO_RECHAZADO');
      const prod = await http.get(`${base}/productos/1`).expect(200);
      expect(prod.body.data.stock).toBe(10);
    });
  });

  it('devuelve 404 para cliente o producto inexistente', async () => {
    await http.post(`${base}/ventas`).send({ clienteId: 99, productoId: 1, cantidad: 1, pago: pago() }).expect(404);
    await http.post(`${base}/ventas`).send({ clienteId: 1, productoId: 99, cantidad: 1, pago: pago() }).expect(404);
  });

  it('valida el body y el id', async () => {
    await http.post(`${base}/ventas`).send({ clienteId: 1, productoId: 1, cantidad: 0, pago: pago() }).expect(400);
    await http.post(`${base}/ventas`).send({ clienteId: 1, productoId: 1, cantidad: 1 }).expect(400);
    await http
      .post(`${base}/ventas`)
      .send({ clienteId: 1, productoId: 1, cantidad: 1, envio: 'DRON', pago: pago() })
      .expect(400);
    await http.get(`${base}/productos/abc`).expect(400);
  });

  it('rechaza email duplicado sin distinguir mayúsculas', async () => {
    const res = await http.post(`${base}/clientes`).send({ nombre: 'X', email: 'JUAN@mail.com' }).expect(400);
    expect(res.body.error.message).toBe('Ya existe un cliente con ese email');
  });

  it('crea un cliente con tipo y por defecto es COMUN', async () => {
    const vip = await http.post(`${base}/clientes`).send({ nombre: 'V', email: 'v@mail.com', tipo: 'VIP' }).expect(201);
    expect(vip.body.data.tipo).toBe('VIP');
    const comun = await http.post(`${base}/clientes`).send({ nombre: 'C', email: 'c@mail.com' }).expect(201);
    expect(comun.body.data.tipo).toBe('COMUN');
    await http.post(`${base}/clientes`).send({ nombre: 'T', email: 't@mail.com', tipo: 'ORO' }).expect(400);
  });

  it('no elimina un cliente o producto con ventas asociadas', async () => {
    const venta = await http
      .post(`${base}/ventas`)
      .send({ clienteId: 2, productoId: 2, cantidad: 1, pago: pago() })
      .expect(201);
    await http.delete(`${base}/clientes/2`).expect(400);
    await http.delete(`${base}/productos/2`).expect(400);
    await http.delete(`${base}/ventas/${venta.body.data.id}`).expect(200);
  });

  it('PUT sin campos devuelve 400', async () => {
    await http.put(`${base}/productos/1`).send({}).expect(400);
  });
});
