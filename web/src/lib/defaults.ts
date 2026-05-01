import type { UserProfile } from "@/types/profile";

export function defaultProfile(): UserProfile {
  return {
    full_name: "",
    email: "",
    phone: "",
    location: "",
    links: [{ label: "LinkedIn", url: "" }],
    summary: "",
    experience: [
      {
        title: "",
        company: "",
        location: "",
        start: "",
        end: "",
        highlights: [],
      },
    ],
    education: [{ degree: "", institution: "", year: "" }],
    skills: [],
    projects: [],
    languages: [],
    preferences: {
      target_roles: [],
      industries: [],
      salary_expectation: "",
      availability: "",
    },
  };
}
