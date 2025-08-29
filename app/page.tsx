'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * app/page.tsx — Full portfolio page (TypeScript-safe)
 * - Hero updated: "Software Engineering Student | AI‑Assisted Developer"
 * - Profile picture from /public/profile.jpg
 * - CV button uses /FAZALRAHEEM_CV.pdf
 * - Admin modal with Invoice/Quotation PDF (jspdf) + robust try/catch
 * - Minimal self-tests to sanity check UI
 */

// ===== Types =====
type TestResult = { name: string; pass: boolean; error?: string };

type UserRecord = {
  pass: string;
  contact: { name: string; phone: string; email: string };
};

type Users = Record<string, UserRecord>;

// ===== Small UI bits =====
function SectionTitle({ kicker = 'Section', title, desc }: { kicker?: string; title: string; desc?: string }) {
  return (
    <div className="text-center mb-12">
      <p className="text-secondary/80 tracking-widest uppercase text-xs">{kicker}</p>
      <h2 className="text-3xl md:text-4xl font-extrabold mt-2">{title}</h2>
      {desc ? <p className="text-white/70 mt-3 max-w-2xl mx-auto">{desc}</p> : null}
    </div>
  );
}

function SkillBadge({ label }: { label: string }) {
  return <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm">{label}</span>;
}

function TimelineItem({ title, org, time, points = [] }: { title: string; org: string; time: string; points?: string[] }) {
  return (
    <div className="relative pl-8">
      <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-secondary" />
      <h4 className="font-semibold">{title}</h4>
      <p className="text-white/70 text-sm">
        {org} • {time}
      </p>
      <ul className="list-disc list-outside ml-4 mt-2 text-white/80 space-y-1">
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

function ProjectCard({ title, tag, desc, bullets = [], cta, href }: { title: string; tag: string; desc: string; bullets?: string[]; cta?: string; href?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="card h-full flex flex-col">
      <div className="text-xs uppercase tracking-widest text-secondary/80">{tag}</div>
      <h3 className="text-xl font-bold mt-1">{title}</h3>
      <p className="text-white/70 mt-2">{desc}</p>
      <ul className="mt-3 text-white/80 space-y-1 list-disc ml-5">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <div className="mt-auto pt-4">{href ? <a href={href} className="btn-outline">{cta || 'View Project'}</a> : null}</div>
    </motion.div>
  );
}

// ===== Admin Modal (with PDF) =====
const USERS: Users = {
  jamshed: { pass: 'jimmy@123', contact: { name: 'Jamshed', phone: '+92 3xx xxxxxxx', email: 'jamshed@example.com' } },
  saqib: { pass: 'saqib@123', contact: { name: 'Saqib', phone: '+92 3xx xxxxxxx', email: 'saqib@example.com' } }
};

function AdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [cred, setCred] = useState<{ u: string; p: string }>({ u: '', p: '' });

  const [docType, setDocType] = useState<'Invoice' | 'Quotation'>('Invoice');
  const [to, setTo] = useState<{ name: string; phone: string; email: string; address: string }>({ name: '', phone: '', email: '', address: '' });
  const [items, setItems] = useState<Array<{ desc: string; qty: number; price: number }>>([{ desc: '', qty: 1, price: 0 }]);

  const subtotal = useMemo(() => items.reduce((s, it) => s + ((Number(it.qty) || 0) * (Number(it.price) || 0)), 0), [items]);
  const tax = useMemo(() => Math.round(subtotal * 0.0), [subtotal]);
  const total = subtotal + tax;

  if (!open) return null;

  function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const rec = USERS[(cred.u || '').trim().toLowerCase()];
    if (rec && rec.pass === cred.p) setUser(rec);
    else alert('Invalid credentials');
  }

  function addItem() {
    setItems((s) => [...s, { desc: '', qty: 1, price: 0 }]);
  }

  async function genPDF() {
    try {
      const mod = await import('jspdf');
      const doc = new mod.jsPDF({ unit: 'pt', format: 'a4' });

      // Watermark
      doc.setFontSize(60);
      doc.setTextColor(230);
      // @ts-expect-error angle is allowed at runtime
      doc.text('FAZAL RAHEEM', 70, 400, { angle: 30 });

      // Header
      doc.setTextColor(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(docType, 40, 60);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      ['Fazal Raheem — Software Engineering Student', 'AI‑Assisted Developer', 'Lahore, Pakistan', 'Email: fazalraheem508@gmail.com'].forEach((t, i) => doc.text(t, 40, 90 + i * 16));

      if (user) {
        doc.setFont('helvetica', 'bold');
        doc.text('Issued By:', 380, 60);
        doc.setFont('helvetica', 'normal');
        doc.text(user.contact.name, 380, 78);
        doc.text(user.contact.phone, 380, 94);
        doc.text(user.contact.email, 380, 110);
      }

      // Bill To
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 40, 160);
      doc.setFont('helvetica', 'normal');
      [to.name, to.phone, to.email, to.address].filter(Boolean).forEach((t, i) => doc.text(String(t), 40, 178 + i * 16));

      // Items
      const startY = 240;
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 40, startY);
      doc.text('Qty', 360, startY);
      doc.text('Price', 420, startY);
      doc.text('Amount', 500, startY);

      doc.setFont('helvetica', 'normal');
      let y = startY + 18;
      items.forEach((it, idx) => {
        const amount = (Number(it.qty) || 0) * (Number(it.price) || 0);
        doc.text(String(it.desc || `Item ${idx + 1}`), 40, y);
        doc.text(String(it.qty || 0), 360, y);
        doc.text(String(it.price || 0), 420, y);
        doc.text(String(amount.toFixed(2)), 500, y);
        y += 18;
      });

      // Totals
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Subtotal:', 420, y);
      doc.text(String(subtotal.toFixed(2)), 500, y);
      doc.setFont('helvetica', 'normal');
      y += 16;
      doc.text('Tax:', 420, y);
      doc.text(String(tax.toFixed(2)), 500, y);
      doc.setFont('helvetica', 'bold');
      y += 16;
      doc.text('Total:', 420, y);
      doc.text(String(total.toFixed(2)), 500, y);

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Thank you!', 40, 790);

      doc.save(`${docType.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('genPDF error:', err);
      alert("jspdf is not installed. Run: npm i jspdf");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl card relative">
        <button className="absolute right-3 top-3 btn-outline px-3 py-1" onClick={onClose}>
          Close
        </button>
        {!user ? (
          <div>
            <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
            <form onSubmit={login} className="space-y-3">
              <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Username" value={cred.u} onChange={(e) => setCred((v) => ({ ...v, u: e.target.value }))} />
              <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Password" type="password" value={cred.p} onChange={(e) => setCred((v) => ({ ...v, p: e.target.value }))} />
              <button className="btn-primary w-full" type="submit">
                Login
              </button>
              <p className="text-white/60 text-xs mt-1">Users: jamshed/jimmy@123 • saqib/saqib@123</p>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-bold">{docType} Builder</h1>
              <div className="flex gap-2">
                <button className={`px-3 py-2 rounded-xl border ${docType === 'Invoice' ? 'bg-white/10' : ''}`} onClick={() => setDocType('Invoice')}>
                  Invoice
                </button>
                <button className={`px-3 py-2 rounded-xl border ${docType === 'Quotation' ? 'bg-white/10' : ''}`} onClick={() => setDocType('Quotation')}>
                  Quotation
                </button>
              </div>
            </div>
            <p className="text-white/60 mt-1">
              Logged in as <b>{user.contact.name}</b>
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="card">
                <h3 className="font-semibold text-lg mb-3">Bill To</h3>
                <div className="space-y-3">
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Name" value={to.name} onChange={(e) => setTo({ ...to, name: e.target.value })} />
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Phone" value={to.phone} onChange={(e) => setTo({ ...to, phone: e.target.value })} />
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Email" value={to.email} onChange={(e) => setTo({ ...to, email: e.target.value })} />
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Address" value={to.address} onChange={(e) => setTo({ ...to, address: e.target.value })} />
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-lg mb-3">Items</h3>
                <div className="space-y-3">
                  {items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2">
                      <input className="col-span-6 bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Description" value={it.desc} onChange={(e) => setItems((prev) => prev.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))} />
                      <input className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Qty" type="number" value={it.qty} onChange={(e) => setItems((prev) => prev.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} />
                      <input className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Price" type="number" value={it.price} onChange={(e) => setItems((prev) => prev.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))} />
                      <div className="col-span-2 flex items-center justify-end">
                        <button className="px-3 py-2 rounded-xl border" onClick={addItem}>
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-white/80">
                    <div>
                      Subtotal: <b>{subtotal.toFixed(2)}</b>
                    </div>
                    <div>
                      Tax: <b>{tax.toFixed(2)}</b>
                    </div>
                    <div>
                      Total: <b>{total.toFixed(2)}</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="btn-primary" onClick={genPDF}>
                Generate {docType} PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Navbar =====
function Navbar({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  return (
    <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="fixed top-0 left-0 right-0 z-50">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary" />
          <span className="font-bold text-lg">Fazal Raheem</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#projects" className="btn-outline">Projects</a>
          <a href="#contact" className="btn-outline">Contact</a>
          <button className="btn-outline" onClick={onOpenAdmin}>Admin</button>
          <a href="/FAZALRAHEEM_CV.pdf" className="btn-primary" download>Download CV</a>
        </div>
      </div>
    </motion.nav>
  );
}

const skills: Record<string, string[]> = {
  Web: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express', 'MongoDB'],
  Mobile: ['Kotlin', 'Android Studio', 'Flutter'],
  AI: ['ChatGPT', 'Claude', 'Gemini', 'AI-assisted Dev'],
  Embedded: ['Arduino', 'Sensors', 'Robotics'],
  Other: ['Video Editing (CapCut)', 'Content Optimization', 'Project Management']
};

function runSelfTests(): TestResult[] {
  const results: TestResult[] = [];
  try {
    results.push({ name: 'Hero heading renders', pass: !!document.querySelector('h1') });
    results.push({ name: 'Projects section anchor exists', pass: !!document.getElementById('projects') });
    results.push({ name: 'Contact section anchor exists', pass: !!document.getElementById('contact') });
    const hasAdminBtn = Array.from(document.querySelectorAll('button, a')).some((el) => el.textContent?.toLowerCase().includes('admin'));
    results.push({ name: 'Admin button exists', pass: hasAdminBtn });
  } catch (e) {
    results.push({ name: 'Self-tests crashed', pass: false, error: String(e) });
  }
  // eslint-disable-next-line no-console
  console.log('Self-tests:', results, `Passed ${results.filter((r) => r.pass).length}/${results.length}`);
  return results;
}

export default function PortfolioApp() {
  const [adminOpen, setAdminOpen] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    // Minimal global styles
    const style = document.createElement('style');
    style.innerHTML = `
      :root { --bg:#080c1a; --card:#0e1530; }
      html, body { background: radial-gradient(1200px 600px at 70% -10%, rgba(108,99,255,.15), transparent), radial-gradient(1200px 600px at -10% 10%, rgba(0,212,255,.15), transparent), var(--bg); color:#e9edf8; }
      .container { max-width: 72rem; margin:0 auto; padding:0 1rem; }
      .glass { background: linear-gradient(120deg, rgba(255,255,255,.06), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.08); backdrop-filter: blur(10px); }
      .btn-primary { display:inline-flex; align-items:center; gap:.5rem; border-radius: .75rem; padding:.75rem 1.25rem; font-weight:600; box-shadow: 0 10px 30px rgba(0,0,0,.15); background: linear-gradient(135deg, #6C63FF, #00D4FF); }
      .btn-outline { display:inline-flex; align-items:center; gap:.5rem; border-radius: .75rem; padding:.75rem 1.25rem; font-weight:600; border: 1px solid rgba(255,255,255,.2); }
      .section { padding: 5rem 0; }
      .card { border-radius: 1rem; padding: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,.15); background: linear-gradient(120deg, rgba(255,255,255,.06), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.08); }
    `;
    document.head.appendChild(style);
    const res = runSelfTests();
    setTestResults(res);
    return () => style.remove();
  }, []);

  return (
    <main>
      <Navbar onOpenAdmin={() => setAdminOpen(true)} />

      {/* HERO */}
      <section className="section pt-24">
        <div className="container grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="card flex items-center justify-center">
            <Image src="/profile.jpg" alt="Profile Picture" width={250} height={250} className="rounded-full border-4 border-white/20 shadow-lg object-cover" />
          </motion.div>
          <div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-3xl md:text-5xl font-black leading-tight">
              Hi, I’m <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Fazal</span>
              <br />
              Software Engineering Student | AI‑Assisted Developer
            </motion.h1>
            <p className="text-white/70 mt-5 max-w-xl">
              I design logic and solutions myself, and use AI tools (ChatGPT, Claude, Gemini) to assist with coding. This helps me build full‑stack web apps, Android apps, and Arduino projects efficiently.
            </p>
            <div className="mt-7 flex gap-3">
              <a href="#projects" className="btn-primary">View Projects</a>
              <a href="/FAZALRAHEEM_CV.pdf" className="btn-outline" download>Download CV</a>
            </div>
            <div className="mt-6 text-white/60 text-sm">
              Lahore, Pakistan • +92 302 1421472 • <a className="underline" href="mailto:fazalraheem508@gmail.com">fazalraheem508@gmail.com</a>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="section">
        <div className="container">
          <SectionTitle kicker="About" title="Who I Am" desc="I’m a student who builds logic and uses AI tools to accelerate coding and learning." />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="font-bold text-lg">Summary</h4>
              <p className="text-white/80 mt-2">
                I leverage AI tools for coding and productivity. I’ve built Android apps using Kotlin, created full‑stack web apps, and integrated hardware with software for automation using Arduino.
              </p>
            </div>
            <div className="card">
              <h4 className="font-bold text-lg">Highlights</h4>
              <ul className="list-disc ml-5 mt-2 space-y-1 text-white/80">
                <li>AI‑assisted development (ChatGPT, Claude, Gemini)</li>
                <li>Full‑stack web apps (Node.js/Express + MongoDB)</li>
                <li>Android (Kotlin) & Flutter (web)</li>
                <li>Arduino projects (gesture car, RFID lock, robots)</li>
                <li>Basic video editing for YouTube automation (CapCut)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section className="section">
        <div className="container">
          <SectionTitle kicker="Skills" title="What I Use" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(skills).map(([group, items]) => (
              <div key={group} className="card">
                <h4 className="font-semibold text-lg mb-3">{group}</h4>
                <div className="flex flex-wrap gap-2">
                  {items.map((s) => (
                    <SkillBadge key={s} label={s} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="section">
        <div className="container">
          <SectionTitle kicker="Experience" title="What I’ve Done" />
          <div className="card">
            <TimelineItem title="Video Editing — Freelance/Private Client" org="Lahore, Pakistan" time="Aug 2024 – Jan 2025" points={[
              'Edited and produced YouTube automation videos in the skincare niche using CapCut.',
              'Handled trimming, transitions, captions, music, and visual effects for engagement.',
              'Worked remotely and delivered on time to match branding and audience.'
            ]} />
          </div>
        </div>
      </section>

      {/* EDUCATION */}
      <section className="section">
        <div className="container">
          <SectionTitle kicker="Education" title="Where I Studied" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <h4 className="font-bold">BS Software Engineering</h4>
              <p className="text-white/70">University of Management & Technology, Lahore</p>
              <p className="text-white/60 text-sm mt-1">Jan 2023 – Present</p>
            </div>
            <div className="card">
              <h4 className="font-bold">ICS Physics</h4>
              <p className="text-white/70">Concordia Colleges, Lahore</p>
              <p className="text-white/60 text-sm mt-1">2021 – 2023</p>
            </div>
            <div className="card">
              <h4 className="font-bold">Matriculation</h4>
              <p className="text-white/70">Govt High School Karim Block, Lahore</p>
              <p className="text-white/60 text-sm mt-1">2019 – 2021</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="section">
        <div className="container">
          <SectionTitle kicker="Projects" title="Things I’ve Built" />
          <div className="grid md:grid-cols-2 gap-6">
            <ProjectCard title="Clothing E‑Commerce Website (Full‑Stack, Ongoing)" tag="Web / Full‑Stack" desc="Developing with AI‑assisted tools. Modern responsive frontend; backend (Node/Express + MongoDB) in progress." bullets={['Product pages', 'Interactive UI', 'Responsive design']} />
            <ProjectCard title="Status Saver App" tag="Android (Kotlin)" desc="Simple Android app to save WhatsApp statuses (images & videos) built in Android Studio with AI guidance." bullets={['Media access', 'Gallery view', 'Save/share']} />
            <ProjectCard title="Fusion X Gaming Store" tag="E‑Commerce (In Progress)" desc="Store for consoles & accessories (Xbox, PlayStation). Designing UI/UX and integrating backend with AI tools." bullets={['Product catalog', 'Cart flow', 'Modern UI']} />
            <ProjectCard title="Bill Challan Generator" tag="Flutter Web App" desc="Generates professional bill challans with PDF export and responsive UI." bullets={['Form inputs', 'PDF export', 'Responsive layout']} />
          </div>

          <div className="mt-8 card">
            <h3 className="text-xl font-bold">Arduino & Embedded Systems</h3>
            <ul className="list-disc ml-5 mt-2 text-white/80 space-y-1">
              <li>Hand Gesture Car – controlled with gesture sensors</li>
              <li>Robot Fight Car – competitive robotic car</li>
              <li>Bluetooth Car – wireless‑controlled vehicle</li>
              <li>RFID Door Lock System – secure access with RFID</li>
              <li>Plus multiple projects with sensors, automation, and robotics</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section pb-28">
        <div className="container">
          <SectionTitle kicker="Contact" title="Let’s Work Together" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <form action="mailto:fazalraheem508@gmail.com" method="post" encType="text/plain" className="space-y-4">
                <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Your Name" required />
                <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3" placeholder="Email" type="email" required />
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-3 h-32" placeholder="Message" required />
                <button className="btn-primary" type="submit">Send Message</button>
              </form>
            </div>
            <div className="card">
              <h4 className="font-semibold text-lg">Direct</h4>
              <p className="text-white/80 mt-2">Email: <a className="underline" href="mailto:fazalraheem508@gmail.com">fazalraheem508@gmail.com</a></p>
              <p className="text-white/80">Phone: +92 302 1421472</p>
              <p className="text-white/60 mt-2">I’m open to .NET / Web / Mobile roles and freelance work. I can also build free MVPs for small businesses to get started.</p>
              <div className="mt-4 flex gap-3 flex-wrap">
                <a className="btn-outline" href="https://www.linkedin.com/in/fazal-raheem-8865a329a/" target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
                <a className="btn-outline" href="https://wa.me/923021421472" target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
                <a className="btn-outline" href="https://www.instagram.com/fazal.raheem" target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </div>
            </div>
          </div>

          {/* Self-test summary */}
          {testResults?.length ? (
            <div className="mt-6 text-xs text-white/70">
              <div className="font-semibold">Self-tests</div>
              <ul className="list-disc ml-5">
                {testResults.map((t, i) => (
                  <li key={i}>{t.pass ? '✅' : '❌'} {t.name}{t.error ? ` — ${t.error}` : ''}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {/* Admin Modal */}
      <AdminModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </main>
  );
}
