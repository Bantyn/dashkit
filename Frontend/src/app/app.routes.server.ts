import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // All routes render on client - Firebase Auth requires browser fetch
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
