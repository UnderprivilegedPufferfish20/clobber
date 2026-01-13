import { HomeIcon, DatabaseIcon, CoinsIcon, GitCompareArrows, ShoppingBasketIcon, BarChart3, Boxes, Database, GitBranch, Globe, Headphones, InfinityIcon, ServerCog, Shield, Sparkles, TestTube, Users, Zap, HashIcon, LucideIcon, TypeIcon, ToggleRightIcon, CurlyBracesIcon, BinaryIcon, FolderSymlinkIcon, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo, Presentation, DecimalsArrowLeft, DecimalsArrowLeftIcon, DecimalsArrowRightIcon, CalendarIcon, FingerprintIcon, SquareFunctionIcon, RadioIcon, ReceiptCentIcon, GlobeLockIcon, SendIcon, DoorClosedLockedIcon, DoorOpenIcon, MessageSquareIcon, UsersIcon, SettingsIcon, Binary, Braces, Calendar, Camera, Circle, Clock, Cpu, Crosshair, DollarSign, Fingerprint, Hash, Hexagon, Minus, Network, Route, ScrollText, Search, Sigma, Square, TextCursorInput, ToggleRight } from "lucide-react";
import { MapIcon, Key, CableIcon, RefreshCcwDotIcon, GitBranchIcon, CogIcon } from "lucide-react";
import { DATA_TYPES, DataTypeType } from "../types";


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
  { dtype: DATA_TYPES.BIGINT, description: "Signed 8-byte integer (alias: int8)", icon: Hash },
  { dtype: DATA_TYPES.BIGSERIAL, description: "Auto-incrementing 8-byte integer (alias: serial8)", icon: Hash },

  { dtype: DATA_TYPES.BIT, description: "Fixed-length bit string (bit(n))", icon: Binary },
  { dtype: DATA_TYPES.BIT_VARYING, description: "Variable-length bit string (varbit(n))", icon: Binary },

  { dtype: DATA_TYPES.BOOLEAN, description: "Logical boolean (true/false) (alias: bool)", icon: ToggleRight },

  { dtype: DATA_TYPES.BOX, description: "Rectangular box on a plane", icon: Square },
  { dtype: DATA_TYPES.BYTEA, description: 'Binary data ("byte array")', icon: Binary },

  { dtype: DATA_TYPES.CHARACTER, description: "Fixed-length character string (char(n))", icon: TextCursorInput },
  { dtype: DATA_TYPES.CHARACTER_VARYING, description: "Variable-length character string (varchar(n))", icon: TextCursorInput },

  { dtype: DATA_TYPES.CIDR, description: "IPv4/IPv6 network address", icon: Network },
  { dtype: DATA_TYPES.CIRCLE, description: "Circle on a plane", icon: Circle },

  { dtype: DATA_TYPES.DATE, description: "Calendar date (year, month, day)", icon: Calendar },

  { dtype: DATA_TYPES.DOUBLE_PRECISION, description: "Double precision floating-point (8 bytes) (alias: float8)", icon: Sigma },
  { dtype: DATA_TYPES.INET, description: "IPv4/IPv6 host address", icon: Globe },

  { dtype: DATA_TYPES.INTEGER, description: "Signed 4-byte integer (aliases: int, int4)", icon: Hash },
  { dtype: DATA_TYPES.INTERVAL, description: "Time span (interval [fields] [(p)])", icon: Clock },

  { dtype: DATA_TYPES.JSON, description: "Textual JSON data", icon: Braces },
  { dtype: DATA_TYPES.JSONB, description: "Binary JSON data (decomposed)", icon: Braces },

  { dtype: DATA_TYPES.LINE, description: "Infinite line on a plane", icon: Minus },
  { dtype: DATA_TYPES.LSEG, description: "Line segment on a plane", icon: Minus },

  { dtype: DATA_TYPES.MACADDR, description: "MAC (Media Access Control) address", icon: Cpu },
  { dtype: DATA_TYPES.MACADDR8, description: "MAC address (EUI-64 format)", icon: Cpu },

  { dtype: DATA_TYPES.MONEY, description: "Currency amount", icon: DollarSign },

  { dtype: DATA_TYPES.NUMERIC, description: "Exact numeric of selectable precision (numeric(p,s) / decimal(p,s))", icon: Sigma },

  { dtype: DATA_TYPES.PATH, description: "Geometric path on a plane", icon: Route },

  { dtype: DATA_TYPES.PG_LSN, description: "PostgreSQL Log Sequence Number", icon: ScrollText },
  { dtype: DATA_TYPES.PG_SNAPSHOT, description: "User-level transaction ID snapshot", icon: Camera },

  { dtype: DATA_TYPES.POINT, description: "Geometric point on a plane", icon: Crosshair },
  { dtype: DATA_TYPES.POLYGON, description: "Closed geometric path on a plane", icon: Hexagon },

  { dtype: DATA_TYPES.REAL, description: "Single precision floating-point (4 bytes) (alias: float4)", icon: Sigma },

  { dtype: DATA_TYPES.SMALLINT, description: "Signed 2-byte integer (alias: int2)", icon: Hash },
  { dtype: DATA_TYPES.SMALLSERIAL, description: "Auto-incrementing 2-byte integer (alias: serial2)", icon: Hash },
  { dtype: DATA_TYPES.SERIAL, description: "Auto-incrementing 4-byte integer (alias: serial4)", icon: Hash },

  { dtype: DATA_TYPES.TEXT, description: "Variable-length character string", icon: FileText },

  { dtype: DATA_TYPES.TIME, description: "Time of day (no time zone) (time(p))", icon: Clock },
  { dtype: DATA_TYPES.TIME_TZ, description: "Time of day, including time zone (alias: timetz)", icon: Clock },

  { dtype: DATA_TYPES.TIMESTAMP, description: "Date and time (no time zone) (timestamp(p))", icon: Calendar },
  { dtype: DATA_TYPES.TIMESTAMPTZ, description: "Date and time, including time zone (alias: timestamptz)", icon: Calendar },

  { dtype: DATA_TYPES.TSQUERY, description: "Text search query", icon: Search },
  { dtype: DATA_TYPES.TSVECTOR, description: "Text search document", icon: FileText },

  { dtype: DATA_TYPES.TXID_SNAPSHOT, description: "User-level transaction ID snapshot (deprecated; see pg_snapshot)", icon: Camera },

  { dtype: DATA_TYPES.UUID, description: "Universally unique identifier", icon: Fingerprint },
  { dtype: DATA_TYPES.XML, description: "XML data", icon: FileCode },
];