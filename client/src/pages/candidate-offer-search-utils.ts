export const normalizeSkillToken = (value: string): string => value.trim().toLowerCase();

export function mergeSkillSuggestions(candidateSkills: string[], offerSkills: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const skill of [...candidateSkills, ...offerSkills]) {
    const normalized = normalizeSkillToken(skill);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    merged.push(skill.trim());
  }

  return merged;
}

export function toggleCommaSeparatedSkill(currentValue: string, skill: string): string {
  const normalizedTarget = normalizeSkillToken(skill);
  const currentSkills = currentValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const nextSkills = currentSkills.filter(
    (value) => normalizeSkillToken(value) !== normalizedTarget,
  );

  if (nextSkills.length !== currentSkills.length) {
    return nextSkills.join(', ');
  }

  return [...currentSkills, skill.trim()].join(', ');
}

export function normalizeSkillsQuery(value: string): string {
  const normalized = value
    .split(',')
    .map((skill) => normalizeSkillToken(skill))
    .filter(Boolean);

  return Array.from(new Set(normalized)).join(',');
}
