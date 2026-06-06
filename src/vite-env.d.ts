/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_COFFEE_TIME?: string;
  readonly VITE_BUY_ME_A_COFFEE_URL?: string;
  readonly VITE_GITHUB_REPOSITORY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
