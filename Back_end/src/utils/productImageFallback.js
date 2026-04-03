const normalizeKey = (value = '') => {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const PRODUCT_IMAGE_MAP = {
  'vitamin c 500mg': 'vitamin-c-500mg.svg',
  'vitamin d3 1000iu': 'vitamin-d3-1000iu.svg',
  'siro ho': 'cough-syrup.svg',
  'cough syrup': 'cough-syrup.svg',
  'vien thuoc cam lanh': 'cold-tablet.svg',
  'cold tablet': 'cold-tablet.svg',
  'paracetamol 500mg': 'paracetamol-500mg.svg',
  'ibuprofen 200mg': 'ibuprofen-200mg.svg',
  'probiotics': 'probiotics.svg',
  'antacid tablets': 'antacid-tablets.svg',
  'face cream': 'face-cream.svg',
  'sunscreen spf 50': 'sunscreen-spf-50.svg'
};

const getFallbackImageByName = (name) => {
  const key = normalizeKey(name);
  return PRODUCT_IMAGE_MAP[key] || null;
};

const buildLocalProductImageUrl = (baseUrl, name) => {
  const fileName = getFallbackImageByName(name);
  if (!fileName) return null;
  return `${baseUrl}/images/products/${fileName}`;
};

module.exports = {
  getFallbackImageByName,
  buildLocalProductImageUrl,
  isGenericImage: (value) => {
    if (!value) return false;
    const v = String(value).toLowerCase().trim();
  return (
      v.includes('via.placeholder.com') ||
      v.includes('placeholder.com') ||
      v.endsWith('/images/default.jpg') ||
      v.endsWith('/images/default.png') ||
      v.endsWith('/images/products/placeholder.jpg') ||
      v.endsWith('/images/products/placeholder.png') ||
      v === 'default.jpg' ||
      v === 'default.png' ||
      v === 'placeholder.jpg' ||
      v === 'placeholder.png'
    );
  }
};
