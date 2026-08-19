// RideFlow Editorial Transit system: asymmetric workspace, warm sand surfaces, ink navy hierarchy, tangerine action signals, and tactile motion.
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CarFront,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  DollarSign,
  Droplets,
  Gauge,
  Heart,
  Home as HomeIcon,
  Leaf,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  Phone,
  Plus,
  Route,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Thermometer,
  UserRound,
  UsersRound,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type Mode = "customer" | "driver";
type View = "overview" | "book" | "trips" | "drivers" | "profile";
type FareSummary = { baseFareKsh: number; distanceFareKsh: number; timeFareKsh: number; safetyFeeKsh: number; platformCommissionKsh: number; riderTotalKsh: number; driverEarningsKsh: number };
const demoFare: FareSummary = { baseFareKsh: 100, distanceFareKsh: 252, timeFareKsh: 72, safetyFeeKsh: 20, platformCommissionKsh: 22, riderTotalKsh: 444, driverEarningsKsh: 422 };

const drivers = [
  { name: "Maya Chen", rating: "4.98", rides: "1,284", car: "Polestar 2 · White", eta: "3 min", initials: "MC", color: "#d9e9e4", accent: "#2a6257" },
  { name: "Jon Bell", rating: "4.96", rides: "2,041", car: "Volvo XC40 · Slate", eta: "5 min", initials: "JB", color: "#f5dfcc", accent: "#935438" },
  { name: "Amara Lewis", rating: "4.95", rides: "846", car: "Ioniq 5 · Sage", eta: "7 min", initials: "AL", color: "#e5ddf3", accent: "#614b85" },
];

const nav = [
  { id: "overview", label: "Overview", icon: HomeIcon },
  { id: "book", label: "Book a ride", icon: Route },
  { id: "trips", label: "Your trips", icon: Clock3 },
  { id: "drivers", label: "Favorite drivers", icon: Heart },
  { id: "profile", label: "Profile", icon: UserRound },
] as const;

function AppMark({ small = false }: { small?: boolean }) {
  return <img className={small ? "app-mark app-mark-small" : "app-mark"} src="/manus-storage/rideflow-mark_a0f342ce.png" alt="RideFlow mark" />;
}

function Avatar({ initials, color = "#e8ded0", accent = "#203c48" }: { initials: string; color?: string; accent?: string }) {
  return <div className="avatar" style={{ background: color, color: accent }}>{initials}</div>;
}

function Metric({ label, value, delta, positive = true }: { label: string; value: string; delta?: string; positive?: boolean }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong>{delta && <small className={positive ? "delta-positive" : "delta-neutral"}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}{delta}</small>}</div>;
}

function FareBreakdown({ compact = false, fare = demoFare }: { compact?: boolean; fare?: FareSummary }) {
  return <div className={compact ? "fare-breakdown compact" : "fare-breakdown"}>
    <div className="fare-head"><span>Exact fare</span><strong>KSh {fare.riderTotalKsh.toLocaleString()}</strong></div>
    <div className="fare-row"><span>Base + distance + time</span><b>KSh {(fare.baseFareKsh + fare.distanceFareKsh + fare.timeFareKsh).toLocaleString()}</b></div>
    <div className="fare-row"><span>Safety &amp; support</span><b>KSh {fare.safetyFeeKsh.toLocaleString()}</b></div>
    <div className="fare-row"><span>RideFlow commission <em>5%</em></span><b>KSh {fare.platformCommissionKsh.toLocaleString()}</b></div>
    <div className="fare-row total"><span>Total before tip</span><b>KSh {fare.riderTotalKsh.toLocaleString()}</b></div>
    {!compact && <p className="fine-print"><ShieldCheck size={13} /> No surge. No surprise fees. The driver receives KSh {fare.driverEarningsKsh.toLocaleString()} after our 5% platform commission.</p>}
  </div>;
}

function MapCard({ active = false }: { active?: boolean }) {
  return <div className={active ? "map-card active-map" : "map-card"}>
    <div className="map-toolbar"><span><span className="live-dot" /> Live route preview</span><button className="icon-button" aria-label="More map options"><MoreHorizontal size={18} /></button></div>
    <div className="map-grid"><div className="contour contour-one" /><div className="contour contour-two" /><div className="contour contour-three" />
      <div className="road road-a" /><div className="road road-b" /><div className="road road-c" /><div className="route-line" />
      <div className="map-pin pickup"><span /></div><div className="map-pin destination"><MapPin size={17} /></div>
      <div className="map-label label-pickup">Home</div><div className="map-label label-destination">Market Street</div>
      {active && <div className="driver-on-map"><CarFront size={15} /> Maya is 2 min away</div>}
    </div>
    <div className="map-footer"><span><Navigation size={15} /> 8.4 mi</span><span><Clock3 size={15} /> 24 min</span><span><Leaf size={15} /> Low emissions</span></div>
  </div>;
}

function DriverDocumentUploads() {
  const upload = trpc.files.upload.useMutation();
  const { isAuthenticated } = useAuth();
  const [uploaded, setUploaded] = useState<Record<string, string>>({});
  const uploadDocument = (purpose: "driver_license" | "insurance" | "vehicle_document", label: string) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      toast("Sign in to upload verification documents.");
      startLogin();
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await upload.mutateAsync({ name: file.name, mimeType: file.type, purpose, base64: String(reader.result ?? "") });
        setUploaded(current => ({ ...current, [purpose]: file.name }));
        toast.success(`${label} uploaded securely.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `${label} upload failed.`);
      }
    };
    reader.readAsDataURL(file);
  };
  const rows = [["driver_license", "Driver license"], ["insurance", "Insurance proof"], ["vehicle_document", "Vehicle document"]] as const;
  return <div className="driver-documents"><div className="eyebrow">DRIVER VERIFICATION FILES</div>{rows.map(([purpose, label]) => <div className="document-row" key={purpose}><div><b>{label}</b><small>{uploaded[purpose] ?? "PDF, JPG, PNG, WEBP · up to 8 MB"}</small></div><input id={`signup-${purpose}`} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={uploadDocument(purpose, label)} hidden /><label htmlFor={`signup-${purpose}`} className="secondary-button">{upload.isPending ? "Uploading…" : !isAuthenticated ? "Sign in" : uploaded[purpose] ? "Replace" : "Upload"}</label></div>)}</div>;
}

function SignupModal({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState<Mode>("customer");
  const [step, setStep] = useState(1);
  const finish = () => { toast.success(`You're set up as a ${role}. Welcome to RideFlow.`); onClose(); };
  return <div className="modal-backdrop" role="dialog" aria-modal="true">
    <div className="modal-card">
      <button className="modal-close icon-button" onClick={onClose} aria-label="Close signup"><X size={19} /></button>
      <div className="modal-kicker">RIDEFLOW / {String(step).padStart(2, "0")}</div>
      <h2>{step === 1 ? "Move on your terms." : role === "driver" ? "A few details before your first trip." : "Make the next ride yours."}</h2>
      {step === 1 ? <>
        <p className="modal-copy">Choose how you’ll use RideFlow. You can switch modes anytime.</p>
        <div className="role-picker">
          <button className={role === "customer" ? "role-card selected" : "role-card"} onClick={() => setRole("customer")}><UsersRound size={21} /><span><b>Ride with us</b><small>Book safer, clearer rides.</small></span>{role === "customer" && <Check size={18} />}</button>
          <button className={role === "driver" ? "role-card selected" : "role-card"} onClick={() => setRole("driver")}><CarFront size={21} /><span><b>Drive with us</b><small>Keep more of every fare.</small></span>{role === "driver" && <Check size={18} />}</button>
        </div>
        <button className="primary-button full" onClick={() => setStep(2)}>Continue <ArrowUpRight size={17} /></button>
      </> : <>
        <p className="modal-copy">{role === "driver" ? "We’ll verify your license and vehicle details before you go online." : "Your details stay yours. We only use them to make your rides work."}</p>
        <div className="form-grid"><label>Full name<input placeholder="Alex Morgan" /></label><label>Email<input placeholder="alex@email.com" type="email" /></label><label>Phone<input placeholder="(555) 014-2088" /></label>{role === "driver" ? <><label>License number<input placeholder="DL-4829-AX" /></label><label>Vehicle info<input placeholder="2024 Polestar 2 · White" /></label><label>Insurance policy<input placeholder="Policy number" /></label></> : <label>Payment method<input placeholder="•••• 4242" /></label>}</div>
        {role === "driver" && <DriverDocumentUploads />}
        <div className="upload-row"><div className="upload-avatar"><UserRound size={22} /></div><div><b>Profile photo</b><span>A friendly face builds trust.</span></div><button className="secondary-button">Upload</button></div>
        <button className="primary-button full" onClick={finish}>Create my account <Check size={17} /></button>
      </>}
      <div className="modal-footer"><LockKeyhole size={13} /> Encrypted by default · No spam, ever.</div>
    </div>
  </div>;
}

function Overview({ setView, setMode, openSignup }: { setView: (view: View) => void; setMode: (mode: Mode) => void; openSignup: () => void }) {
  return <div className="page-content overview-page">
    <section className="hero-panel">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> GOOD MORNING, ALEX</div><h1>Your route,<br /><i>before</i> your ride.</h1><p>Upfront fares, drivers you can choose, and safety tools that stay with you from curb to curb.</p><div className="hero-actions"><button className="primary-button" onClick={() => setView("book")}>Book a ride <ArrowUpRight size={17} /></button><button className="text-button" onClick={openSignup}>Create an account <span>↗</span></button></div></div>
      <div className="hero-image"><img src="/manus-storage/rideflow-hero_3161cc41.jpg" alt="Electric car on a sunlit city street" /><div className="hero-image-note"><Sparkles size={14} /><span>Designed around<br /><b>your peace of mind.</b></span></div></div>
    </section>
    <section className="overview-grid">
      <div className="section-heading"><div><span className="eyebrow">AT A GLANCE</span><h2>Less guesswork.<br />More getting there.</h2></div><button className="icon-button bordered" onClick={() => setView("trips")} aria-label="View all trips"><ArrowUpRight size={19} /></button></div>
      <div className="metrics-row"><Metric label="Saved on fares" value="KSh 4,280" delta="12% this month" /><Metric label="Rides with favorites" value="08" delta="+2 this month" /><Metric label="Safety check-ins" value="100%" delta="Always on" positive={false} /></div>
      <div className="feature-grid"><div className="feature-card feature-tangerine"><div className="feature-icon"><ShieldCheck size={20} /></div><div><span className="eyebrow">SAFETY FIRST</span><h3>Share your trip<br />before you go.</h3><button className="small-link" onClick={() => setView("book")}>Explore safety tools <ArrowUpRight size={14} /></button></div><div className="feature-ring" /></div><div className="feature-card feature-ink"><div className="feature-top"><div className="feature-icon light"><Heart size={19} /></div><span className="live-status"><span className="live-dot" /> 3 nearby</span></div><h3>Choose a driver<br />you already trust.</h3><button className="small-link light-link" onClick={() => setView("drivers")}>See favorites <ArrowUpRight size={14} /></button></div><div className="mini-card"><span className="mini-label"><CreditCard size={14} /> CLEAR FARES</span><strong>KSh 444</strong><span>Airport → Market Street</span><div className="mini-divider" /><div className="mini-foot"><span>Includes 5% platform fee</span><Check size={15} /></div></div></div>
    </section>
  </div>;
}

function Booking({ setMode, mode }: { setMode: (mode: Mode) => void; mode: Mode }) {
  const [selected, setSelected] = useState(0);
  const [scheduled, setScheduled] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [fare, setFare] = useState<FareSummary>(demoFare);
  const quote = trpc.fares.quote.useMutation();
  const request = async () => {
    try {
      const result = await quote.mutateAsync({ originLabel: "Home · 245 Oak Street", destinationLabel: "Market Street Station", distanceMeters: 8400, durationSeconds: 24 * 60 });
      setFare(result.calculated);
      toast.success(`Exact quote ready — KSh ${result.calculated.riderTotalKsh.toLocaleString()}.`);
    } catch {
      toast("Sign in to save a live quote. Showing the current demo estimate.");
    }
  };
  return <div className="page-content booking-page">
    <div className="page-title-row"><div><span className="eyebrow">BOOK A RIDE</span><h1>Make it <i>yours.</i></h1><p>Every detail, decided before the wheels move.</p></div><div className="mode-toggle"><button className={mode === "customer" ? "active" : ""} onClick={() => setMode("customer")}>Rider</button><button className={mode === "driver" ? "active" : ""} onClick={() => setMode("driver")}>Driver</button></div></div>
    {mode === "driver" ? <DriverDashboard /> : <div className="booking-layout"><div className="booking-main"><MapCard /><div className="location-card"><div className="location-line"><span className="location-dot pickup-dot" /><div><small>Pick up</small><b>Home · 245 Oak Street</b></div><button className="icon-button"><Search size={16} /></button></div><div className="location-connector" /><div className="location-line"><span className="location-dot destination-dot" /><div><small>Drop off</small><b>Market Street Station</b></div><button className="icon-button"><Plus size={17} /></button></div><button className="add-stop"><Plus size={15} /> Add a stop</button></div>
    <div className="preference-section"><div className="subhead"><span><span className="eyebrow">RIDE PREFERENCES</span><b>Small things, your way.</b></span><Settings2 size={17} /></div><div className="preference-row"><button className="preference-chip selected"><MessageCircle size={16} /> Quiet ride</button><button className="preference-chip"><Thermometer size={16} /> Cool cabin</button><button className="preference-chip"><Zap size={16} /> Your music</button></div></div>
    <div className="safety-strip"><div className="safety-icon"><ShieldCheck size={19} /></div><div><b>Women-only rides</b><span>Request a woman driver when available.</span></div><button className={womenOnly ? "switch on" : "switch"} onClick={() => setWomenOnly(!womenOnly)}><span /></button></div>
    <div className="booking-footer"><div className="schedule-control"><Clock3 size={18} /><span><small>When</small><b>{scheduled ? "Today · 6:30 PM" : "Now"}</b></span><button onClick={() => setScheduled(!scheduled)}>{scheduled ? "Change" : "Schedule"}</button></div><button className="primary-button" onClick={request}>{quote.isPending ? "Calculating…" : `Review ride · KSh ${fare.riderTotalKsh.toLocaleString()}`} <ArrowUpRight size={17} /></button></div>
    </div><aside className="booking-aside"><div className="aside-heading"><div><span className="eyebrow">CHOOSE YOUR DRIVER</span><h3>People, not<br />just profiles.</h3></div><span className="count-pill">3 nearby</span></div><div className="driver-list">{drivers.map((driver, index) => <button key={driver.name} className={selected === index ? "driver-card selected" : "driver-card"} onClick={() => setSelected(index)}><Avatar initials={driver.initials} color={driver.color} accent={driver.accent} /><div className="driver-info"><div><b>{driver.name}</b>{selected === index && <span className="selected-check"><Check size={12} /></span>}</div><span>{driver.car}</span><small><Star size={12} fill="currentColor" /> {driver.rating} · {driver.rides} rides</small></div><div className="driver-eta"><b>{driver.eta}</b><span>away</span></div></button>)}</div><div className="fare-aside"><div className="aside-heading compact-heading"><span className="eyebrow">TRANSPARENT FARE</span><button className="icon-button"><CircleHelp size={16} /></button></div><FareBreakdown compact fare={fare} /><button className="tip-button" onClick={() => toast("Tip suggestions appear after the ride.")}><DollarSign size={15} /> Tip suggestions after your ride</button></div><button className="chat-launch" onClick={() => setChatOpen(true)}><MessageCircle size={18} /><span><b>Chat before pickup</b><small>Ask Maya anything</small></span><ChevronDown size={16} /></button></aside></div>}
    {chatOpen && <div className="chat-popover"><div className="chat-header"><span><Avatar initials="MC" color="#d9e9e4" accent="#2a6257" /> Maya Chen</span><button className="icon-button" onClick={() => setChatOpen(false)}><X size={16} /></button></div><div className="chat-body"><div className="message theirs">Hi Alex — I’m parked on Oak Street near the big sycamore.</div><div className="message mine">Perfect, I’ll look for the white Polestar.</div></div><div className="chat-input"><input placeholder="Write a message…" /><button className="icon-button"><Send size={16} /></button></div></div>}
  </div>;
}

function DriverDashboard() {
  return <div className="driver-dashboard"><div className="driver-hero"><div><span className="eyebrow">DRIVER MODE · ONLINE</span><h2>Your next great<br /><i>trip is close.</i></h2><p>Keep 95% of every fare. RideFlow keeps the other 5% visible, always.</p><button className="secondary-button light-button"><Gauge size={16} /> Go offline</button></div><div className="driver-pulse"><div className="pulse-core"><CarFront size={34} /></div><span>4 riders nearby</span></div></div><div className="driver-stats"><Metric label="Today's earnings" value="KSh 18,420" delta="+8.4%" /><Metric label="Your take-home" value="KSh 17,499" delta="After 5% fee" positive={false} /><Metric label="Acceptance" value="92%" delta="Top 12%" /></div><div className="driver-columns"><div className="request-card"><div className="subhead"><span><span className="eyebrow">NEW REQUEST</span><b>One rider · 3.2 mi away</b></span><span className="request-time">expires 01:42</span></div><div className="request-route"><div><span className="route-marker orange" />Oak Street</div><div className="route-connector" /><div><span className="route-marker navy" />Union Square</div></div><div className="request-fare"><span><small>Rider pays</small><b>KSh 444</b></span><span><small>Your 95%</small><b>KSh 422</b></span><button className="primary-button">Accept <Check size={16} /></button></div></div><div className="earnings-card"><div className="subhead"><span><span className="eyebrow">FEE BREAKDOWN</span><b>This week</b></span><MoreHorizontal size={17} /></div><div className="earnings-number">KSh 84,210</div><div className="earnings-bar"><span style={{ width: "82%" }} /></div><div className="earnings-labels"><span>Gross fares <b>KSh 88,642</b></span><span>5% to RideFlow <b>−KSh 4,432</b></span></div><p className="fine-print"><ShieldCheck size={13} /> You see the exact fee on every trip. No hidden deductions.</p></div></div></div>;
}

function Trips({ setView }: { setView: (view: View) => void }) {
  return <div className="page-content simple-page"><div className="page-title-row"><div><span className="eyebrow">YOUR TRIPS</span><h1>Every ride,<br /><i>in one place.</i></h1><p>Receipts, shared trips, and lost-item help without the hunt.</p></div><button className="primary-button" onClick={() => setView("book")}>Book again <ArrowUpRight size={17} /></button></div><div className="trip-list"><div className="trip-item featured-trip"><div className="trip-icon"><Navigation size={18} /></div><div className="trip-main"><b>Home → Market Street</b><span>Today · 9:42 AM · Maya Chen</span></div><div className="trip-right"><strong>KSh 444</strong><small>Receipt ready</small></div><button className="icon-button"><MoreHorizontal size={17} /></button></div>{["Airport → Home", "Union Square → Studio", "Market Street → Home"].map((name, i) => <div className="trip-item" key={name}><div className="trip-icon muted"><Route size={17} /></div><div className="trip-main"><b>{name}</b><span>{["Mon, Aug 18 · 5:18 PM · Jon Bell", "Sun, Aug 17 · 11:06 AM · Amara Lewis", "Sat, Aug 16 · 7:30 PM · Maya Chen"][i]}</span></div><div className="trip-right"><strong>{["KSh 4,820", "KSh 1,840", "KSh 1,680"][i]}</strong><small>Completed</small></div><button className="icon-button"><MoreHorizontal size={17} /></button></div>)}</div><div className="lost-item-banner"><div className="feature-icon"><Search size={18} /></div><div><b>Left something behind?</b><span>Track a lost item with the driver who had it.</span></div><button className="secondary-button" onClick={() => toast("Lost item flow opened — demo mode")}>Find an item <ArrowUpRight size={15} /></button></div></div>;
}

function Drivers() {
  return <div className="page-content simple-page"><div className="page-title-row"><div><span className="eyebrow">FAVORITE DRIVERS</span><h1>The people<br /><i>you remember.</i></h1><p>When a great ride happens, keep the connection.</p></div><button className="secondary-button"><Plus size={16} /> Add a favorite</button></div><div className="favorite-grid">{drivers.map((driver) => <div className="favorite-card" key={driver.name}><div className="favorite-card-top"><Avatar initials={driver.initials} color={driver.color} accent={driver.accent} /><button className="heart-button"><Heart size={17} fill="currentColor" /></button></div><h3>{driver.name}</h3><span>{driver.car}</span><div className="rating-line"><Star size={14} fill="currentColor" /> {driver.rating} <em>·</em> {driver.rides} rides</div><button className="secondary-button full" onClick={() => toast(`${driver.name} selected for your next ride.`)}>Request {driver.name.split(" ")[0]} <ArrowUpRight size={15} /></button></div>)}</div></div>;
}

function ProfileStoragePanel() {
  const upload = trpc.files.upload.useMutation();
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputId = "rideflow-profile-photo";
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result ?? "");
      try {
        await upload.mutateAsync({ name: file.name, mimeType: file.type, purpose: "profile_photo", base64: dataUrl });
        toast.success("Profile photo uploaded securely.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed. Please try again.");
      }
    };
    reader.onerror = () => toast.error("The file could not be read.");
    reader.readAsDataURL(file);
  };
  return <div className="storage-panel"><div className="storage-panel-icon"><UploadCloud size={18} /></div><div><b>Profile photo</b><span>{fileName ?? "JPG, PNG, WEBP · up to 8 MB"}</span></div><input id={fileInputId} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} hidden /><label htmlFor={fileInputId} className="secondary-button">{upload.isPending ? "Uploading…" : "Choose file"}</label></div>;
}

function AdminPanel() {
  const settings = trpc.admin.settings.useQuery();
  const currentRules = trpc.fareRules.current.useQuery();
  const updateFare = trpc.fareRules.update.useMutation();
  const updateNotification = trpc.admin.updateNotificationEmail.useMutation();
  const transfer = trpc.admin.transfer.useMutation();
  const [baseFare, setBaseFare] = useState("100");
  const [perKm, setPerKm] = useState("30");
  const [perMinute, setPerMinute] = useState("3");
  const [safetyFee, setSafetyFee] = useState("20");
  const [commission, setCommission] = useState("5");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [newAdmin, setNewAdmin] = useState("");
  useEffect(() => {
    if (currentRules.data) {
      setBaseFare(String(currentRules.data.baseFareKsh)); setPerKm(String(currentRules.data.distanceRateKshPerKm)); setPerMinute(String(currentRules.data.timeRateKshPerMinute)); setSafetyFee(String(currentRules.data.safetyFeeKsh)); setCommission(String(currentRules.data.platformCommissionBps / 100));
    }
    if (settings.data?.notificationEmail) setNotificationEmail(settings.data.notificationEmail);
  }, [currentRules.data, settings.data]);
  const saveFareRules = async () => {
    try {
      await updateFare.mutateAsync({ city: "Nairobi", baseFareKsh: Number(baseFare), distanceRateKshPerKm: Number(perKm), timeRateKshPerMinute: Number(perMinute), minimumFareKsh: 200, safetyFeeKsh: Number(safetyFee), platformCommissionBps: Math.round(Number(commission) * 100) });
      toast.success("Nairobi fare rules updated.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update fare rules."); }
  };
  const saveNotificationEmail = async () => {
    try { await updateNotification.mutateAsync({ email: notificationEmail }); toast.success("Signup notification email updated."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update notification email."); }
  };
  const transferOwnership = async () => {
    if (!newAdmin) return;
    try { await transfer.mutateAsync({ email: newAdmin }); toast.success("Admin ownership transferred."); setNewAdmin(""); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not transfer admin ownership."); }
  };
  return <div className="admin-panel"><div className="subhead"><span><span className="eyebrow">ADMIN CONTROL ROOM</span><b>Change RideFlow without code.</b></span><ShieldCheck size={18} /></div><p className="admin-note">Current notification recipient: {settings.data?.notificationEmail ?? "Configured admin"}. Updates apply to new server-side fare quotes.</p><div className="admin-transfer-row admin-notification-row"><input value={notificationEmail} onChange={event => setNotificationEmail(event.target.value)} placeholder="admin@email.com" type="email" /><button className="secondary-button" onClick={saveNotificationEmail}>{updateNotification.isPending ? "Saving…" : "Save notification email"}</button></div><div className="admin-fields"><label>Base fare (KSh)<input value={baseFare} onChange={event => setBaseFare(event.target.value)} /></label><label>Per km (KSh)<input value={perKm} onChange={event => setPerKm(event.target.value)} /></label><label>Per minute (KSh)<input value={perMinute} onChange={event => setPerMinute(event.target.value)} /></label><label>Safety fee (KSh)<input value={safetyFee} onChange={event => setSafetyFee(event.target.value)} /></label><label>Commission (%)<input value={commission} onChange={event => setCommission(event.target.value)} /></label></div><button className="primary-button" onClick={saveFareRules}>{updateFare.isPending ? "Saving…" : "Save fare rules"} <Check size={16} /></button><div className="admin-transfer"><span><b>Transfer admin ownership</b><small>The new admin must sign in first. Your current admin access will be revoked.</small></span><div className="admin-transfer-row"><input value={newAdmin} onChange={event => setNewAdmin(event.target.value)} placeholder="new-admin@email.com" type="email" /><button className="secondary-button" onClick={transferOwnership}>{transfer.isPending ? "Transferring…" : "Transfer"}</button></div></div></div>;
}

function Profile({ isAdmin = false }: { isAdmin?: boolean }) {
  return <div className="page-content simple-page"><div className="page-title-row"><div><span className="eyebrow">PROFILE &amp; SETTINGS</span><h1>Your ride,<br /><i>your rules.</i></h1><p>Preferences that travel with you.</p></div><Avatar initials="AM" color="#f5dfcc" accent="#935438" /></div><div className="profile-grid"><div className="profile-card"><div className="profile-avatar"><span>AM</span><button className="icon-button"><Plus size={15} /></button></div><h3>Alex Morgan</h3><span>alex.morgan@email.com</span><ProfileStoragePanel /><div className="profile-divider" /><button className="settings-row"><CreditCard size={17} /><span><b>Payment</b><small>Visa ending in 4242</small></span><ChevronDown size={16} /></button><button className="settings-row"><ShieldCheck size={17} /><span><b>Safety contacts</b><small>2 people can follow your trips</small></span><ChevronDown size={16} /></button></div><div className="preferences-card"><div className="subhead"><span><span className="eyebrow">DEFAULT PREFERENCES</span><b>Set once. Ride easy.</b></span><Settings2 size={17} /></div>{[["Quiet rides", MessageCircle, "On"], ["Cool cabin", Thermometer, "On"], ["Share trips automatically", UsersRound, "Off"]].map(([label, Icon, value]) => <div className="preference-setting" key={label as string}><span className="preference-setting-icon"><Icon size={17} /></span><span><b>{label as string}</b><small>{value === "On" ? "Applied to every ride" : "Choose contacts when booking"}</small></span><span className={value === "On" ? "switch on" : "switch"}><span /></span></div>)}</div></div>{isAdmin && <AdminPanel />}</div>;
}

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [view, setView] = useState<View>("overview");
  const [mode, setMode] = useState<Mode>("customer");
  const [signupOpen, setSignupOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const viewTitle = nav.find((item) => item.id === view)?.label ?? "Overview";
  return <div className="app-shell"><aside className={mobileNav ? "sidebar mobile-open" : "sidebar"}><div className="brand"><AppMark small /><span>Ride<b>Flow</b></span></div><button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><X size={18} /></button><div className="sidebar-label">WORKSPACE</div><nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "nav-item active" : "nav-item"} onClick={() => { setView(id); setMobileNav(false); }}><Icon size={17} /><span>{label}</span>{id === "drivers" && <small>3</small>}</button>)}</nav><div className="sidebar-bottom"><div className="trust-note"><ShieldCheck size={16} /><span><b>Safety is a setting.</b><small>Always on, never hidden.</small></span></div><button className="mode-card" onClick={() => { setMode(mode === "customer" ? "driver" : "customer"); setView("book"); }}><div className="mode-avatar"><CarFront size={15} /></div><span><small>MODE</small><b>{mode === "customer" ? "Rider" : "Driver"}</b></span><ChevronDown size={15} /></button><div className="sidebar-meta"><span>RideFlow v1.0 demo</span><span>Help center ↗</span></div></div></aside><main className="main-shell"><header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)}><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><span>/</span><b>{viewTitle}</b></div><div className="topbar-actions"><button className="topbar-icon icon-button"><Search size={17} /></button><button className="topbar-icon icon-button notification"><Bell size={17} /><i /></button><button className="profile-trigger" onClick={() => setView("profile")}><Avatar initials="AM" color="#f5dfcc" accent="#935438" /><span>Alex Morgan</span><ChevronDown size={14} /></button><button className="header-signup" onClick={() => setSignupOpen(true)}>Sign up <ArrowUpRight size={15} /></button></div></header><div className="content-wrap">{view === "overview" && <Overview setView={setView} setMode={setMode} openSignup={() => setSignupOpen(true)} />}{view === "book" && <Booking setMode={setMode} mode={mode} />}{view === "trips" && <Trips setView={setView} />}{view === "drivers" && <Drivers />}{view === "profile" && <Profile isAdmin={user?.role === "admin"} />}</div></main>{signupOpen && <SignupModal onClose={() => setSignupOpen(false)} />}</div>;
}
