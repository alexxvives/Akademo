# Google Maps Places Autocomplete Setup

## 💰 Pricing (Effectively FREE)

**Free Tier**:
- $200/month free credit from Google Cloud
- Places Autocomplete: ~$0.007 per request
- **28,571 free autocomplete requests/month**
- Unless you have 900+ academies editing addresses daily, you won't pay

**Cost Example**:
- 100 academies × 2 address edits/month = 200 requests
- Cost: $1.40/month - **COVERED by free credit**

---

## 🔧 Setup Steps

### 1. Create Google Cloud Project

1. Go to: https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Project name: `AKADEMO`
4. Click "Create"

### 2. Enable Places API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for: `Places API`
3. Click **Enable**

### 3. Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the API key (e.g., `AIzaSyBxxx...`)

### 4. Restrict API Key (Security)

1. Click on the API key you just created
2. Under "Application restrictions":
   - Select **HTTP referrers (websites)**
   - Add:
     - `https://akademo-edu.com/*`
     - `http://localhost:3000/*` (for local testing)
3. Under "API restrictions":
   - Select **Restrict key**
   - Choose: **Places API**
4. Click **Save**

### 5. Add API Key to Environment

**In wrangler.toml** (root):
```toml
[vars]
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "AIzaSyBxxx..."
```

**Or via Cloudflare Dashboard**:
1. Go to Workers & Pages → akademo → Settings → Variables
2. Add environment variable:
   - Name: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: Your API key
3. Deploy

---

## 💻 Implementation Code

### Install Package (Optional - Using Script Tag Instead)

We'll load Google Maps via CDN to avoid bundle bloat:

```tsx
// No npm install needed!
```

### Update Profile Page

Add this component to `src/app/dashboard/academy/profile/page.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  disabled?: boolean;
}

function AddressAutocomplete({ value, onChange, disabled }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = initAutocomplete;
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (inputRef.current && window.google) {
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['formatted_address', 'geometry', 'name'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            onChange(place.formatted_address);
          }
        });
      }
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
        placeholder="Empieza a escribir tu dirección..."
      />
    </div>
  );
}
```

### Usage in Form

Replace the address input with:

```tsx
{/* Dirección */}
<div className="lg:col-span-1">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Dirección <span className="text-xs text-gray-500">(efectivo)</span>
  </label>
  {editing ? (
    <AddressAutocomplete
      value={formData.address}
      onChange={(address) => setFormData({ ...formData, address })}
      disabled={!editing}
    />
  ) : (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="text-gray-900 text-sm truncate">{academy.address || 'No especificada'}</span>
    </div>
  )}
</div>
```

---

## 🎯 How It Works

1. User clicks "Editar"
2. Starts typing address in input field
3. Google Maps shows autocomplete suggestions
4. User selects an address
5. Full formatted address saved to database

**User Experience**:
- Type "Calle Gran Via" → Shows "Calle Gran Via 123, Madrid, España"
- Click suggestion → Address fills automatically
- No need to type full address manually

---

## 🔍 Monitoring Usage

### Check API Usage

1. Go to: https://console.cloud.google.com/apis/dashboard
2. Select **Places API**
3. View usage graph

### Set Budget Alert

1. Go to **Billing** → **Budgets & alerts**
2. Create budget: $10/month
3. Set alert at 50%, 90%, 100%
4. You'll get email if approaching limit

---

## ⚡ Alternative: Native Browser Geolocation (100% FREE)

If you want completely free with no API:

```tsx
function useCurrentLocation() {
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding with free service (OpenStreetMap Nominatim)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          
          onChange(data.display_name);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return { handleGetLocation };
}
```

**Pros**: 100% free, no API key needed  
**Cons**: Less accurate, requires user permission, no autocomplete

---

## 📊 Recommendation

**For AKADEMO**:
- ✅ Use Google Maps Places API
- Free tier covers typical usage
- Better UX with autocomplete
- More accurate addresses
- Industry standard

**Cost Reality**:
- Even with 1,000 academies
- 2 address changes/month = 2,000 requests
- Cost: ~$14/month
- Still within $200 free credit if combined with other Google services

---

## ✅ Summary

1. **Setup**: 10 minutes
2. **Cost**: $0 (free tier)
3. **UX**: Professional autocomplete
4. **Security**: API key restricted to your domain

Let me know when you want to implement this!
