const SECTIONS = {
  about: {
    color: '#00ffcc',
    title: 'ABOUT',
    content: () => (
      <>
        <Row label="NAME"       value="Leon Meng" />
        <Row label="SCHOOL"     value="UC Irvine · CS · 2028" />
        <Row label="LOCATION"   value="Irvine, CA" />
        <Row label="FOCUS"      value="Software + Fashion Design" />
        <Divider />
        <p style={desc}>
          Building things at the intersection of technology and design.
          Currently working on projects that matter.
        </p>
      </>
    ),
  },
  projects: {
    color: '#ff0077',
    title: 'PROJECTS',
    content: () => (
      <>
        <Card num="P-001" title="GARDEROBE"  tech="React · Supabase · AI" color="#ff0077"
              body="AI-powered wardrobe + outfit assistant." />
        <Card num="P-002" title="THIS SITE"  tech="R3F · Three.js · GSAP" color="#ff0077"
              body="3D cyberpunk portfolio. You're standing in it." />
        <Card num="P-003" title="[REDACTED]" tech="——" color="#ff007744"
              body="Coming soon." />
      </>
    ),
  },
  resume: {
    color: '#ffcc00',
    title: 'RESUME',
    content: () => (
      <>
        <Row label="EDUCATION" value="UC Irvine · CS · 2028" />
        <Row label="SKILLS"    value="React · Python · Three.js" />
        <Row label="INTERESTS" value="Fashion · Design · Software" />
        <Divider />
        <a href="#" style={{ display: 'inline-block', border: '1px solid #ffcc0066', color: '#ffcc00', padding: '6px 16px', fontSize: 10, letterSpacing: '0.18em', textDecoration: 'none', cursor: 'pointer' }}>
          ▤ DOWNLOAD RESUME
        </a>
      </>
    ),
  },
  contact: {
    color: '#aa44ff',
    title: 'CONTACT',
    content: () => (
      <>
        <Row label="EMAIL"    value="leon@example.com" />
        <Row label="GITHUB"   value="github.com/leon" />
        <Row label="LINKEDIN" value="linkedin.com/in/leon" />
        <Divider />
        <p style={{ ...desc, color: 'rgba(255,255,255,0.35)' }}>Open to internships, collabs, interesting projects.</p>
      </>
    ),
  },
}

export default function PortfolioWindow({ id, onBack }) {
  const s = SECTIONS[id]
  if (!s) return null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <button
          onClick={e => { e.stopPropagation(); onBack() }}
          onMouseEnter={e => e.currentTarget.style.background = s.color + '22'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          style={{ background: 'transparent', border: `1px solid ${s.color}55`, color: `${s.color}99`, cursor: 'pointer', padding: '3px 10px', fontSize: 9, fontFamily: 'Courier New, monospace', letterSpacing: '0.14em', transition: 'background 0.15s' }}
        >
          ← BACK
        </button>
        <span style={{ fontSize: 10, letterSpacing: '0.22em', color: s.color }}>{s.title}</span>
      </div>
      <s.content />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 10, letterSpacing: '0.08em' }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', minWidth: 88 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)' }}>{value}</span>
    </div>
  )
}

function Card({ num, title, tech, body, color }) {
  return (
    <div style={{ border: `1px solid ${color}33`, padding: '8px 10px', marginBottom: 8, background: `${color}08` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9, letterSpacing: '0.2em', color: color + '88' }}>{num}</span>
        <span style={{ fontSize: 9, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>{tech}</span>
      </div>
      <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.9)', marginBottom: 3 }}>{title}</p>
      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{body}</p>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />
}

const desc = { fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }
