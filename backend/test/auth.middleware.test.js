import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { JWT_SECRET } from "../config/db.js";

const runMiddleware = (middleware, request = {}) => {
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  middleware(request, response, () => {
    nextCalled = true;
  });
  return { response, nextCalled, request };
};

test("rechaza una petición sin token", () => {
  const result = runMiddleware(authMiddleware, { headers: {} });

  assert.equal(result.response.statusCode, 401);
  assert.equal(result.response.body.message, "Token no proporcionado");
  assert.equal(result.nextCalled, false);
});

test("acepta un token vigente y adjunta el usuario", () => {
  const token = jwt.sign({ id: 7, rol: "comprador" }, JWT_SECRET, { expiresIn: "1h" });
  const result = runMiddleware(authMiddleware, {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(result.nextCalled, true);
  assert.equal(result.request.user.id, 7);
  assert.equal(result.request.user.rol, "comprador");
});

test("rechaza un token expirado", () => {
  const token = jwt.sign({ id: 7 }, JWT_SECRET, { expiresIn: -1 });
  const result = runMiddleware(authMiddleware, {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(result.response.statusCode, 401);
  assert.equal(result.response.body.message, "Token inválido o expirado");
});

test("bloquea roles no autorizados", () => {
  const middleware = requireRole(["artesano"]);
  const result = runMiddleware(middleware, { user: { id: 7, rol: "comprador" } });

  assert.equal(result.response.statusCode, 403);
  assert.equal(result.nextCalled, false);
});
