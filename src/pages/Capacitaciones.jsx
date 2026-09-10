import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import {
  FaGraduationCap,
  FaBookOpen,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaPlayCircle,
  FaClock,
  FaUserGraduate,
} from "react-icons/fa";

const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
};

export default function Capacitaciones() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [notification, setNotification] = useState("");

  const storedUser = localStorage.getItem("auth_user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    let ignore = false;
    fetch("/api/cursos")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          const rawCourses = Array.isArray(data) ? data : [];
          // Filter out site frontpage course (usually id: 1 or format: 'site') if other courses exist
          const filtered = rawCourses.filter(
            (c) => c.format !== "site" && c.id !== 1
          );
          const finalCourses = filtered.length > 0 ? filtered : rawCourses;
          setCourses(finalCourses);
        }
      })
      .catch(() => {
        if (!ignore) setCourses([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    setNotification("");

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/moodle/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        setNotification(`Inscripción exitosa en el curso. Se envió un correo con los accesos.`);
        // Mark course enrolled in UI state
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, enrolled: true } : c))
        );
      }
    } catch {
      setNotification("Error al procesar la inscripción.");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <>
      <section className="bg-[#f5f1ec] pt-24 pb-20 px-4 md:px-12 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-[#eae0d5] flex flex-col md:flex-row justify-between items-center gap-6"
          >
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-[#f1ece7] text-[#8b5e3c] px-3.5 py-1 rounded-full text-xs font-semibold">
                <FaGraduationCap className="text-base" /> Plataforma Moodle para Artesanos
              </div>
              <h1 className="text-3xl font-bold text-[#8b5e3c]">
                Capacitaciones y Formación Artesanal
              </h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                Accede a cursos especializados diseñados para perfeccionar tus técnicas, optimizar la administración de tu taller y digitalizar tus ventas.
              </p>
              {user && (
                <p className="text-xs font-medium text-gray-500 pt-1">
                  Artesano activo: <strong className="text-gray-800">{user.nombre}</strong> (ID Moodle: {user.moodle_id || "Asignado automáticamente"})
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <a
                href="https://corazonartesano.moodlecloud.com/login/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#8b5e3c] text-white px-6 py-3.5 rounded-2xl font-semibold text-sm hover:bg-[#754d31] transition shadow-md flex items-center gap-2 text-center"
              >
                Acceder a Moodle Cloud
                <FaExternalLinkAlt className="text-xs" />
              </a>
              <span className="text-[11px] text-gray-400">Campus Virtual Oficial</span>
            </div>
          </motion.div>

          {notification && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
              <FaCheckCircle className="text-base flex-shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Courses Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#8b5e3c] flex items-center gap-2">
              <FaBookOpen /> Catálogo de Cursos Disponibles
            </h2>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Cargando cursos desde Moodle...</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay cursos disponibles en este momento.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -4 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae0d5] flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="bg-[#faf7f2] text-[#8b5e3c] px-3 py-1 rounded-xl text-xs font-bold border border-[#ede3d8]">
                          {course.categoryname || "Capacitación"}
                        </span>
                        {course.enrolled && (
                          <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                            <FaCheckCircle /> Inscrito
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-800">{course.fullname}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed font-normal">
                        {stripHtml(course.summary) || "Curso de formación artesanal y desarrollo técnico en Moodle."}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <FaClock className="text-[#8b5e3c]" /> {course.duration || "3 semanas"}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaUserGraduate className="text-[#8b5e3c]" /> Instructor: {course.instructor || "Moodle Team"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      {course.enrolled ? (
                        <a
                          href="https://corazonartesano.moodlecloud.com/login/index.php"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-green-700 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-green-800 transition text-center flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <FaPlayCircle /> Ingresar al Aula Virtual
                        </a>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingId === course.id}
                          className="w-full bg-[#8b5e3c] text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-[#754d31] transition text-center disabled:opacity-70"
                        >
                          {enrollingId === course.id ? "Inscribiendo..." : "Inscribirme Gratuitamente"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}