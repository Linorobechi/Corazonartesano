import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import app from "../index.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("expone el estado de salud de la API", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(typeof body.memoryDb, "boolean");
});

test("protege el carrito de usuarios no autenticados", async () => {
  const response = await fetch(`${baseUrl}/api/cart`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.message, "Token no proporcionado");
});

test("protege el perfil de usuarios no autenticados", async () => {
  const response = await fetch(`${baseUrl}/api/user/profile`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.message, "Token no proporcionado");
});
