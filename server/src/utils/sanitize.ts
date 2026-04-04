export const sanitizeText = (value: string): string => value.replace(/[<>]/g, '').trim();

export const normalizeSkills = (skills: string[]): string[] =>
  Array.from(new Set(skills.map((skill) => sanitizeText(skill).toLowerCase()).filter(Boolean)));

export const skillsToText = (skills: string[]): string => normalizeSkills(skills).join(',');
