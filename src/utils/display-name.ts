export function firstName(name: string) {
  const value = name.trim().split(/\s+/)[0] ?? '';
  if (!value) return 'You';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function displayName(name: string) {
  const value = name.trim();
  if (!value) return 'You';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function displayTitle(title: string) {
  const value = title.trim().replace(/\s+/g, ' ');
  if (!value) return 'Something';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
