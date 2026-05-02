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

const SECTION_PATTERNS: [RegExp, string][] = [
  [/summary|profile|objective|about/i, "summary"],
  [/experience|employment|work history/i, "experience"],
  [/education|academic|qualification/i, "education"],
  [/skill/i, "skills"],
  [/project/i, "projects"],
];

function detectSection(text: string): string | null {
  for (const [pattern, name] of SECTION_PATTERNS) {
    if (pattern.test(text)) return name;
  }
  return null;
}

function stripMarkup(text: string): string {
  return text.replace(/\*\*/g, "").replace(/^#+\s*/, "").trim();
}

function isContactItem(s: string): boolean {
  return (
    s.includes("@") ||
    /[\+\d][\d\s\-\(\)]{5,}/.test(s) ||
    /^https?:\/\//.test(s) ||
    /linkedin\.com|github\.com|gitlab\.com/.test(s) ||
    /\.(io|com|net|org|dev|me|co)\b/.test(s) ||
    /^[A-Z][a-z]+,\s[A-Z]/.test(s) // "London, UK" style location
  );
}

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const isH1 = /^#\s/.test(line);
    const isH2 = /^##\s/.test(line);
    const isH3 = /^###\s/.test(line);

    // H1 = candidate name
    if (isH1) {
      result.header.name = stripMarkup(line);
      currentSection = "header";
      currentItem = null;
      continue;
    }

    // H2 = section heading
    if (isH2) {
      const sectionName = detectSection(stripMarkup(line));
      if (sectionName) {
        currentSection = sectionName;
      } else {
        currentSection = "unknown";
      }
      currentItem = null;
      continue;
    }

    // H3 = sub-item within the current section (job, degree, project)
    if (isH3) {
      const raw = stripMarkup(line);
      if (currentSection === "experience") {
        currentItem = parseExperienceLine(raw);
        result.experience.push(currentItem);
      } else if (currentSection === "education") {
        currentItem = parseEducationLine(raw);
        result.education.push(currentItem);
      } else if (currentSection === "projects") {
        currentItem = { name: raw, details: "", bullets: [] };
        result.projects.push(currentItem);
      }
      continue;
    }

    // Header section: collect name (if not yet from H1) and contact line
    if (currentSection === "header") {
      if (!result.header.name) {
        result.header.name = stripMarkup(line);
      } else {
        // Contact line — pipe-separated or just detect individual items
        const parts = line.split("|").map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) {
          result.header.contact.push(...parts);
        } else if (isContactItem(line)) {
          result.header.contact.push(line);
        }
      }
      continue;
    }

    if (currentSection === "summary") {
      result.summary += (result.summary ? "\n" : "") + line;
      continue;
    }

    if (currentSection === "experience") {
      if (isBullet(line)) {
        if (currentItem) currentItem.bullets.push(stripBullet(line));
      } else if (looksLikeJobHeader(line)) {
        // Bold header format: **Title | Company | Date**
        currentItem = parseExperienceLine(stripMarkup(line));
        result.experience.push(currentItem);
      } else if (currentItem) {
        // Could be date/company on a separate line
        const clean = stripMarkup(line);
        if (!currentItem.date && looksLikeDate(clean)) {
          currentItem.date = clean;
        } else if (!currentItem.company && !looksLikeDate(clean)) {
          currentItem.company = clean;
        } else {
          currentItem.bullets.push(clean);
        }
      }
      continue;
    }

    if (currentSection === "education") {
      if (looksLikeJobHeader(line)) {
        currentItem = parseEducationLine(stripMarkup(line));
        result.education.push(currentItem);
      } else if (currentItem) {
        const clean = stripMarkup(line);
        if (!currentItem.date && looksLikeDate(clean)) {
          currentItem.date = clean;
        } else if (!currentItem.institution && !looksLikeDate(clean) && !isBullet(line)) {
          currentItem.institution = clean;
        } else {
          currentItem.details += (currentItem.details ? " " : "") + stripBullet(line);
        }
      }
      continue;
    }

    if (currentSection === "skills") {
      if (line.includes(":")) {
        const colonIdx = line.indexOf(":");
        const cat = line.slice(0, colonIdx).replace(/[-*•#]/g, "").replace(/\*\*/g, "").trim();
        const itemsRaw = line.slice(colonIdx + 1);
        const items = itemsRaw.split(",").map(s => s.trim().replace(/\*\*/g, "")).filter(Boolean);
        if (items.length > 0) {
          result.skills.push({ category: cat, items });
        }
      } else if (isBullet(line)) {
        if (result.skills.length === 0) result.skills.push({ category: "Core", items: [] });
        result.skills[result.skills.length - 1].items.push(stripBullet(line).replace(/\*\*/g, ""));
      } else {
        const items = line.split(",").map(s => s.trim().replace(/\*\*/g, "")).filter(Boolean);
        if (items.length > 1) {
          if (result.skills.length === 0) result.skills.push({ category: "Core", items: [] });
          result.skills[result.skills.length - 1].items.push(...items);
        }
      }
      continue;
    }

    if (currentSection === "projects") {
      if (isBullet(line)) {
        if (currentItem) currentItem.bullets.push(stripBullet(line));
      } else if (looksLikeJobHeader(line)) {
        currentItem = { name: stripMarkup(line), details: "", bullets: [] };
        result.projects.push(currentItem);
      } else if (currentItem) {
        currentItem.details += (currentItem.details ? " " : "") + stripMarkup(line);
      }
      continue;
    }
  }

  return result;
}

function isBullet(line: string): boolean {
  return /^[-*•]/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^[-*•]\s*/, "").trim();
}

function looksLikeJobHeader(line: string): boolean {
  return line.startsWith("**") && line.endsWith("**") && !line.startsWith("**•") && !line.startsWith("**-");
}

function looksLikeDate(s: string): boolean {
  return /\d{4}/.test(s) || /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(s) || /present/i.test(s);
}

function parseExperienceLine(raw: string): { title: string; company: string; date: string; bullets: string[] } {
  const parts = raw.split("|").map(s => s.trim());
  let title = parts[0] || "";
  let company = parts[1] || "";
  let date = parts[2] || "";

  if (!company && title.includes(" – ")) {
    const spl = title.split(" – ");
    title = spl[0].trim();
    date = spl[1].trim();
  }
  if (!company && title.includes(" - ")) {
    const spl = title.split(" - ");
    title = spl[0].trim();
    company = spl[1]?.trim() || "";
    date = spl[2]?.trim() || "";
  }
  if (!company && title.includes(" @ ")) {
    const spl = title.split(" @ ");
    title = spl[0].trim();
    company = spl[1]?.trim() || "";
  }

  return { title, company, date, bullets: [] };
}

function parseEducationLine(raw: string): { degree: string; institution: string; date: string; details: string } {
  const parts = raw.split("|").map(s => s.trim());
  let degree = parts[0] || "";
  let institution = parts[1] || "";
  let date = parts[2] || "";

  if (!institution && degree.includes(" - ")) {
    const spl = degree.split(" - ");
    degree = spl[0].trim();
    institution = spl[1]?.trim() || "";
  }
  if (!institution && degree.includes(" @ ")) {
    const spl = degree.split(" @ ");
    degree = spl[0].trim();
    institution = spl[1]?.trim() || "";
  }

  return { degree, institution, date, details: "" };
}
