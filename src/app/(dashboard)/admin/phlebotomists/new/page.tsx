"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import dynamic from "next/dynamic";
import AddressSearch from "@/components/AddressSearch";
import { reverseGeocode } from "@/lib/geocode";

// Dynamic import for MiniMapPreview to avoid SSR issues
const MiniMapPreview = dynamic(() => import("@/components/MiniMapPreview"), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-surface-container animate-pulse rounded-lg border border-outline-variant flex items-center justify-center">
    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Initialising Preview Map...</span>
  </div>
});

export default function NewPhlebotomistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [locating, setLocating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    experience: "5",
    radius: 15,
    status: "active",
    address: "Detecting location...",
    lng: 75.7804,
    lat: 11.2588,
    specialisations: ["PAEDIATRIC", "ONCOLOGY"],
    notes: ""
  });

  // Get current location on mount
  useEffect(() => {
    handleGetCurrentLocation();
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const address = await reverseGeocode(latitude, longitude);
        setFormData(prev => ({ ...prev, lat: latitude, lng: longitude, address }));
      } catch (err) {
        setFormData(prev => ({ ...prev, lat: latitude, lng: longitude, address: "Location Pinpointed" }));
      } finally {
        setLocating(false);
      }
    }, () => {
      setLocating(false);
      setFormData(prev => ({ ...prev, address: "" }));
    });
  };

  const handleMapSelection = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat, lng }));
    try {
      const address = await reverseGeocode(lat, lng);
      setFormData(prev => ({ ...prev, address }));
    } catch (err) {
      console.error("Reverse geocode failed");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("upload_preset", "dispatch_preset");
    formData.append("file", file);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dfetresky/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      
      const data = await response.json();
      console.log("Cloudinary Raw Response:", data);

      if (!response.ok) {
        throw new Error(data.error?.message || "Cloudinary Upload Failed");
      }

      setImageUrl(data.secure_url);
      console.log("Success! Image URL:", data.secure_url);
    } catch (error: any) {
      console.error("Upload Detailed Error:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const toggleSpecialisation = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specialisations: prev.specialisations.includes(spec)
        ? prev.specialisations.filter(s => s !== spec)
        : [...prev.specialisations, spec]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.lat === 0 || formData.lng === 0) {
      alert("Please select a base location using the address search.");
      return;
    }
    setLoading(true);

    try {
      await addDoc(collection(db, "phlebotomists"), {
        ...formData,
        profileImage: imageUrl,
        createdAt: serverTimestamp(),
      });
      router.push("/admin/phlebotomists");
    } catch (error) {
      console.error("Error adding phlebotomist:", error);
      alert("System failure: Record rejected by secure vault.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center animate-fade-in pb-xl">
      <div className="w-full max-w-[680px] space-y-lg">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h1 className="font-technical text-2xl font-bold text-text uppercase">ADD PHLEBOTOMIST</h1>
            <p className="font-label text-[10px] text-outline uppercase tracking-widest">System Record Entry: New Personnel</p>
          </div>
          <div className="flex items-center gap-sm bg-surface-container px-md py-sm rounded border border-outline-variant shadow-glow">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="font-data text-[10px] text-primary-container uppercase tracking-wider">Live Entry Mode</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-lg">
          {/* Section: Personal Info */}
          <section className="bg-surface-container p-lg rounded-lg border border-outline-variant relative overflow-hidden shadow-glow">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
            <div className="flex items-center gap-sm mb-md">
              <span className="icon text-primary-container text-[20px]">person_add</span>
              <h2 className="font-technical text-[14px] font-bold text-text uppercase tracking-wider">PERSONAL INFORMATION</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {/* Photo Upload */}
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`h-full min-h-[120px] flex flex-col items-center justify-center p-md border border-dashed rounded-lg transition-all ${imageUrl ? 'border-primary-container bg-primary-container/5' : 'border-outline-variant bg-background hover:bg-surface-variant'
                  }`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-label text-[10px] text-primary-container uppercase font-bold">Uploading...</span>
                    </div>
                  ) : imageUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center">
                      <img src={imageUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-primary-container mb-2" />
                      <span className="font-label text-[10px] text-primary-container uppercase font-bold">Photo Linked</span>
                    </div>
                  ) : (
                    <>
                      <span className="icon text-3xl text-outline group-hover:text-primary-container transition-colors mb-2">cloud_upload</span>
                      <span className="font-label text-[11px] text-outline font-bold uppercase tracking-wider">UPLOAD PROFILE PHOTO</span>
                      <span className="font-data text-[9px] text-outline/40">MAX 2MB .JPG .PNG</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-md">
                <div className="space-y-xs">
                  <label className="font-label text-[11px] text-outline uppercase font-bold">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background border border-outline-variant rounded-lg px-md py-sm text-text focus:border-primary-container outline-none font-data text-[13px] transition-all"
                    placeholder="e.g. Rahul V."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-xs">
                  <label className="font-label text-[11px] text-outline uppercase font-bold">Primary Contact</label>
                  <input
                    type="tel"
                    required
                    className="w-full bg-background border border-outline-variant rounded-lg px-md py-sm text-text focus:border-primary-container outline-none font-data text-[13px] transition-all"
                    placeholder="+91 00000 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Specialisations */}
          <section className="bg-surface-container p-lg rounded-lg border border-outline-variant shadow-glow">
            <div className="flex items-center gap-sm mb-md">
              <span className="icon text-primary-container text-[20px]">workspace_premium</span>
              <h2 className="font-technical text-[14px] font-bold text-text uppercase tracking-wider">SPECIALISATIONS</h2>
            </div>
            <div className="flex flex-wrap gap-sm">
              {["PAEDIATRIC", "GERIATRIC", "ONCOLOGY", "EMERGENCY", "RESEARCH"].map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialisation(spec)}
                  className={`px-md py-sm rounded-full border transition-all font-label text-[11px] font-bold tracking-wider ${formData.specialisations.includes(spec)
                      ? "border-primary-container bg-primary-container/10 text-primary-container shadow-[0_0_8px_rgba(0,200,150,0.2)]"
                      : "border-outline-variant bg-background text-outline hover:border-outline"
                    }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </section>

          {/* Section: Location */}
          <section className="bg-surface-container p-lg rounded-lg border border-outline-variant shadow-glow">
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-sm">
                <span className="icon text-primary-container text-[20px]">location_on</span>
                <h2 className="font-technical text-[14px] font-bold text-text uppercase tracking-wider">BASE LOCATION</h2>
              </div>
              <div className="flex items-center gap-md">
                <button 
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={locating}
                  className="flex items-center gap-xs bg-primary-container/10 px-sm py-[2px] rounded border border-primary-container/20 hover:bg-primary-container/20 transition-colors"
                >
                  <span className={`icon text-[14px] text-primary-container ${locating ? 'animate-spin' : ''}`}>my_location</span>
                  <span className="font-data text-[10px] text-primary-container uppercase">{locating ? 'Detecting...' : 'Current Location'}</span>
                </button>
                <div className="bg-background px-sm py-[2px] rounded border border-outline-variant flex items-center gap-xs">
                  <span className="icon text-[14px] text-primary-container">pin_drop</span>
                  <span className="font-data text-[10px] text-primary-container">
                    {formData.lat.toFixed(4)}° N, {formData.lng.toFixed(4)}° E
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-md">
              <AddressSearch 
                initialValue={formData.address}
                onSelect={(result) => setFormData({
                  ...formData, 
                  lng: result.lng, 
                  lat: result.lat, 
                  address: result.display_name
                })}
              />
              <MiniMapPreview 
                lat={formData.lat} 
                lng={formData.lng} 
                radius={formData.radius}
                onLocationSelect={handleMapSelection}
              />
            </div>
          </section>

          {/* Section: Service Settings */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="bg-surface-container p-lg rounded-lg border border-outline-variant shadow-glow">
              <div className="flex items-center gap-sm mb-md">
                <span className="icon text-primary-container text-[20px]">distance</span>
                <h2 className="font-technical text-[14px] font-bold text-text uppercase tracking-wider">SERVICE RADIUS</h2>
              </div>
              <div className="space-y-lg px-xs">
                <div className="flex justify-between font-data text-[12px] text-primary-container">
                  <span>5 KM</span>
                  <span className="bg-primary-container/20 px-sm rounded font-bold">{formData.radius} KM</span>
                  <span>30 KM</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  className="w-full h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary-container"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="bg-surface-container p-lg rounded-lg border border-outline-variant shadow-glow">
              <div className="flex items-center gap-sm mb-md">
                <span className="icon text-primary-container text-[20px]">event_available</span>
                <h2 className="font-technical text-[14px] font-bold text-text uppercase tracking-wider">AVAILABILITY</h2>
              </div>
              <div className="flex items-center justify-between p-sm bg-background rounded border border-outline-variant">
                <span className="font-label text-[11px] text-text uppercase font-bold tracking-widest">System Status</span>
                <div
                  className={`px-md py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${formData.status === 'active' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-outline'
                    }`}
                  onClick={() => setFormData({ ...formData, status: formData.status === 'active' ? 'inactive' : 'active' })}
                >
                  {formData.status === 'active' ? 'ONLINE' : 'OFFLINE'}
                </div>
              </div>
            </div>
          </section>

          {/* Section: Notes */}
          <section className="bg-surface-container p-lg rounded-lg border border-outline-variant shadow-glow">
            <div className="flex items-center gap-sm mb-md">
              <span className="icon text-primary-container text-[20px]">sticky_note_2</span>
              <h2 className="font-technical text-[14px] font-bold text-text uppercase tracking-wider">OPERATIONAL NOTES</h2>
            </div>
            <textarea
              className="w-full bg-background border border-outline-variant rounded-lg px-md py-sm text-text focus:border-primary-container outline-none font-data text-[13px] transition-all resize-none"
              placeholder="Add specific internal notes about operative capabilities..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            ></textarea>
          </section>

          {/* Form Actions */}
          <div className="pt-md space-y-md">
            <button
              type="submit"
              disabled={loading || uploading}
              className={`w-full bg-primary-container hover:bg-primary text-on-primary-container font-label text-[13px] font-bold py-lg rounded-lg shadow-[0_0_12px_rgba(0,200,150,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-sm uppercase tracking-[0.2em] ${(loading || uploading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              <span className="icon">{loading ? 'sync' : 'save'}</span>
              {loading ? 'Transmitting Data...' : 'SAVE OPERATIVE RECORD'}
            </button>
            <div className="flex justify-center">
              <Link href="/admin/phlebotomists" className="text-outline hover:text-text font-label text-[11px] underline underline-offset-4 decoration-outline/30 transition-colors uppercase tracking-widest">
                Cancel & Return to Operative Directory
              </Link>
            </div>
          </div>
        </form>
      </div>

      {/* Footer Info */}
      <footer className="mt-xl text-center space-y-xs opacity-50">
        <p className="font-data text-[9px] text-outline uppercase tracking-tighter">HealthyCart Operational Logistics Framework</p>
        <p className="font-data text-[9px] text-outline">Terminal ID: DC-04-A | Logged as: sys_admin</p>
      </footer>
    </div>
  );
}
