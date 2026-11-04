const emergencyKeywords = [
  'chest pain',
  'chest mein dard',
  'seene mein dard',
  'seene me dard',
  'sine mein dard',
  'saans nahi',
  'saans ni',
  'saans lene mein',
  'saans lene me',
  'breathing problem',
  "can't breathe",
  'cannot breathe',
  'difficulty breathing',
  'heart attack',
  'dil ka daura',
  'stroke',
  'behosh',
  'unconscious',
  'khoon ki ulti',
  'bahut zyada khoon',
  'severe bleeding',
  'suicide',
  'khudkushi',
  'khud kushi',
  'mar jana chahta',
  'mar jana chahti',
];

export const emergencyMessage =
  'Yeh emergency ho sakti hai. Please abhi kisi nazdeeki hospital ki emergency mein jayein, ya Rescue 1122 par call karein. Is mein der na karein. Jab tak madad na aaye, mareez ko akela na chhorein aur ghabrahat kam karne ki koshish karein. Ye ek general information tool hai, doctor ki jagah nahi.';

export const findEmergency = (text) => {
  if (typeof text !== 'string') return null;
  const normalized = text.toLowerCase();
  const hit = emergencyKeywords.some((keyword) => normalized.includes(keyword));
  return hit ? emergencyMessage : null;
};
