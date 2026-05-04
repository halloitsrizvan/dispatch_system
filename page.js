'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, Save, Trees, ShieldCheck, Check, Camera, Send, MapPin, Home, Info, DollarSign, Hash, Map } from 'lucide-react';
import Image from 'next/image';

const AddProperty = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newAmenity, setNewAmenity] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        type: 'House',
        status: 'For Sale',
        price: '',
        priceAmount: '',
        location: '',
        area: '',
        description: '',
        path: '',
        water: [], // Borewell, Pipeline, Well
        amenities: [], // Gate applied, Tar Road Access, etc.
        images: [],
        featured: false,
        mapUrl: '',
    });

    const coreAmenities = [
        'Gate applied', 'Tar Road Access', '3 Phase Connection', 'Interlock', 'Garden',
        'Compound Wall', 'Solar Power', 'CCTV', 'Security', 'Waste Management'
    ];

    const waterOptions = ['Well', 'Borewell', 'Pipeline'];

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => {
            const amenities = prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity];
            return { ...prev, amenities };
        });
    };

    const handleWaterToggle = (source) => {
        setFormData(prev => {
            const water = prev.water.includes(source)
                ? prev.water.filter(w => w !== source)
                : [...prev.water, source];
            return { ...prev, water };
        });
    };

    const addCustomAmenity = (e) => {
        e.preventDefault();
        if (!newAmenity.trim()) return;
        if (!formData.amenities.includes(newAmenity.trim())) {
            setFormData(prev => ({
                ...prev,
                amenities: [...prev.amenities, newAmenity.trim()]
            }));
        }
        setNewAmenity('');
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new window.Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.8);
                };
            };
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (formData.images.length + files.length > 10) {
            alert('You can only upload up to 10 images per property.');
            return;
        }

        setUploading(true);

        try {
            for (const file of files) {
                // Compress image before upload
                const compressedFile = await compressImage(file);
                
                const data = new FormData();
                data.append('file', compressedFile);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: data,
                });

                const result = await res.json();
                if (result.success) {
                    setFormData(prev => ({
                        ...prev,
                        images: [...prev.images, result.url]
                    }));
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert(`Image upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Calculate priceAmount for sorting (simple logic for now)
            const priceVal = parseFloat(formData.price.replace(/[^\d.]/g, ''));
            // Example Logic: if "45 Lakhs" -> 4500000. This logic needs to be robust or manual input
            // For now, we manually ask input for priceAmount in form or auto-calc if simpler
            // Better to let user input pure number for sorting and formatted string for display.

            // Merge specialized fields into amenities array for storage as per request
            const finalAmenities = [...formData.amenities];
            if (formData.water.length > 0) {
                finalAmenities.push(`Water: ${formData.water.join(', ')}`);
            }
            if (formData.path) {
                finalAmenities.push(`Path: ${formData.path}`);
            }

            const payload = {
                ...formData,
                amenities: finalAmenities,
                priceAmount: parseInt(formData.priceAmount) || 0, // Ensure number
                // These are removed from form but sent as 0/empty to satisfy schema if needed
                beds: 0,
                baths: 0,
                parking: '',
                age: ''
            };

            const res = await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                router.push('/admin/properties');
            } else {
                alert('Failed to create property');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Error creating property');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Add New Property</h1>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">Property Title</label>
                        <input
                            id="title"
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. Luxury Villa in Edappal"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 outline-none"
                            suppressHydrationWarning={true}
                        />
                    </div>

                    <div>
                        <label htmlFor="price" className="block text-sm font-semibold text-slate-700 mb-2">Display Price</label>
                        <input
                            id="price"
                            type="text"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. ₹45 Lakhs"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 outline-none"
                            suppressHydrationWarning={true}
                        />
                    </div>

                    <div>
                        <label htmlFor="priceAmount" className="block text-sm font-semibold text-slate-700 mb-2">Numeric Price (for sorting)</label>
                        <input
                            id="priceAmount"
                            type="number"
                            name="priceAmount"
                            value={formData.priceAmount}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. 4500000"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 outline-none"
                            suppressHydrationWarning={true}
                        />
                    </div>

                    <div>
                        <label htmlFor="location" className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                        <input
                            id="location"
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. Amsakachery"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 outline-none"
                            suppressHydrationWarning={true}
                        />
                    </div>

                    <div>
                        <label htmlFor="mapUrl" className="block text-sm font-semibold text-slate-700 mb-2">Google Map Link (Embed/Share URL)</label>
                        <input
                            id="mapUrl"
                            type="text"
                            name="mapUrl"
                            value={formData.mapUrl}
                            onChange={handleInputChange}
                            placeholder="Paste Google Maps link here"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 outline-none"
                            suppressHydrationWarning={true}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Example: https://www.google.com/maps/embed?pb=...</p>
                    </div>

                    <div>
                        <label htmlFor="type" className="block text-sm font-semibold text-slate-700 mb-2">Property Type</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 outline-none bg-white"
                            suppressHydrationWarning={true}
                        >
                            <option>House</option>
                            <option>Plot</option>
                            <option>Commercial</option>
                            <option>Apartment</option>
                            <option>Villa</option>
                            <option>Vehicle</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 outline-none bg-white font-medium text-slate-700"
                            suppressHydrationWarning={true}
                        >
                            <option value="For Sale">For Sale</option>
                            <option value="Rent">For Rent</option>
                            <option value="Lease">For Lease</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="area" className="block text-sm font-semibold text-slate-700 mb-2">Area / Size</label>
                        <input
                            id="area"
                            type="text"
                            name="area"
                            value={formData.area}
                            onChange={handleInputChange}
                            placeholder="e.g. 1500 Sqft / 10 Cents"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 outline-none"
                            suppressHydrationWarning={true}
                        />
                    </div>
                </div>

                <hr className="border-slate-100" />
                
                {/* Section 3: Specialized Specifics */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                            <Trees size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Additional Specifics</h3>
                            <p className="text-sm text-slate-500">Utilities and access parameters.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-6">
                        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-violet-300 transition-colors">
                            <label className="block text-sm font-bold text-slate-800 mb-4">Water Source Available</label>
                            <div className="flex flex-wrap gap-2.5">
                                {waterOptions.map(opt => (
                                    <button type="button" key={opt} onClick={() => handleWaterToggle(opt)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2
                                        ${formData.water.includes(opt) ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                        {formData.water.includes(opt) && <Check size={14} strokeWidth={3} />}
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-violet-300 transition-colors">
                            <label className="block text-sm font-bold text-slate-800 mb-4">Road Access Type</label>
                            <input type="text" name="path" value={formData.path} onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none font-medium text-slate-700"
                                placeholder="e.g. 15ft Tar Road" suppressHydrationWarning />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-sm font-semibold text-slate-700">Detailed Description</label>
                        <textarea rows="5" name="description" value={formData.description} onChange={handleInputChange}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white transition-all outline-none resize-none font-medium text-slate-800 leading-relaxed"
                            placeholder="Write a compelling description highlighting the best features of your property..." required suppressHydrationWarning></textarea>
                    </div>
                </section>

                <hr className="border-slate-100" />

                {/* Section 4: Amenities */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                <ShieldCheck size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Amenities & Perks</h3>
                                <p className="text-sm text-slate-500">Select all that apply.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 relative">
                            <input type="text" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)}
                                placeholder="Add custom amenity..."
                                className="pl-4 pr-20 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none w-full sm:w-64" suppressHydrationWarning />
                            <button type="button" onClick={addCustomAmenity}
                                className="absolute right-1 top-1 bottom-1 bg-slate-900 text-white px-4 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors" suppressHydrationWarning>
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {coreAmenities.map(item => (
                            <button type="button" key={item} onClick={() => handleAmenityToggle(item)}
                                className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left group
                                ${formData.amenities.includes(item)
                                    ? 'bg-orange-50 border-orange-500 text-orange-900'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-orange-200 hover:bg-orange-50/30'}`}>
                                <span className="text-xs font-semibold">{item}</span>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors
                                    ${formData.amenities.includes(item) ? 'bg-orange-500 text-white' : 'bg-slate-100 text-transparent group-hover:bg-slate-200'}`}>
                                    <Check size={12} strokeWidth={4} />
                                </div>
                            </button>
                        ))}
                        {formData.amenities.filter(a => !coreAmenities.includes(a)).map(item => (
                            <div key={item} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-800 shadow-sm relative pr-10 overflow-hidden group">
                                <span className="text-xs font-semibold truncate z-10">{item}</span>
                                <button type="button" onClick={() => handleAmenityToggle(item)}
                                    className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors z-20">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Images */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-4">Property Images</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {formData.images.map((url, index) => (
                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm bg-slate-100">
                                <Image
                                    src={url}
                                    alt={`Property ${index}`}
                                    width={200}
                                    height={200}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {formData.images.length < 10 && (
                            <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-sky-500 hover:bg-sky-50 transition-all group">
                                {uploading ? (
                                    <Loader2 className="animate-spin text-sky-500" size={24} />
                                ) : (
                                    <>
                                        <Upload className="text-slate-400 group-hover:text-sky-500 mb-2" size={24} />
                                        <span className="text-xs text-slate-500 font-medium group-hover:text-sky-600">Upload Images</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        )}
                    </div>
                    <p className="text-xs text-slate-400">First image will be the cover image. You can upload up to 10 images.</p>
                </div>

                {/* Settings */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
                        />
                        <span className="font-semibold text-slate-700">Mark as Featured Property</span>
                    </label>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-sky-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 flex items-center gap-2"
                        suppressHydrationWarning
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Property
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProperty;
