export type ParsedCV = {
  header: {
    name: string;
    contact: string[];
  };
  summary: string;
  experience: { title: string; date: string; company: string; bullets: string[] }[];
  education: { degree: string; date: string; institution: string; details: string }[];
  skills: { category: string; items: string[] }[];
  projects: { name: string; details: string; bullets: string[] }[];
};

export function parseMarkdownCV(markdown: string): ParsedCV {
  const result: ParsedCV = {
    header: { name: "", contact: [] },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
  };

  if (!markdown || typeof markdown !== "string") return result;

  const lines = markdown.split("\n").map(l => l.trim());
  let currentSection = "header";
  let currentItem: any = null;

  // Very basic heuristic for header parsing
  if (lines.length > 0 && !lines[0].startsWith("#")) {
    result.header.name = lines[0].replace(/\*\*/g, "");
    if (lines.length > 1 && !lines[1].startsWith("#")) {
      result.header.contact = lines[1].split("|").map(s => s.trim()).filter(Boolean);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Detect section headers
    if (line.match(/^#+\s/)) {
      const sectionName = line.replace(/^#+\s/, "").toLowerCase();
      if (sectionName.includes("summary") || sectionName.includes("profile")) currentSection = "summary";
      else if (sectionName.includes("experience") || sectionName.includes("employment")) currentSection = "experience";
      else if (sectionName.includes("education") || sectionName.includes("academic")) currentSection = "education";
      else if (sectionName.includes("skill")) currentSection = "skills";
      else if (sectionName.includes("project")) currentSection = "projects";
      else currentSection = "unknown";
      currentItem = null;
      continue;
    }

    if (currentSection === "summary") {
      result.summary += (result.summary ? "\n" : "") + line;
    } else if (currentSection === "experience") {
      if (line.startsWith("###") || (line.startsWith("**") && !line.startsWith("**•"))) {
        // New experience item
        const raw = line.replace(/#/g, "").trim();
        const parts = raw.split("|").map(s => s.trim());
        let title = parts[0]?.replace(/\*\*/g, "").trim() || "";
        let company = parts[1]?.replace(/\*\*/g, "").trim() || "";
        let date = parts[2]?.replace(/\*\*/g, "").trim() || "";
        
        // Sometimes it's Title - Company
        if (!company && title.includes(" - ")) {
           const spl = title.split(" - ");
           title = spl[0].trim();
           company = spl[1].trim();
        }

        currentItem = { title, company, date, bullets: [] };
        result.experience.push(currentItem);
      } else if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•")) {
        if (currentItem) {
          currentItem.bullets.push(line.replace(/^[-*•]\s*/, "").trim());
        }
      } else if (currentItem && !line.startsWith("**")) {
         // Some descriptive text
         currentItem.bullets.push(line.trim());
      }
    } else if (currentSection === "education") {
      if (line.startsWith("###") || (line.startsWith("**") && !line.startsWith("**•"))) {
        const raw = line.replace(/#/g, "").trim();
        const parts = raw.split("|").map(s => s.trim());
        let degree = parts[0]?.replace(/\*\*/g, "").trim() || "";
        let institution = parts[1]?.replace(/\*\*/g, "").trim() || "";
        let date = parts[2]?.replace(/\*\*/g, "").trim() || "";
        
        currentItem = { degree, institution, date, details: "" };
        result.education.push(currentItem);
      } else if (currentItem) {
        currentItem.details += (currentItem.details ? " " : "") + line.replace(/^[-*•]\s*/, "");
      }
    } else if (currentSection === "skills") {
      if (line.includes(":")) {
         const [cat, itemsRaw] = line.split(":", 2);
         const items = itemsRaw.split(",").map(s => s.trim().replace(/\*\*/g, "")).filter(Boolean);
         result.skills.push({ category: cat.replace(/[-*•#]/g, "").trim().replace(/\*\*/g, ""), items });
      } else if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•")) {
         // Generic skill list without categories
         if (result.skills.length === 0) result.skills.push({ category: "Core", items: [] });
         result.skills[0].items.push(line.replace(/^[-*•]\s*/, "").trim().replace(/\*\*/g, ""));
      } else {
         if (result.skills.length === 0) result.skills.push({ category: "Core", items: [] });
         result.skills[0].items.push(...line.split(",").map(s => s.trim()).filter(Boolean));
      }
    } else if (currentSection === "projects") {
      if (line.startsWith("###") || (line.startsWith("**") && !line.startsWith("**•"))) {
        currentItem = { name: line.replace(/#/g, "").replace(/\*\*/g, "").trim(), details: "", bullets: [] };
        result.projects.push(currentItem);
      } else if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•")) {
        if (currentItem) currentItem.bullets.push(line.replace(/^[-*•]\s*/, "").trim());
      } else if (currentItem) {
        currentItem.details += (currentItem.details ? " " : "") + line;
      }
    }
  }

  return result;
}
