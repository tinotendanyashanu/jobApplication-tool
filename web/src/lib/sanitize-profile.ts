import type { EducationItem, UserProfile } from "@/types/profile";

function keepEducation(entry: EducationItem): boolean {
  return Boolean(
    (entry.degree || "").trim() ||
      (entry.institution || "").trim() ||
      (entry.year || "").trim()
  );
}

/** Drop obvious empty scaffolding before sending API requests. */
export function sanitizeProfile(profile: UserProfile): UserProfile {
  const links = (profile.links || []).filter((l) => (l.url || "").trim());

  const experience =
    profile.experience?.filter(
      (job) =>
        (job.title || "").trim() ||
        (job.company || "").trim() ||
        (job.highlights?.length ?? 0) > 0
    ) ?? [];

  const education =
    profile.education?.filter(keepEducation).map((e) => ({ ...e })) ?? [];

  const skills =
    profile.skills?.filter((skill) =>
      typeof skill === "string" ? skill.trim() : skill.name.trim()
    ) ?? [];

  const languages =
    profile.languages?.filter((l) => (l.language || "").trim()) ?? [];

  const preferences = profile.preferences
    ? { ...profile.preferences }
    : undefined;

  return {
    ...profile,
    links,
    experience,
    education,
    skills,
    languages,
    preferences: preferences ?? undefined,
  };
}
