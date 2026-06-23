// Archivo de configuración local para evitar el error 404 en desarrollo.
// Este archivo es sobrescrito dinámicamente en producción por docker-entrypoint.sh.
window.__APP_CONFIG__ = {
  VITE_API_URL: "https://bita-backend.ux.local"
};
