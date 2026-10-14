export const PACKAGES = Object.freeze({
  'support-1': { count: 1, price: 99, label: '1 Course' },
  'support-2': { count: 2, price: 169, label: '2 Courses' },
  'support-3': { count: 3, price: 229, label: '3 Courses' },
  'support-4': { count: 4, price: 279, label: '4 Courses' },
});

export function getPackageByIdOrCount(identifier, countFallback) {
  if (identifier && PACKAGES[String(identifier).trim()]) {
    return { id: String(identifier).trim(), ...PACKAGES[String(identifier).trim()] };
  }
  const countNum = Number(countFallback ?? identifier);
  if (!Number.isNaN(countNum)) {
    const match = Object.entries(PACKAGES).find(([, pkg]) => pkg.count === countNum);
    if (match) return { id: match[0], ...match[1] };
  }
  return null;
}
