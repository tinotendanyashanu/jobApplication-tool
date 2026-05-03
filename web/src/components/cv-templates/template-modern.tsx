import React from "react";
import { ParsedCV } from "@/lib/parse-cv";
import { Mail, Phone, MapPin, Globe } from "lucide-react";

function ContactIcon({ value }: { value: string }) {
  if (value.includes("@")) return <Mail className="size-3 shrink-0" />;
  if (/^[\+\d][\d\s\-\(\)]{5,}$/.test(value.trim())) return <Phone className="size-3 shrink-0" />;
  if (/^[A-Z]/.test(value) && !value.startsWith("http") && !value.includes(".")) return <MapPin className="size-3 shrink-0" />;
  return <Globe className="size-3 shrink-0" />;
}

function ContactLink({ value }: { value: string }) {
  const isUrl = value.startsWith("http") || value.includes("linkedin.com") || value.includes("github.com") || value.includes("gitlab.com");
  const href = isUrl ? (value.startsWith("http") ? value : `https://${value}`) : null;
  const display = value.replace(/^https?:\/\/(www\.)?/, "");
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-100">{display}</a>;
  }
  return <span>{value}</span>;
}

export function TemplateModern({ data }: { data: ParsedCV }) {
  return (
    <div className="w-full bg-white text-slate-800 font-sans shadow-lg mx-auto" style={{ aspectRatio: "1 / 1.414", minHeight: "800px" }}>
      {/* Header Area */}
      <div className="bg-slate-900 text-slate-100 p-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold tracking-tight uppercase text-white mb-2">{data.header.name || "YOUR NAME"}</h1>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-300">
          {data.header.contact.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              <ContactIcon value={c} />
              <ContactLink value={c} />
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3">
        {/* Main Body */}
        <div className="col-span-2 p-8 space-y-6">
          {data.summary && (
            <section className="break-inside-avoid">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3 uppercase tracking-widest">Summary</h2>
              <p className="text-sm leading-relaxed text-slate-600">{data.summary}</p>
            </section>
          )}

          {data.experience.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3 uppercase tracking-widest">Experience</h2>
              <div className="space-y-4">
                {data.experience.map((exp, i) => (
                  <div key={i} className="break-inside-avoid">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-slate-800 text-sm">{exp.title}</h3>
                      <span className="text-xs text-slate-500 font-medium">{exp.date}</span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium mb-2">{exp.company}</div>
                    <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-slate-600">
                      {exp.bullets.map((b, j) => (
                        <li key={j} className="pl-1 leading-relaxed">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3 uppercase tracking-widest">Education</h2>
              <div className="space-y-3">
                {data.education.map((edu, i) => (
                  <div key={i} className="break-inside-avoid">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-slate-800 text-sm">{edu.degree}</h3>
                      <span className="text-xs text-slate-500">{edu.date}</span>
                    </div>
                    <div className="text-xs text-slate-600">{edu.institution}</div>
                    {edu.details && <p className="text-xs text-slate-500 mt-1">{edu.details}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

           {data.projects.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3 uppercase tracking-widest">Projects</h2>
              <div className="space-y-3">
                {data.projects.map((proj, i) => (
                  <div key={i} className="break-inside-avoid">
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">{proj.name}</h3>
                    {proj.details && <p className="text-xs text-slate-600 mb-1">{proj.details}</p>}
                    <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-slate-600">
                      {proj.bullets.map((b, j) => (
                        <li key={j} className="pl-1 leading-relaxed">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="bg-slate-50 p-8 border-l border-slate-100">
          {data.skills.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3 uppercase tracking-widest">Skills</h2>
              <div className="space-y-4">
                {data.skills.map((skillGroup, i) => (
                  <div key={i} className="break-inside-avoid">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">{skillGroup.category}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {skillGroup.items.map((item, j) => (
                        <span key={j} className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-medium">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
