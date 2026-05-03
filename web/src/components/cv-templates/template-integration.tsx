import React, { useState, useEffect } from "react";
import { ParsedCV } from "@/lib/parse-cv";
import { Mail, Phone, MapPin, Globe, Edit2, Check, X } from "lucide-react";
import { TemplateProps } from "./index";

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
    return <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors">{display}</a>;
  }
  return <span>{value}</span>;
}

export function TemplateIntegration({ data, onUpdateHeader }: TemplateProps) {
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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Poppins:wght@400;500;600;700&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Roboto:wght@400;500;700&display=swap');
        
        .cv-integration {
          font-family: 'Public Sans', sans-serif;
          background-color: #ffffff;
          position: relative;
          overflow: hidden;
        }
        
        .cv-integration h1, .cv-integration h2, .cv-integration h3 {
          font-family: 'Montserrat', sans-serif;
        }

        .cv-integration-skills h3 {
          font-family: 'Poppins', sans-serif;
        }
        
        .cv-integration p, .cv-integration li {
          font-family: 'Roboto', sans-serif;
        }
        
        /* Subtle Technical Watermarks */
        .cv-watermark {
          position: absolute;
          z-index: 0;
          opacity: 0.04;
          pointer-events: none;
        }
        
        @media print {
          .cv-integration {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
      <div className="cv-integration w-full shadow-lg mx-auto" style={{ aspectRatio: "1 / 1.414", minHeight: "800px" }}>
        
        {/* Background Watermarks */}
        <div className="cv-watermark top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500 blur-3xl"></div>
        <div className="cv-watermark bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-slate-800 blur-3xl"></div>
        <svg className="cv-watermark top-20 right-10 w-64 h-64 text-slate-800" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="30" />
          <path d="M 50 10 L 50 90 M 10 50 L 90 50 M 21 21 L 79 79 M 21 79 L 79 21" />
        </svg>

        {/* Content Container */}
        <div className="relative z-10 grid grid-cols-[1.8fr_1fr] h-full">
          
          {/* Left Column (Main) */}
          <div className="p-10 pr-8 bg-white/90 backdrop-blur-sm h-full flex flex-col gap-6">
            
            <header className="mb-2 relative group">
              {onUpdateHeader && !isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute -left-8 top-2 p-1.5 text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-teal-50"
                  title="Edit header"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              
              {isEditing ? (
                <div className="space-y-3 bg-white p-4 -ml-4 rounded-xl shadow-sm border border-teal-100">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Full Name</label>
                    <input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-[2rem] font-bold tracking-tight text-slate-800 leading-none uppercase bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-teal-400"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Contact Info (separated by |)</label>
                    <input 
                      value={editContact}
                      onChange={(e) => setEditContact(e.target.value)}
                      className="w-full text-[13px] text-slate-600 font-medium font-['Public_Sans'] bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-teal-400"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} className="flex items-center gap-1 text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded font-medium transition-colors">
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button onClick={handleCancel} className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded font-medium transition-colors">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-[2.5rem] font-bold tracking-tight text-slate-800 leading-none mb-4 uppercase">
                    {data.header.name || "YOUR NAME"}
                  </h1>
                  <div className="flex flex-col gap-2 text-[13px] text-slate-600 font-medium font-['Public_Sans']">
                    {data.header.contact.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-teal-600"><ContactIcon value={c} /></span>
                        <ContactLink value={c} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </header>

            {data.summary && (
              <section className="break-inside-avoid">
                <h2 className="text-[15px] font-bold text-slate-800 border-b-2 border-teal-500/30 pb-1 mb-3 uppercase tracking-wider">Summary</h2>
                <p className="text-[13px] leading-[1.6] text-slate-700 text-justify">{data.summary}</p>
              </section>
            )}

            {data.experience.length > 0 && (
              <section className="flex-1">
                <h2 className="text-[15px] font-bold text-slate-800 border-b-2 border-teal-500/30 pb-1 mb-4 uppercase tracking-wider">Work Experience</h2>
                <div className="space-y-5">
                  {data.experience.map((exp, i) => (
                    <div key={i} className="break-inside-avoid">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="font-semibold text-slate-800 text-[14px]">{exp.title}</h3>
                        <span className="text-[11px] text-teal-700 font-semibold uppercase tracking-wide whitespace-nowrap ml-4">{exp.date}</span>
                      </div>
                      <div className="text-[13px] text-slate-600 font-medium mb-2">{exp.company}</div>
                      <ul className="list-disc list-outside ml-4 space-y-1.5 text-[12.5px] text-slate-700">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="pl-1 leading-relaxed text-justify">{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column (Sidebar) */}
          <div className="p-10 pl-8 bg-slate-50/95 border-l border-slate-200/60 h-full flex flex-col gap-6">
            
            {data.education.length > 0 && (
              <section>
                <h2 className="text-[15px] font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-4 uppercase tracking-wider">Education</h2>
                <div className="space-y-4">
                  {data.education.map((edu, i) => (
                    <div key={i} className="break-inside-avoid">
                      <h3 className="font-semibold text-slate-800 text-[13px] leading-tight mb-1">{edu.degree}</h3>
                      <div className="text-[12px] text-slate-600 mb-1">{edu.institution}</div>
                      <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{edu.date}</div>
                      {edu.details && <p className="text-[11px] text-slate-500 mt-1 italic">{edu.details}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.skills.length > 0 && (
              <section className="cv-integration-skills">
                <h2 className="text-[15px] font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-4 uppercase tracking-wider">Skills</h2>
                <div className="space-y-4">
                  {data.skills.map((skillGroup, i) => (
                    <div key={i} className="break-inside-avoid">
                      <h3 className="text-[12px] font-semibold text-slate-800 mb-1.5">{skillGroup.category}</h3>
                      <div className="flex flex-col gap-1 text-[12px] text-slate-600 leading-snug">
                        {skillGroup.items.join(" • ")}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.projects.length > 0 && (
              <section>
                <h2 className="text-[15px] font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-4 uppercase tracking-wider">Projects</h2>
                <div className="space-y-4">
                  {data.projects.map((proj, i) => (
                    <div key={i} className="break-inside-avoid">
                      <h3 className="font-semibold text-slate-800 text-[13px] mb-1">{proj.name}</h3>
                      {proj.details && <p className="text-[11.5px] text-slate-500 mb-1.5 italic">{proj.details}</p>}
                      <ul className="list-disc list-outside ml-3.5 space-y-1 text-[11.5px] text-slate-600">
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
      </div>
    </>
  );
}
