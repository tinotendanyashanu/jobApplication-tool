"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ExperienceItem, Preferences, UserProfile } from "@/types/profile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { defaultProfile } from "@/lib/defaults";

export type ProfileFormProps = {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
};

function parseSkills(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function skillsRaw(profile: UserProfile): string {
  const skills = profile.skills || [];
  return skills
    .map((s) => (typeof s === "string" ? s : s.name))
    .join(", ");
}

function serializeLanguages(profile: UserProfile): string {
  const langs = profile.languages || [];
  return langs
    .map((l) =>
      (l.proficiency || "").trim()
        ? `${l.language} — ${l.proficiency}`
        : l.language
    )
    .join("\n");
}

function parseLanguages(raw: string): UserProfile["languages"] {
  return raw
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = /\s[—\-]\s/;
      const parts = line.split(sep);
      if (parts.length > 1) {
        return {
          language: parts[0].trim(),
          proficiency: parts.slice(1).join(" — ").trim(),
        };
      }
      return { language: line.trim(), proficiency: "" };
    });
}

export function ProfileForm({ profile, onChange }: ProfileFormProps) {
  const [jsonPaste, setJsonPaste] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const experience = profile.experience?.length ? profile.experience : [];

  const edu = profile.education?.[0] ?? {
    degree: "",
    institution: "",
    year: "",
  };

  const setPiece = <K extends keyof UserProfile>(
    key: K,
    val: UserProfile[K]
  ) => onChange({ ...profile, [key]: val });

  function mergePreferences(patch: Partial<Preferences>) {
    setPiece("preferences", {
      target_roles: profile.preferences?.target_roles ?? [],
      industries: profile.preferences?.industries ?? [],
      salary_expectation: profile.preferences?.salary_expectation ?? "",
      availability: profile.preferences?.availability ?? "",
      ...(profile.preferences ?? {}),
      ...patch,
    });
  }

  function setExperienceRows(rows: ExperienceItem[]) {
    setPiece("experience", rows);
  }

  function updateRole(idx: number, patch: Partial<ExperienceItem>) {
    const rows = [...experience];
    rows[idx] = { ...(rows[idx] ?? { title: "" }), ...patch };
    setExperienceRows(rows);
  }

  function mergeJsonProfile(next: Partial<UserProfile>) {
    onChange({ ...defaultProfile(), ...profile, ...next });
  }

  function applyImportedJson(raw: string) {
    try {
      const obj = JSON.parse(raw) as UserProfile;
      mergeJsonProfile(obj);
      setJsonError(null);
    } catch {
      setJsonError("Could not parse JSON. Check commas and quoting.");
    }
  }

  return (
    <Card className="border-border/80 shadow-xs transition-[box-shadow,border-color] duration-150 hover:border-foreground/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Profile
        </CardTitle>
        <CardDescription>
          Facts you enter here constrain the drafts—everything should be truthful and verifiable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="form" className="gap-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="json">JSON paste / upload</TabsTrigger>
          </TabsList>
          <TabsContent
            value="form"
            className="space-y-8 duration-150 animate-in fade-in-0"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input
                  placeholder="Ada Lovelace"
                  value={profile.full_name ?? ""}
                  onChange={(e) => setPiece("full_name", e.target.value)}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={profile.email ?? ""}
                  onChange={(e) => setPiece("email", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input
                  placeholder="+48 …"
                  value={profile.phone ?? ""}
                  onChange={(e) => setPiece("phone", e.target.value)}
                />
              </Field>
              <Field label="Location">
                <Input
                  placeholder="Warsaw · hybrid"
                  value={profile.location ?? ""}
                  onChange={(e) => setPiece("location", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Professional summary">
              <Textarea
                rows={4}
                placeholder="What you optimize for and the scope you reliably own."
                value={profile.summary ?? ""}
                onChange={(e) => setPiece("summary", e.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="LinkedIn URL">
                <Input
                  placeholder="https://..."
                  value={profile.links?.[0]?.url ?? ""}
                  onChange={(e) =>
                    setPiece("links", [
                      { label: "LinkedIn", url: e.target.value },
                      ...(profile.links?.slice(1) ?? []).filter(Boolean),
                    ])
                  }
                />
              </Field>
              <Field label="Portfolio / GitHub (optional)">
                <Input
                  placeholder="https://..."
                  value={profile.links?.[1]?.url ?? ""}
                  onChange={(e) => {
                    const first = profile.links?.[0] ?? {
                      label: "LinkedIn",
                      url: "",
                    };
                    const second = e.target.value
                      ? [{ label: "Website", url: e.target.value }]
                      : [];
                    setPiece("links", [first, ...second]);
                  }}
                />
              </Field>
            </div>

            <SectionTitle>Skills</SectionTitle>
            <Field label="Comma-separated skills">
              <Input
                placeholder="Python, PostgreSQL, FastAPI, …"
                value={skillsRaw(profile)}
                onChange={(e) =>
                  setPiece("skills", parseSkills(e.target.value))
                }
              />
            </Field>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <SectionTitle>Experience</SectionTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setExperienceRows([
                    ...experience,
                    { title: "", company: "", highlights: [] },
                  ])
                }
              >
                <Plus />
                Role
              </Button>
            </div>
            <div className="space-y-4">
              {experience.length === 0 ? (
                <div className="rounded-xl border border-dashed border-muted-foreground/25 p-6 text-center text-sm text-muted-foreground">
                  <p className="mb-4">No roles yet.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setExperienceRows([
                        { title: "", company: "", highlights: [] },
                      ])
                    }
                  >
                    Add your first role
                  </Button>
                </div>
              ) : null}
              {experience.map((role, idx) => (
                <div
                  key={idx}
                  className="space-y-3 rounded-xl border border-border/70 bg-muted/25 p-4 transition-colors hover:bg-muted/35"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Role {idx + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground"
                      aria-label={`Remove role ${idx + 1}`}
                      disabled={experience.length <= 1}
                      onClick={() =>
                        setExperienceRows(
                          experience.filter((_, rowIdx) => rowIdx !== idx)
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Title">
                      <Input
                        value={role.title}
                        placeholder="Senior Backend Engineer"
                        onChange={(e) =>
                          updateRole(idx, { title: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Company">
                      <Input
                        value={role.company ?? ""}
                        placeholder="Company"
                        onChange={(e) =>
                          updateRole(idx, { company: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Started">
                      <Input
                        placeholder="YYYY-MM"
                        value={role.start ?? ""}
                        onChange={(e) =>
                          updateRole(idx, { start: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Ended">
                      <Input
                        placeholder="present"
                        value={role.end ?? ""}
                        onChange={(e) => updateRole(idx, { end: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field label="Impact bullets — one line each">
                    <Textarea
                      rows={5}
                      placeholder={"Cut infra spend 18%\nScaled throughput 4x"}
                      value={(role.highlights || []).join("\n")}
                      onChange={(e) =>
                        updateRole(idx, {
                          highlights: e.target.value
                            .split("\n")
                            .map((l) => l.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </Field>
                </div>
              ))}
            </div>

            <SectionTitle>Education</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Degree">
                <Input
                  value={edu.degree}
                  onChange={(e) =>
                    setPiece("education", [
                      { ...edu, degree: e.target.value },
                    ])
                  }
                />
              </Field>
              <Field label="School">
                <Input
                  value={edu.institution ?? ""}
                  onChange={(e) =>
                    setPiece("education", [
                      { ...edu, institution: e.target.value },
                    ])
                  }
                />
              </Field>
              <Field label="Year">
                <Input
                  value={edu.year ?? ""}
                  placeholder="2020"
                  onChange={(e) =>
                    setPiece("education", [{ ...edu, year: e.target.value }])
                  }
                />
              </Field>
            </div>

            <Field label="Languages (optional — one line each, proficiency after em-dash)">
              <Textarea
                rows={3}
                placeholder={"English — C1\nPolish — Native"}
                value={serializeLanguages(profile)}
                onChange={(e) =>
                  setPiece("languages", parseLanguages(e.target.value))
                }
              />
            </Field>

            <SectionTitle>Letter preferences</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Salary expectations (shown only when non-empty)">
                <Input
                  value={profile.preferences?.salary_expectation ?? ""}
                  onChange={(e) =>
                    mergePreferences({ salary_expectation: e.target.value })
                  }
                />
              </Field>
              <Field label="Availability">
                <Input
                  placeholder="4 weeks notice"
                  value={profile.preferences?.availability ?? ""}
                  onChange={(e) =>
                    mergePreferences({ availability: e.target.value })
                  }
                />
              </Field>
            </div>
          </TabsContent>
          <TabsContent
            value="json"
            className="space-y-4 duration-150 animate-in fade-in-0"
          >
            <p className="text-sm text-muted-foreground">
              Paste JSON matching{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                examples/profile.example.json
              </code>{" "}
              from the repository.
            </p>
            <Label className="sr-only">Profile JSON</Label>
            <Textarea
              rows={14}
              className="font-mono text-xs"
              placeholder='{ "full_name": "...", ... }'
              value={jsonPaste}
              onChange={(e) => setJsonPaste(e.target.value)}
            />
            {jsonError ? (
              <Alert variant="destructive">
                <AlertTitle>Invalid JSON</AlertTitle>
                <AlertDescription>{jsonError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => applyImportedJson(jsonPaste)}>
                Merge into workspace
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "application/json,.json";
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    void file.text().then((t) => {
                      setJsonPaste(t);
                      applyImportedJson(t);
                    });
                  };
                  input.click();
                }}
              >
                Upload .json file
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() =>
                  setJsonPaste(JSON.stringify(profile, null, 2))
                }
              >
                Export workspace into box
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Field(props: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{props.label}</Label>
      {props.children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[0.8125rem] font-semibold uppercase tracking-wide text-foreground">
      {children}
    </h3>
  );
}
