/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY: string;
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_MAP_PROVIDER?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
