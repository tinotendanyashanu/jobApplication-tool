import React, { useState, useEffect } from "react";
import { ParsedCV } from "@/lib/parse-cv";
import { Edit2, Check, X } from "lucide-react";
import { TemplateProps } from "./index";

function ContactEntry({ value }: { value: string }) {
  const isUrl = value.startsWith("http") || value.includes("linkedin.com") || value.includes("github.com") || value.includes("gitlab.com");
  const href = isUrl ? (value.startsWith("http") ? value : `https://${value}`) : null;
  const display = value.replace(/^https?:\/\/(www\.)?/, "");
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gray-900">{display}</a>;
  }
  return <span>{value}</span>;
}

export function TemplateMinimalist({ data, onUpdateHeader }: TemplateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.header.name || "");
  const [editContact, setEditContact] = useState(data.header.contact.join(" | "));

  useEffect(() => {
    setEditName(data.header.name || "");
    setEditContact(data.header.contact.join(" | "));
  }, [data.header]);

  function handleSave() {
    setIsEditing(false);
    if (onUpdateHeader) {
      onUpdateHeader(editName, editContact.split("|").map(s => s.trim()).filter(Boolean));
    }
  }

  function handleCancel() {
    setIsEditing(false);
    setEditName(data.header.name || "");
    setEditContact(data.header.contact.join(" | "));
  }

  return (
    <div className="w-full bg-white text-gray-900 font-serif shadow-lg mx-auto p-10" style={{ aspectRatio: "1 / 1.414", minHeight: "800px" }}>
      {/* Header Area */}
      <div className="border-b-2 border-gray-900 pb-4 mb-6 relative group">
        {onUpdateHeader && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute right-0 top-0 p-1.5 text-gray-400 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-gray-100"
            title="Edit header"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        
        {isEditing ? (
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block text-center">Full Name</label>
              <input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full text-center text-4xl font-normal tracking-tight bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:border-gray-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block text-center">Contact Info (separated by |)</label>
              <input 
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
                className="w-full text-center text-xs text-gray-600 bg-white border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-gray-500"
              />
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={handleSave} className="flex items-center gap-1 text-xs bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded font-medium transition-colors">
                <Check className="w-3 h-3" /> Save
              </button>
              <button onClick={handleCancel} className="flex items-center gap-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded font-medium transition-colors">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-normal tracking-tight mb-2 text-center">{data.header.name || "Your Name"}</h1>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-600">
              {data.header.contact.map((c, i) => (
                <React.Fragment key={i}>
                  <ContactEntry value={c} />
                  {i < data.header.contact.length - 1 && <span>•</span>}
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-6">
        {data.summary && (
          <section className="break-inside-avoid">
            <p className="text-sm leading-relaxed text-gray-700 text-justify">{data.summary}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section>
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-1 mb-3 uppercase tracking-widest">Experience</h2>
            <div className="space-y-4">
              {data.experience.map((exp, i) => (
                <div key={i} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-semibold text-gray-800 text-sm">{exp.title}</h3>
                    <span className="text-xs text-gray-500">{exp.date}</span>
                  </div>
                  <div className="text-xs text-gray-600 italic mb-2">{exp.company}</div>
                  <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-gray-700">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="pl-1 leading-relaxed text-justify">{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education.length > 0 && (
          <section>
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-1 mb-3 uppercase tracking-widest">Education</h2>
            <div className="space-y-3">
              {data.education.map((edu, i) => (
                <div key={i} className="flex justify-between items-baseline break-inside-avoid">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{edu.degree}</h3>
                    <div className="text-xs text-gray-600">{edu.institution} {edu.details && `- ${edu.details}`}</div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{edu.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.skills.length > 0 && (
          <section>
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-1 mb-3 uppercase tracking-widest">Skills</h2>
            <div className="space-y-2">
              {data.skills.map((skillGroup, i) => (
                <div key={i} className="text-sm break-inside-avoid">
                  <span className="font-semibold text-gray-800 mr-2">{skillGroup.category}:</span>
                  <span className="text-gray-700">{skillGroup.items.join(", ")}</span>
                </div>
              ))}
            </div>
          </section>
        )}

         {data.projects.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-1 mb-3 uppercase tracking-widest">Projects</h2>
              <div className="space-y-4">
                {data.projects.map((proj, i) => (
                  <div key={i} className="break-inside-avoid">
                    <div className="flex items-baseline gap-2 mb-1">
                       <h3 className="font-semibold text-gray-800 text-sm">{proj.name}</h3>
                    </div>
                    {proj.details && <p className="text-xs text-gray-600 mb-1">{proj.details}</p>}
                    <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-gray-700">
                      {proj.bullets.map((b, j) => (
                        <li key={j} className="pl-1 leading-relaxed text-justify">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

      </div>
    </div>
  );
}
