import { apiClient, parseResponse } from "./client.js";

export const getMoodleCourses = async () => {
  const response = await apiClient("/api/cursos");
  return parseResponse(response);
};

export const enrollMoodleCourse = async (courseId) => {
  const response = await apiClient("/api/moodle/enroll", {
    method: "POST",
    body: JSON.stringify({ courseId }),
  });
  return parseResponse(response);
};
