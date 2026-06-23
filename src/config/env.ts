const env = {
  GROQ_API_KEY:       import.meta.env.VITE_GROQ_API_KEY as string,
  MAPBOX_TOKEN:       import.meta.env.VITE_MAPBOX_TOKEN as string | undefined,
  MAP_PROVIDER:       (import.meta.env.VITE_MAP_PROVIDER as string) || 'leaflet',
  API_BASE_URL:       (import.meta.env.VITE_API_BASE_URL as string) || '/api',
  CLOUDINARY_CLOUD:   import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined,
  IS_DEV:             import.meta.env.DEV,
  IS_PROD:            import.meta.env.PROD,
};

export default env;
