import { createClient } from "@/lib/supabase/server";
import { getReadableSections } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";

export type NavItem = {
  type: "item";
  href: string;
  label: string;
  activeColor: string;
  section: string;
};

export type NavGroup = {
  type: "group";
  label: string;
};

export type NavEntry = NavItem | NavGroup;

const ACTIVE = "bg-[#FFD600] text-[#1A1A1A] border-l-4 border-[#1A1A1A]";

const ALL_NAV_ENTRIES: NavEntry[] = [
  { type: "item", href: "/admin",                     label: "Dashboard",      activeColor: ACTIVE, section: "dashboard" },
  { type: "item", href: "/admin/homepage",            label: "Homepage",       activeColor: ACTIVE, section: "homepage"  },
  { type: "item", href: "/admin/products",            label: "Products",       activeColor: ACTIVE, section: "products"  },
  { type: "item", href: "/admin/categories",          label: "Categories",     activeColor: ACTIVE, section: "products"  },
  { type: "item", href: "/admin/events",              label: "Events & Sales", activeColor: ACTIVE, section: "events"    },
  { type: "item", href: "/admin/shipping",            label: "Shipping",       activeColor: ACTIVE, section: "shipping"  },
  { type: "item", href: "/admin/orders",              label: "Orders",         activeColor: ACTIVE, section: "orders"    },
  { type: "item", href: "/admin/customers",           label: "Customers",      activeColor: ACTIVE, section: "customers" },
  { type: "item", href: "/admin/revenue",             label: "Revenue",        activeColor: ACTIVE, section: "analytics" },
  { type: "item", href: "/admin/analytics",           label: "Analytics",      activeColor: ACTIVE, section: "analytics" },
  { type: "item", href: "/admin/reviews",             label: "Reviews",        activeColor: ACTIVE, section: "reviews"   },
  { type: "item", href: "/admin/contact",             label: "Contact",        activeColor: ACTIVE, section: "contact"   },
  { type: "group", label: "NAILS" },
  { type: "item", href: "/admin/nails/homepage",      label: "Homepage",       activeColor: ACTIVE, section: "nails" },
  { type: "item", href: "/admin/nails/products",      label: "Products",       activeColor: ACTIVE, section: "nails" },
  { type: "item", href: "/admin/nails/custom-orders", label: "Custom Orders",  activeColor: ACTIVE, section: "nails" },
  { type: "item", href: "/admin/nails/sizing-kits",   label: "Sizing Kits",    activeColor: ACTIVE, section: "nails" },
  { type: "item", href: "/admin/nails/materials",     label: "Materials",      activeColor: ACTIVE, section: "nails" },
  { type: "item", href: "/admin/nails/pricing",       label: "Pricing",        activeColor: ACTIVE, section: "nails" },
  { type: "item", href: "/admin/settings",            label: "Settings",       activeColor: ACTIVE, section: "settings"  },
  { type: "item", href: "/admin/team",                label: "Team",           activeColor: ACTIVE, section: "team"      },
];

// Keeps items whose section is readable; keeps group labels only when
// at least one item following the label in the same group is visible.
function filterEntries(entries: NavEntry[], sectionSet: Set<string>): NavEntry[] {
  const result: NavEntry[] = [];
  let pendingGroup: NavGroup | null = null;

  for (const entry of entries) {
    if (entry.type === "group") {
      pendingGroup = entry;
    } else {
      if (sectionSet.has(entry.section)) {
        if (pendingGroup) {
          result.push(pendingGroup);
          pendingGroup = null;
        }
        result.push(entry);
      }
    }
  }

  return result;
}

interface Props {
  role: UserRole;
}

export default async function AdminSidebar({ role }: Props) {
  const supabase = await createClient();
  const readableSections = await getReadableSections(supabase, role);
  const sectionSet = new Set(readableSections);

  const visibleEntries = filterEntries(ALL_NAV_ENTRIES, sectionSet);

  return <AdminSidebarNav entries={visibleEntries} />;
}
