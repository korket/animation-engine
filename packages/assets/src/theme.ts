import {
  fail,
  object,
  positive,
  text,
  version,
  identifier,
} from './validation.ts';

export const colorRoles = [
  'background',
  'surface',
  'primary',
  'secondary',
  'accent',
  'outline',
] as const;
export type ColorRole = (typeof colorRoles)[number];
export type HexColor = `#${string}`;
export type Theme = Readonly<{
  id: string;
  version: string;
  styleVersion: string;
  status: 'review-candidate';
  colors: Readonly<Record<ColorRole, HexColor>>;
  outlineWidth: number;
  cornerRadius: number;
}>;

export function parseTheme(input: unknown): Theme {
  const value = object(input, 'theme', [
    'id',
    'version',
    'styleVersion',
    'status',
    'colors',
    'outlineWidth',
    'cornerRadius',
  ]);
  if (value.status !== 'review-candidate')
    fail('theme.status', 'expected review-candidate');
  const colors = object(value.colors, 'theme.colors', colorRoles);
  const parsed = {} as Record<ColorRole, HexColor>;
  for (const role of colorRoles) {
    const color = text(colors[role], `theme.colors.${role}`);
    if (!/^#[0-9a-fA-F]{6}$/.test(color))
      fail(`theme.colors.${role}`, 'expected six-digit hex color');
    parsed[role] = color as HexColor;
  }
  return {
    id: identifier(value.id, 'theme.id'),
    version: version(value.version, 'theme.version'),
    styleVersion: version(value.styleVersion, 'theme.styleVersion'),
    status: 'review-candidate',
    colors: parsed,
    outlineWidth: positive(value.outlineWidth, 'theme.outlineWidth'),
    cornerRadius: positive(value.cornerRadius, 'theme.cornerRadius'),
  };
}

export function resolvePaint(paint: string, theme: Theme): HexColor | 'none' {
  if (paint === 'none') return paint;
  const role = paint.startsWith('role:') ? paint.slice(5) : '';
  if (!colorRoles.includes(role as ColorRole))
    return fail('SVG paint', `unsupported semantic role "${paint}"`);
  return theme.colors[role as ColorRole];
}
