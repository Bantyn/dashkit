import { ActivatedRouteSnapshot } from '@angular/router';

export function getRouteParamFromSnapshot(
  route: ActivatedRouteSnapshot,
  paramName: string,
): string | null {
  for (const snapshot of [...route.pathFromRoot].reverse()) {
    const value = snapshot.paramMap.get(paramName);
    if (value) {
      return value;
    }
  }

  return null;
}

export function getWorkspaceBlockedPath(url: string): string {
  const [pathOnly] = url.split('?');
  const segments = pathOnly.split('/').filter(Boolean);

  if (!segments.length) {
    return '';
  }

  if (segments[0] === 'shop') {
    return segments.slice(2).join('/');
  }

  return segments.slice(1).join('/');
}
