import type { NavIconName } from '@/components/navigation/nav-icon';

export type NavigationRole = 'author' | 'editor' | 'admin' | null;

export interface AdminNavigationItem {
  href: string;
  label: string;
  icon: NavIconName;
  visible: boolean;
}

export interface AdminNavigationGroup {
  label: string;
  items: AdminNavigationItem[];
}

export function getAdminNavigationGroups(role: NavigationRole): AdminNavigationGroup[] {
  return [
    {
      label: 'Workspace',
      items: [
        { href: '/admin', label: 'Resumen', icon: 'chart', visible: true },
        { href: '/admin/news', label: 'Noticias', icon: 'book', visible: true },
      ],
    },
    {
      label: 'Comunidad',
      items: [{ href: '/admin/comments', label: 'Comentarios', icon: 'comment', visible: role === 'editor' || role === 'admin' }],
    },
    {
      label: 'Catálogo',
      items: [{ href: '/admin/catalog', label: 'Categorías y tags', icon: 'grid', visible: role === 'editor' || role === 'admin' }],
    },
    {
      label: 'Administración',
      items: [
        { href: '/admin/users', label: 'Usuarios y roles', icon: 'users', visible: role === 'admin' },
        { href: '/admin/settings', label: 'Configuración', icon: 'settings', visible: role === 'admin' },
      ],
    },
  ];
}
