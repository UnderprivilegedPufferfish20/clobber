import { HomeIcon, DatabaseIcon, CoinsIcon, GitCompareArrows, ShoppingBasketIcon, BarChart3, Boxes, Database, GitBranch, Globe, Headphones, InfinityIcon, ServerCog, Shield, Sparkles, TestTube, Users, Zap, HashIcon, LucideIcon, TypeIcon, ToggleRightIcon, CurlyBracesIcon, BinaryIcon, FolderSymlinkIcon, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo, Presentation, DecimalsArrowLeft, DecimalsArrowLeftIcon, DecimalsArrowRightIcon, CalendarIcon, FingerprintIcon, SquareFunctionIcon, RadioIcon, ReceiptCentIcon, GlobeLockIcon, SendIcon, DoorClosedLockedIcon, DoorOpenIcon, MessageSquareIcon, UsersIcon, SettingsIcon } from "lucide-react";
import { MapIcon, Key, CableIcon, RefreshCcwDotIcon, GitBranchIcon, CogIcon } from "lucide-react";
import { DATA_TYPES, DataTypeType } from "../types";


export const DATA_TYPES_LIST = [
  'string',
  'integer',
  'float',
  'boolean',
  'datetime',
  "bytes",
  "JSON",
  "uuid"
] as const

export const FKEY_REFERENCED_ROW_ACTION_UPDATED_LIST = [
  "NO ACTION", 
  "CASCADE",
  'RESTRICT',
] as const

export const FKEY_REFERENCED_ROW_ACTION_DELETED_LIST = [
  "NO ACTION", 
  "CASCADE",
  'RESTRICT',
  "SET DEFAULT",
  "SET NULL"
] as const

export const FUNCTION_RETURN_TYPES_LIST = [
  'string',
  'integer',
  'float',
  'boolean',
  'datetime',
  "bytes",
  "JSON",
  "void",
  "record",
  "trigger"
] as const

export const SidebarRoutes = [
  {
    href: "",
    label: "Home",
    icon: HomeIcon,
  },
  {
    href: "/database",
    label: "Database",
    icon: DatabaseIcon,
  },


  {
    href: "/storage",
    label: "Storage",
    icon: FolderSymlinkIcon,
  },
    {
    href: "/auth",
    label: "Authentication",
    icon: FingerprintIcon,
  },
  {
    href: "/functions",
    label: "Edge Functions",
    icon: GlobeLockIcon,
  },
  {
    href: "/realtime",
    label: "Realtime",
    icon: RadioIcon,
  },


  {
    href: "/apis",
    label: "APIs",
    icon: SendIcon,
  },
  {
    href: "/gateway",
    label: "LLM Gateway",
    icon: DoorOpenIcon
  },
  {
    href: "/messaging",
    label: "Messaging",
    icon: MessageSquareIcon
  },


  {
    href: "/billing",
    label: "Billing",
    icon: ReceiptCentIcon,
  },
  {
    href: "/people",
    label: "People",
    icon: UsersIcon,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: SettingsIcon,
  }
]

export const DatabaseSidebarRoutes = [
  {
    href: "",
    label: "Home",
    icon: HomeIcon,
  },
  {
    href: "/schema",
    label: "Schema",
    icon: MapIcon,
  },
  {
    href: "/auth",
    label: "Auth",
    icon: Key,
  },
  {
    href: "/data-api",
    label: "API",
    icon: CableIcon,
  },
  {
    href: "/backups",
    label: "Backups",
    icon: RefreshCcwDotIcon,
  },
  {
    href: "/branches",
    label: "Branches",
    icon: GitBranchIcon,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: CogIcon,
  }
]

export const mimeTypeToIcon: Record<string, LucideIcon> = {
  // ─────────────────────────────
  // Documents / Text / Data
  // ─────────────────────────────
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,  // docx
  'application/pdf': FileText,
  'text/plain': FileText,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': Presentation,  // pptx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,  // xlsx

  // ─────────────────────────────
  // Images
  // ─────────────────────────────
  'image/jpeg': FileImage,
  'image/png': FileImage,
  'image/gif': FileImage,
  'image/svg+xml': FileImage,

  // ─────────────────────────────
  // Audio
  // ─────────────────────────────
  'audio/mpeg': FileAudio,   // mp3
  'audio/wav': FileAudio,

  // ─────────────────────────────
  // Video
  // ─────────────────────────────
  'video/mp4': FileVideo,
  'video/x-msvideo': FileVideo,  // avi

  // ─────────────────────────────
  // Web
  // ─────────────────────────────
  'text/html': FileCode,
  'text/css': FileCode,

  // ─────────────────────────────
  // Archives
  // ─────────────────────────────
  'application/zip': FileArchive,
  'application/x-rar-compressed': FileArchive,

  // Fallback
  'application/octet-stream': FileText,  // Unknown binary
};

export const PricePlans = {
    monthly: {
      name: "Professional",
      price: 29,
      description: "Ideal for growing businesses and teams",
      icon: <Zap className="w-6 h-6" />,
      features: [
        "Unlimited projects",
        "100GB storage",
        "Advanced analytics",
        "Priority support",
        "AI Auto restructure",
        "AI API Creation",
        "AI Schema Creations",
        "AI Data Pipelines",
        "AI Tests"
      ],
      popular: true,
      color: "border-indigo-500"
    },
    yearly: {
      name: "Professional",
      price: 290,
      originalPrice: 348,
      description: "Ideal for growing businesses and teams",
      icon: <Zap className="w-6 h-6" />,
      features: [
        "Unlimited projects",
        "100GB storage",
        "Advanced analytics",
        "Priority support",
        "AI Auto restructure",
        "AI API Creation",
        "AI Schema Creations",
        "AI Data Pipelines",
        "AI Tests"
      ],
      popular: true,
      color: "border-indigo-500"
    }
  };


export const HomepageAdditionalFeatures = [
    { icon: <Globe className="w-5 h-5" />, title: "Global CDN", description: "Lightning-fast content delivery worldwide" },
    { icon: <Shield className="w-5 h-5" />, title: "Enterprise Security", description: "Bank-level encryption and compliance" },
    { icon: <Users className="w-5 h-5" />, title: "Team Collaboration", description: "Real-time collaboration tools" },
    { icon: <Headphones className="w-5 h-5" />, title: "24/7 Support", description: "Round-the-clock expert assistance" }
];

export const HomepageStats = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 100ms", label: "Response Time" },
  { value: "150+", label: "Integrations" },
  { value: "50K+", label: "Happy Customers" }
];
export const HomepageFeatures = [
  {
    title: 'Unlimited Projects',
    description: 'Create, organize, and ship without limits. Spin up sandboxes or production apps on demand.',
    icon: InfinityIcon,
  },
  {
    title: '100GB Storage',
    description: 'Fast, encrypted storage with automatic tiering and instant snapshots.',
    icon: Database,
  },
  {
    title: 'Advanced Analytics',
    description: 'Real-time dashboards, cohort analysis, and anomaly detection out of the box.',
    icon: BarChart3,
  },
  {
    title: 'Priority Support',
    description: 'Direct access to senior engineers with <60s median response in critical windows.',
    icon: Headphones,
  },
  {
    title: 'AI Auto Restructure',
    description: 'Automatic schema refactors and index proposals to keep performance razor-sharp.',
    icon: Sparkles,
  },
  {
    title: 'AI API Creation',
    description: 'Generate secure, typed REST and GraphQL endpoints from your data models.',
    icon: ServerCog,
  },
  {
    title: 'AI Schema Creations',
    description: 'Describe your entities in plain English—get normalized, versioned schemas instantly.',
    icon: Boxes,
  },
  {
    title: 'AI Data Pipelines',
    description: 'Declarative ETL with error recovery, retries, and lineage tracking.',
    icon: GitBranch,
  },
  {
    title: 'AI Tests',
    description: 'Autogenerated unit and integration tests for queries, mutations, and jobs.',
    icon: TestTube,
  },
];


export const DTypes: DataTypeType[] = [
  {
    dtype: DATA_TYPES.STRING,
    description: "Variable-length character string",
    icon: TypeIcon
  },
  {
    dtype: DATA_TYPES.INT,
    description: "Signed integer",
    icon: HashIcon
  },
  {
    dtype: DATA_TYPES.FLOAT,
    description: "Any precision floating-point number",
    icon: DecimalsArrowRightIcon
  },
  {
    dtype: DATA_TYPES.BOOL,
    description: "Logical boolean (true/false)",
    icon: ToggleRightIcon
  },
  {
    dtype: DATA_TYPES.DateTime,
    description: "Date and time, including time zone",
    icon: CalendarIcon
  },
  {
    dtype: DATA_TYPES.JSON,
    description: "Textual JSON data",
    icon: CurlyBracesIcon
  },
  {
    dtype: DATA_TYPES.BYTES,
    description: "Variable-length binary string",
    icon: BinaryIcon
  },
  {
    dtype: DATA_TYPES.UUID,
    description: "Universally unique identifier",
    icon: FingerprintIcon
  }
  
]