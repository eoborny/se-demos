// Types and mock data for the Workday-style hiring & onboarding app.
// Uses in-memory mock data (no backend connected).

export type HiringStatus =
  | "Offer Accepted"
  | "Pre-boarding"
  | "Onboarding"
  | "Active"

export type EmploymentType = "Full-time" | "Part-time" | "Contract"

export interface OnboardingTask {
  id: string
  label: string
  completed: boolean
}

export type DocumentCategory =
  | "Identification"
  | "Tax Form"
  | "Contract"
  | "Certification"
  | "Other"

export interface EmployeeDocument {
  id: string
  name: string
  category: DocumentCategory
  sizeLabel: string
  uploadedAt: string // ISO date
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  department: string
  jobTitle: string
  manager: string
  location: string
  employmentType: EmploymentType
  startDate: string // ISO date
  status: HiringStatus
  tasks: OnboardingTask[]
  documents: EmployeeDocument[]
}

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Finance",
  "People Ops",
  "Customer Success",
] as const

export const LOCATIONS = [
  "San Francisco, CA",
  "New York, NY",
  "Austin, TX",
  "Remote - US",
  "London, UK",
  "Berlin, DE",
] as const

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  "Full-time",
  "Part-time",
  "Contract",
]

export const HIRING_STATUSES: HiringStatus[] = [
  "Offer Accepted",
  "Pre-boarding",
  "Onboarding",
  "Active",
]

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "Identification",
  "Tax Form",
  "Contract",
  "Certification",
  "Other",
]

// Default onboarding checklist applied to every new hire.
export const DEFAULT_TASK_TEMPLATE: { key: string; label: string }[] = [
  { key: "offer", label: "Signed offer letter received" },
  { key: "bgcheck", label: "Background check completed" },
  { key: "i9", label: "I-9 / work authorization verified" },
  { key: "payroll", label: "Payroll & tax setup" },
  { key: "equipment", label: "Equipment ordered & shipped" },
  { key: "accounts", label: "System accounts provisioned" },
  { key: "orientation", label: "Orientation session scheduled" },
  { key: "buddy", label: "Onboarding buddy assigned" },
]

export function buildDefaultTasks(): OnboardingTask[] {
  return DEFAULT_TASK_TEMPLATE.map((t) => ({
    id: `${t.key}-${Math.random().toString(36).slice(2, 8)}`,
    label: t.label,
    completed: false,
  }))
}

export function onboardingProgress(employee: Employee): number {
  if (employee.tasks.length === 0) return 0
  const done = employee.tasks.filter((t) => t.completed).length
  return Math.round((done / employee.tasks.length) * 100)
}

function tasksFrom(completedKeys: string[]): OnboardingTask[] {
  return DEFAULT_TASK_TEMPLATE.map((t) => ({
    id: `${t.key}-seed`,
    label: t.label,
    completed: completedKeys.includes(t.key),
  }))
}

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "emp-001",
    firstName: "Ava",
    lastName: "Nguyen",
    email: "ava.nguyen@acme.com",
    department: "Engineering",
    jobTitle: "Senior Software Engineer",
    manager: "Daniel Cho",
    location: "San Francisco, CA",
    employmentType: "Full-time",
    startDate: "2025-07-14",
    status: "Onboarding",
    tasks: tasksFrom(["offer", "bgcheck", "i9", "payroll", "equipment"]),
    documents: [
      {
        id: "doc-1",
        name: "Signed_Offer_Letter.pdf",
        category: "Contract",
        sizeLabel: "182 KB",
        uploadedAt: "2025-06-20",
      },
      {
        id: "doc-2",
        name: "Passport_Scan.pdf",
        category: "Identification",
        sizeLabel: "1.2 MB",
        uploadedAt: "2025-06-22",
      },
    ],
  },
  {
    id: "emp-002",
    firstName: "Marcus",
    lastName: "Bell",
    email: "marcus.bell@acme.com",
    department: "Sales",
    jobTitle: "Account Executive",
    manager: "Priya Raman",
    location: "New York, NY",
    employmentType: "Full-time",
    startDate: "2025-07-28",
    status: "Pre-boarding",
    tasks: tasksFrom(["offer", "bgcheck"]),
    documents: [
      {
        id: "doc-3",
        name: "Offer_Letter.pdf",
        category: "Contract",
        sizeLabel: "160 KB",
        uploadedAt: "2025-06-30",
      },
    ],
  },
  {
    id: "emp-003",
    firstName: "Sofia",
    lastName: "Ramos",
    email: "sofia.ramos@acme.com",
    department: "Design",
    jobTitle: "Product Designer",
    manager: "Elena Sokolova",
    location: "Remote - US",
    employmentType: "Full-time",
    startDate: "2025-06-16",
    status: "Active",
    tasks: tasksFrom([
      "offer",
      "bgcheck",
      "i9",
      "payroll",
      "equipment",
      "accounts",
      "orientation",
      "buddy",
    ]),
    documents: [
      {
        id: "doc-4",
        name: "W4_2025.pdf",
        category: "Tax Form",
        sizeLabel: "98 KB",
        uploadedAt: "2025-06-01",
      },
      {
        id: "doc-5",
        name: "Drivers_License.jpg",
        category: "Identification",
        sizeLabel: "820 KB",
        uploadedAt: "2025-06-02",
      },
    ],
  },
  {
    id: "emp-004",
    firstName: "Liam",
    lastName: "O'Connor",
    email: "liam.oconnor@acme.com",
    department: "Product",
    jobTitle: "Product Manager",
    manager: "Daniel Cho",
    location: "Austin, TX",
    employmentType: "Full-time",
    startDate: "2025-08-04",
    status: "Offer Accepted",
    tasks: tasksFrom(["offer"]),
    documents: [],
  },
  {
    id: "emp-005",
    firstName: "Yuki",
    lastName: "Tanaka",
    email: "yuki.tanaka@acme.com",
    department: "Marketing",
    jobTitle: "Content Strategist",
    manager: "Priya Raman",
    location: "Remote - US",
    employmentType: "Contract",
    startDate: "2025-07-07",
    status: "Onboarding",
    tasks: tasksFrom(["offer", "i9", "accounts"]),
    documents: [
      {
        id: "doc-6",
        name: "Contractor_Agreement.pdf",
        category: "Contract",
        sizeLabel: "210 KB",
        uploadedAt: "2025-06-18",
      },
    ],
  },
  {
    id: "emp-006",
    firstName: "Grace",
    lastName: "Adeyemi",
    email: "grace.adeyemi@acme.com",
    department: "Finance",
    jobTitle: "Financial Analyst",
    manager: "Robert King",
    location: "London, UK",
    employmentType: "Full-time",
    startDate: "2025-07-21",
    status: "Pre-boarding",
    tasks: tasksFrom(["offer", "bgcheck", "payroll"]),
    documents: [
      {
        id: "doc-7",
        name: "Right_To_Work.pdf",
        category: "Identification",
        sizeLabel: "540 KB",
        uploadedAt: "2025-06-25",
      },
    ],
  },
  {
    id: "emp-007",
    firstName: "Noah",
    lastName: "Weber",
    email: "noah.weber@acme.com",
    department: "Engineering",
    jobTitle: "DevOps Engineer",
    manager: "Daniel Cho",
    location: "Berlin, DE",
    employmentType: "Full-time",
    startDate: "2025-08-11",
    status: "Offer Accepted",
    tasks: tasksFrom([]),
    documents: [],
  },
  {
    id: "emp-008",
    firstName: "Isabella",
    lastName: "Rossi",
    email: "isabella.rossi@acme.com",
    department: "Customer Success",
    jobTitle: "Customer Success Manager",
    manager: "Elena Sokolova",
    location: "New York, NY",
    employmentType: "Full-time",
    startDate: "2025-06-30",
    status: "Active",
    tasks: tasksFrom([
      "offer",
      "bgcheck",
      "i9",
      "payroll",
      "equipment",
      "accounts",
      "orientation",
      "buddy",
    ]),
    documents: [
      {
        id: "doc-8",
        name: "Signed_NDA.pdf",
        category: "Contract",
        sizeLabel: "120 KB",
        uploadedAt: "2025-06-10",
      },
    ],
  },
]
