// get environment variables with the VITE_ prefix
export function getConfig(config) {
  return import.meta.env[`VITE_${config}`];
}
