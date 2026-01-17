# Admin Panel UI Redesign: shadcn/ui Migration

## Overview

Migrate the admin-panel from custom CSS (730 lines in `App.css`) to **shadcn/ui** with **Tailwind CSS** for a modern, polished design.

| Current State | Target State |
|---------------|--------------|
| React 19 + Vite | React 19 + Vite |
| No UI libraries | shadcn/ui components |
| Monolithic `App.css` (730 lines) | Tailwind utility classes |
| Custom components | Radix-based accessible components |

---

## Phase 1: Setup Tailwind + shadcn/ui

### 1.1 Install Dependencies

```bash
cd admin-panel

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p

# shadcn/ui dependencies
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
```

### 1.2 Create `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 1.3 Update `src/index.css`

Replace contents with Tailwind directives and CSS variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 20% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 239 84% 67%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;
    --secondary-foreground: 220 9% 46%;
    --muted: 220 14% 96%;
    --muted-foreground: 220 9% 46%;
    --accent: 226 100% 97%;
    --accent-foreground: 239 84% 67%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 239 84% 67%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 1.4 Configure Path Aliases

**Update `tsconfig.app.json`:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Update `vite.config.ts`:**
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### 1.5 Create `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### 1.6 Create `src/lib/utils.ts`

```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Phase 2: Install shadcn/ui Components

```bash
# Foundation
npx shadcn@latest add button input label card badge

# Forms & Feedback
npx shadcn@latest add alert textarea select skeleton

# Navigation
npx shadcn@latest add separator

# Data Display
npx shadcn@latest add table tabs dialog
```

Components will be installed to `src/components/ui/`.

---

## Phase 3: Page Migration Order

Migrate pages from simplest to most complex for incremental testing.

| # | Page | shadcn Components | Current CSS Lines |
|---|------|-------------------|-------------------|
| 1 | **Login** | Card, Input, Label, Button, Alert | 48-127 |
| 2 | **Dashboard** | Card, Badge | 247-333 |
| 3 | **Layout** | Button (ghost variant), Separator | 128-198 |
| 4 | **Guests** | Table, Input, Select, Badge, Button | 334-469 |
| 5 | **Broadcasts** | Card, Tabs, Dialog, Textarea, Button | 470-601 |
| 6 | **DressCode** | Keep separate CSS | 602-729 |

### 3.1 Login Page

**Before:**
```tsx
<div className="login-container">
  <div className="login-box">
    <form className="login-form">
      <div className="form-group">
        <label>Email</label>
        <input type="email" />
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
</div>
```

**After:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

<div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
  <Card className="w-full max-w-md">
    <CardHeader>
      <CardTitle className="text-2xl text-center">Wedding Jarvis Admin</CardTitle>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={...} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={...} />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </CardContent>
  </Card>
</div>
```

### 3.2 Dashboard Page

**Stats Grid with Cards:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        Total Guests
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{stats.totalGuests}</div>
    </CardContent>
  </Card>

  {/* Highlighted card */}
  <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-indigo-600">
        Opted In
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-indigo-700">{stats.optedIn}</div>
    </CardContent>
  </Card>
</div>
```

### 3.3 Layout Component

**Sidebar with Navigation:**
```tsx
import { NavLink } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Send, LogOut } from "lucide-react"

<aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r flex flex-col">
  <div className="p-5 border-b">
    <h1 className="text-lg font-bold text-primary">Wedding Jarvis</h1>
    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
  </div>

  <nav className="flex-1 py-4">
    <NavLink
      to="/"
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary border-r-2 border-primary"
          : "text-muted-foreground hover:bg-muted"
      )}
    >
      <LayoutDashboard className="h-4 w-4" />
      Dashboard
    </NavLink>
    {/* More nav links... */}
  </nav>

  <div className="p-4 border-t">
    <Button variant="destructive" className="w-full" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  </div>
</aside>

<main className="ml-60 p-8">
  <Outlet />
</main>
```

### 3.4 Guests Page

**Filters and Table:**
```tsx
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

{/* Filters */}
<div className="flex flex-wrap gap-3 mb-6">
  <Input
    placeholder="Search guests..."
    className="max-w-xs"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
  <Select value={optedInFilter} onValueChange={setOptedInFilter}>
    <SelectTrigger className="w-40">
      <SelectValue placeholder="Opted In" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All</SelectItem>
      <SelectItem value="true">Opted In</SelectItem>
      <SelectItem value="false">Opted Out</SelectItem>
    </SelectContent>
  </Select>
</div>

{/* Table */}
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Phone</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {guests.map((guest) => (
      <TableRow key={guest.id} className="hover:bg-muted/50">
        <TableCell className="font-medium">{guest.name}</TableCell>
        <TableCell>{guest.phone_number}</TableCell>
        <TableCell>
          <Badge variant={guest.opted_in ? "default" : "secondary"}>
            {guest.opted_in ? "Opted In" : "Opted Out"}
          </Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

{/* Pagination */}
<div className="flex items-center justify-between mt-4">
  <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
    Previous
  </Button>
  <span className="text-sm text-muted-foreground">Page {page + 1}</span>
  <Button variant="outline" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
    Next
  </Button>
</div>
```

### 3.5 Broadcasts Page

**Tabs and Dialog:**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

{/* Language Tabs */}
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="en">English *</TabsTrigger>
    <TabsTrigger value="hi">Hindi {formData.message_hi && "✓"}</TabsTrigger>
    <TabsTrigger value="pa">Punjabi {formData.message_pa && "✓"}</TabsTrigger>
  </TabsList>
  <TabsContent value="en">
    <Textarea
      value={formData.message_en}
      onChange={(e) => setFormData({...formData, message_en: e.target.value})}
      rows={6}
    />
  </TabsContent>
  {/* More tabs... */}
</Tabs>

{/* Preview Dialog */}
<Dialog open={showPreview} onOpenChange={setShowPreview}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Preview Broadcast</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <p>{previewMessage}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### 3.6 DressCode Page (Keep Separate)

The DressCode page has unique styling (gradients, elegant typography, color swatches) that differs from the admin interface. Keep its CSS separate:

1. Extract lines 602-729 from `App.css` to `src/pages/dress-code.css`
2. Import in DressCode.tsx: `import './dress-code.css'`

---

## Phase 4: Custom Badge Variants

shadcn Badge only has `default`, `secondary`, `destructive`, `outline`. Add custom variants for `success` and `warning`:

**Update `src/components/ui/badge.tsx`:**
```tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-800",
        warning: "border-transparent bg-amber-100 text-amber-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

---

## Color Scheme Mapping

| Current CSS Variable | Value | Tailwind Equivalent |
|---------------------|-------|---------------------|
| `--primary` | `#4f46e5` | `indigo-600` |
| `--primary-dark` | `#4338ca` | `indigo-700` |
| `--success` | `#22c55e` | `green-500` |
| `--danger` | `#ef4444` | `red-500` |
| `--warning` | `#f59e0b` | `amber-500` |
| `--bg` | `#f9fafb` | `gray-50` |
| `--border` | `#e5e7eb` | `gray-200` |
| `--text` | `#111827` | `gray-900` |
| `--text-light` | `#6b7280` | `gray-500` |

---

## Gotchas & Breaking Changes

### Select Component API
```tsx
// Before (HTML select)
<select value={filter} onChange={(e) => setFilter(e.target.value)}>

// After (shadcn Select)
<Select value={filter} onValueChange={setFilter}>
```

### NavLink with shadcn
React Router's `NavLink` needs manual className handling:
```tsx
<NavLink
  to="/guests"
  className={({ isActive }) => cn(
    "...",
    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
  )}
>
```

### Table Row Hover
Add hover state manually:
```tsx
<TableRow className="hover:bg-muted/50">
```

---

## Final Cleanup

After all pages migrated:
1. Delete `src/App.css`
2. Verify `src/pages/dress-code.css` is imported in DressCode.tsx
3. Remove any unused CSS imports from `App.tsx`

---

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] Login page renders and authentication works
- [ ] Dashboard stats display correctly
- [ ] Sidebar navigation works with active states
- [ ] Guests table with filters and pagination works
- [ ] Broadcasts tabs, form, and preview dialog work
- [ ] DressCode page retains its unique styling
- [ ] Responsive layout works on mobile
