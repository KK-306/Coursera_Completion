export const PACKAGES = Object.freeze({
  'support-1': { count: 1, price: 59, originalPrice: 99, discountText: '40% OFF', label: '1 Course' },
  'support-2': { count: 2, price: 99, originalPrice: 169, discountText: '40% OFF', label: '2 Courses' },
  'support-3': { count: 3, price: 137, originalPrice: 229, discountText: '40% OFF', label: '3 Courses' },
  'support-4': { count: 4, price: 167, originalPrice: 279, discountText: '40% OFF', label: '4 Courses' },
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
