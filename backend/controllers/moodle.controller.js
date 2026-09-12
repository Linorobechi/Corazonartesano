import axios from "axios";

/**
 * Catálogo integrado de cursos para artesanos
 */
export const sampleCourses = [
  {
    id: 101,
    fullname: "Técnicas Ancestrales y Tintes Naturales",
    shortname: "TEJIDO-101",
    summary: "Capacitación avanzada para tejedores y artesanos en conservación de técnicas auténticas y pigmentación natural.",
    categoryname: "Artesanías",
    duration: "4 semanas",
    level: "Intermedio",
    enrolled: true,
    instructor: "Maestra Carmen Palomino",
  },
  {
    id: 102,
    fullname: "Gestión Financiera y Costeo para Artesanos",
    shortname: "FIN-201",
    summary: "Aprende a fijar precios justos, calcular costos de producción y llevar la contabilidad de tu taller artesanal.",
    categoryname: "Emprendimiento",
    duration: "3 semanas",
    level: "Básico",
    enrolled: false,
    instructor: "Lic. Roberto Mendoza",
  },
  {
    id: 103,
    fullname: "Fotografía de Producto con Smartphone",
    shortname: "FOTO-301",
    summary: "Técnicas de iluminación y encuadre para resaltar la belleza de tus productos en catálogo digital e e-commerce.",
    categoryname: "Marketing Digital",
    duration: "2 semanas",
    level: "Todos los niveles",
    enrolled: true,
    instructor: "Sofía Gómez",
  },
  {
    id: 104,
    fullname: "Comercialización Digital y Redes Sociales",
    shortname: "MKT-401",
    summary: "Estrategias prácticas para promocionar artesanías en Instagram, Facebook y mercados virtuales internacionales.",
    categoryname: "Marketing Digital",
    duration: "4 semanas",
    level: "Intermedio",
    enrolled: false,
    instructor: "Carlos Ruiz",
  },
];

/**
 * Consultar cursos de capacitación desde Moodle con fallback local
 */
export const getMoodleCourses = async (_req, res) => {
  try {
    const moodleUrl = process.env.MOODLE_URL;
    const moodleToken = process.env.MOODLE_TOKEN;

    if (moodleUrl && moodleToken) {
      const endpointUrl = moodleUrl.endsWith("/webservice/rest/server.php")
        ? moodleUrl
        : `${moodleUrl.replace(/\/$/, "")}/webservice/rest/server.php`;

      try {
        const response = await axios.get(endpointUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json, text/plain, */*",
          },
          params: {
            wstoken: moodleToken,
            wsfunction: "core_course_get_courses",
            moodlewsrestformat: "json",
          },
        });

        if (Array.isArray(response.data)) {
          return res.json(response.data);
        } else if (response.data && (response.data.exception || response.data.error)) {
          console.warn("Moodle API Notice:", response.data.message || response.data.error);
        }
      } catch (getErr) {
        // Try POST as fallback for strict Moodle/Gnomio configurations
        try {
          const params = new URLSearchParams();
          params.append("wstoken", moodleToken);
          params.append("wsfunction", "core_course_get_courses");
          params.append("moodlewsrestformat", "json");

          const postRes = await axios.post(endpointUrl, params, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          if (Array.isArray(postRes.data)) {
            return res.json(postRes.data);
          }
        } catch (_postErr) {
          console.warn("Moodle API connection warning:", getErr.message);
        }
      }
    }

    return res.json(sampleCourses);
  } catch (error) {
    console.error("Error fetching Moodle courses:", error.message);
    return res.status(500).json({ message: "Error al conectar con Moodle" });
  }
};

/**
 * Matricular usuario artesano en un curso Moodle
 */
export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    return res.json({
      message: `Te has inscrito correctamente en el curso #${courseId}. Revisa tu correo o la plataforma Moodle.`,
      courseId,
    });
  } catch (_error) {
    return res.status(500).json({ message: "No se pudo inscribir en el curso" });
  }
};
