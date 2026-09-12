import { pool, isUsingMemoryDb, memoryDb } from "../config/db.js";
import { formatCurrency, buildUserResponse } from "../utils/formatters.js";

/**
 * Obtener estadísticas y métricas generales para el panel administrativo
 */
export const getStats = async (_req, res) => {
  try {
    let totalUsers = 0;
    let totalArtesanos = 0;
    let totalCompradores = 0;
    let totalAdmins = 0;
    let totalProducts = 0;
    let totalOrders = 0;
    let totalRevenue = 0;
    let recentOrders = [];

    if (isUsingMemoryDb) {
      totalUsers = memoryDb.users.length;
      totalArtesanos = memoryDb.users.filter((u) => u.rol === "artesano").length;
      totalCompradores = memoryDb.users.filter((u) => u.rol === "comprador").length;
      totalAdmins = memoryDb.users.filter((u) => u.rol === "admin").length;
      totalProducts = memoryDb.products.length;
      totalOrders = memoryDb.orders.length;
      totalRevenue = memoryDb.orders
        .filter((o) => o.status === "APPROVED")
        .reduce((sum, o) => sum + (o.total || 0), 0);
      recentOrders = memoryDb.orders.slice(0, 5);
    } else {
      const userCounts = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN rol = 'artesano' THEN 1 ELSE 0 END) as total_artesanos,
          SUM(CASE WHEN rol = 'comprador' THEN 1 ELSE 0 END) as total_compradores,
          SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) as total_admins
        FROM users
      `);
      totalUsers = Number(userCounts.rows[0]?.total_users || 0);
      totalArtesanos = Number(userCounts.rows[0]?.total_artesanos || 0);
      totalCompradores = Number(userCounts.rows[0]?.total_compradores || 0);
      totalAdmins = Number(userCounts.rows[0]?.total_admins || 0);

      const prodCount = await pool.query("SELECT COUNT(*) as total_products FROM products");
      totalProducts = Number(prodCount.rows[0]?.total_products || 0);

      const orderStats = await pool.query(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'APPROVED' THEN total ELSE 0 END) as total_revenue
        FROM orders
      `);
      totalOrders = Number(orderStats.rows[0]?.total_orders || 0);
      totalRevenue = Number(orderStats.rows[0]?.total_revenue || 0);

      const orders = await pool.query("SELECT * FROM orders ORDER BY id DESC LIMIT 5");
      recentOrders = orders.rows;
    }

    return res.json({
      stats: {
        totalUsers,
        totalArtesanos,
        totalCompradores,
        totalAdmins,
        totalProducts,
        totalOrders,
        totalRevenue,
        formattedRevenue: formatCurrency(totalRevenue),
      },
      recentOrders,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return res.status(500).json({ message: "Error al obtener estadísticas del sitio" });
  }
};

/**
 * Listar todos los usuarios registrados (Solo Admin)
 */
export const getUsers = async (_req, res) => {
  try {
    let usersList = [];
    if (isUsingMemoryDb) {
      usersList = memoryDb.users.map((u) => buildUserResponse(u));
    } else {
      const rows = await pool.query("SELECT * FROM users ORDER BY id DESC");
      usersList = rows.rows.map((u) => buildUserResponse(u));
    }
    return res.json({ users: usersList });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return res.status(500).json({ message: "Error al consultar la lista de usuarios" });
  }
};

/**
 * Modificar el rol de un usuario (Solo Admin)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    const validRoles = ["artesano", "comprador", "admin"];
    if (!validRoles.includes(rol)) {
      return res.status(400).json({ message: "Rol no válido" });
    }

    if (isUsingMemoryDb) {
      const user = memoryDb.users.find((u) => u.id === Number(id));
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
      user.rol = rol;
      return res.json({ message: "Rol de usuario actualizado correctamente", user: buildUserResponse(user) });
    }

    const updatedRows = await pool.query("UPDATE users SET rol = $1 WHERE id = $2 RETURNING *", [rol, id]);
    if (!updatedRows.rows || updatedRows.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json({
      message: "Rol de usuario actualizado correctamente",
      user: buildUserResponse(updatedRows.rows[0]),
    });
  } catch (error) {
    console.error("Error al cambiar rol:", error);
    return res.status(500).json({ message: "Error al actualizar el rol del usuario" });
  }
};

/**
 * Eliminar una cuenta de usuario (Solo Admin, no auto-eliminación)
 */
export const deleteUserAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: "No puedes eliminar tu propia cuenta de administrador en sesión" });
    }

    if (isUsingMemoryDb) {
      const userIdx = memoryDb.users.findIndex((u) => u.id === Number(id));
      if (userIdx === -1) return res.status(404).json({ message: "Usuario no encontrado" });

      const deletedUser = memoryDb.users.splice(userIdx, 1)[0];
      return res.json({ message: `Cuenta de ${deletedUser.nombre} eliminada con éxito` });
    }

    const rows = await pool.query("DELETE FROM users WHERE id = $1 RETURNING nombre", [id]);
    if (!rows.rows || rows.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json({ message: `Cuenta de ${rows.rows[0].nombre} eliminada con éxito` });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return res.status(500).json({ message: "Error al eliminar la cuenta de usuario" });
  }
};
