import axios from 'axios';

const BASE_URL = 'https://shiro-ai-taking-app.onrender.com';
const API_URL = `${BASE_URL}/api/notes`;
const CATEGORY_URL = `${BASE_URL}/api/categories`;
const AUTH_URL = `${BASE_URL}/api/auth`;

// Attach the login token to every request automatically
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = (email, password) => axios.post(`${AUTH_URL}/register`, { email, password });
export const login = (email, password) => axios.post(`${AUTH_URL}/login`, { email, password });

export const getNotes = () => axios.get(API_URL);
export const createNote = (formData) => axios.post(API_URL, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateNote = (id, note) => axios.put(`${API_URL}/${id}`, note);
export const deleteNote = (id) => axios.delete(`${API_URL}/${id}`);

export const summarizeNote = (id) => axios.post(`${API_URL}/${id}/summarize`);
export const generateTagsForNote = (id) => axios.post(`${API_URL}/${id}/tags`);
export const generateQuiz = (id) => axios.post(`${API_URL}/${id}/quiz`);
export const generateFlashcards = (id) => axios.post(`${API_URL}/${id}/flashcards`);

export const getCategories = () => axios.get(CATEGORY_URL);
export const createCategory = (name) => axios.post(CATEGORY_URL, { name });
export const deleteCategory = (name) => axios.delete(`${CATEGORY_URL}/${encodeURIComponent(name)}`);

export const getNotesByCategory = (category) => axios.get(`${API_URL}?category=${encodeURIComponent(category)}`);

export const generateSummaryFromText = (text) => axios.post(`${API_URL}/generate/summary`, { text });
export const generateQuizFromText = (text) => axios.post(`${API_URL}/generate/quiz`, { text });
export const generateFlashcardsFromText = (text) => axios.post(`${API_URL}/generate/flashcards`, { text });

export const generateKeyTermsForNote = (id) => axios.post(`${API_URL}/${id}/keyterms`);
export const generateKeyTermsFromText = (text) => axios.post(`${API_URL}/generate/keyterms`, { text });