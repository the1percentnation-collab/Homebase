import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                              Shared primitives                             */
/* -------------------------------------------------------------------------- */

export const idSchema = z.string().min(1);
export const isoDateSchema = z.string().datetime({ offset: true });
export const moneySchema = z.number().finite();

export const FREQUENCIES = [
  "once",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;
export const frequencySchema = z.enum(FREQUENCIES);

export const PRIORITIES = ["low", "medium", "high"] as const;
export const prioritySchema = z.enum(PRIORITIES);

export const baseEntitySchema = z.object({
  id: idSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

/* -------------------------------------------------------------------------- */
/*                                    Users                                   */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = ["owner", "partner", "child", "guest"] as const;
export const userRoleSchema = z.enum(USER_ROLES);

export const userSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  email: z.string().email().optional(),
  role: userRoleSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  avatarUrl: z.string().url().optional(),
});
export type User = z.infer<typeof userSchema>;

export const familyMemberSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  relation: z.enum(["self", "spouse", "child", "parent", "other"]),
  birthDate: z.string().date().optional(),
  linkedUserId: idSchema.optional(),
  notes: z.string().optional(),
});
export type FamilyMember = z.infer<typeof familyMemberSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Finances                                  */
/* -------------------------------------------------------------------------- */

export const EXPENSE_CATEGORIES = [
  "groceries",
  "dining",
  "transport",
  "utilities",
  "housing",
  "entertainment",
  "healthcare",
  "personal",
  "gifts",
  "education",
  "childcare",
  "pets",
  "travel",
  "subscriptions",
  "debt_payment",
  "savings",
  "other",
] as const;
export const expenseCategorySchema = z.enum(EXPENSE_CATEGORIES);
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

export const PAYMENT_METHODS = [
  "cash",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "check",
  "digital_wallet",
  "other",
] as const;
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export const EXPENSE_TAGS = ["essential", "discretionary"] as const;
export const expenseTagSchema = z.enum(EXPENSE_TAGS);

export const expenseSchema = baseEntitySchema.extend({
  userId: idSchema,
  amount: moneySchema.positive(),
  date: z.string().date(),
  category: expenseCategorySchema,
  subcategory: z.string().optional(),
  description: z.string().min(1),
  paymentMethod: paymentMethodSchema,
  tag: expenseTagSchema,
  labels: z.array(z.string()).default([]),
  notes: z.string().optional(),
  recurringId: idSchema.optional(),
  accountId: idSchema.optional(),
});
export type Expense = z.infer<typeof expenseSchema>;

export const recurringExpenseSchema = baseEntitySchema.extend({
  userId: idSchema,
  amount: moneySchema.positive(),
  category: expenseCategorySchema,
  description: z.string().min(1),
  frequency: frequencySchema,
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  nextDue: z.string().date(),
  paymentMethod: paymentMethodSchema,
  tag: expenseTagSchema,
  active: z.boolean().default(true),
});
export type RecurringExpense = z.infer<typeof recurringExpenseSchema>;

export const INCOME_SOURCES = [
  "salary",
  "freelance",
  "business",
  "investment",
  "rental",
  "gift",
  "refund",
  "other",
] as const;
export const incomeSourceSchema = z.enum(INCOME_SOURCES);

export const incomeSchema = baseEntitySchema.extend({
  userId: idSchema,
  source: incomeSourceSchema,
  sourceName: z.string().min(1),
  grossAmount: moneySchema.positive(),
  netAmount: moneySchema.positive(),
  date: z.string().date(),
  frequency: frequencySchema,
  nextPayDate: z.string().date().optional(),
  notes: z.string().optional(),
});
export type Income = z.infer<typeof incomeSchema>;

export const BUDGET_PERIODS = ["weekly", "monthly"] as const;
export const budgetPeriodSchema = z.enum(BUDGET_PERIODS);

export const budgetSchema = baseEntitySchema.extend({
  category: expenseCategorySchema,
  amount: moneySchema.positive(),
  period: budgetPeriodSchema,
  startDate: z.string().date(),
  rollover: z.boolean().default(false),
  alertThreshold: z.number().min(0).max(100).default(80),
  userId: idSchema.optional(),
});
export type Budget = z.infer<typeof budgetSchema>;

export const billSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  amount: moneySchema.positive(),
  dueDate: z.string().date(),
  frequency: frequencySchema,
  autopay: z.boolean().default(false),
  category: expenseCategorySchema,
  accountId: idSchema.optional(),
  renewalDate: z.string().date().optional(),
  cancelFlag: z.boolean().default(false),
  lastPaidDate: z.string().date().optional(),
  notes: z.string().optional(),
  userId: idSchema.optional(),
});
export type Bill = z.infer<typeof billSchema>;

export const GOAL_TYPES = [
  "emergency_fund",
  "vacation",
  "down_payment",
  "retirement",
  "education",
  "vehicle",
  "debt_payoff",
  "other",
] as const;
export const GOAL_HORIZONS = ["short", "mid", "long"] as const;

export const goalSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  type: z.enum(GOAL_TYPES),
  horizon: z.enum(GOAL_HORIZONS),
  targetAmount: moneySchema.positive(),
  currentAmount: moneySchema.nonnegative().default(0),
  deadline: z.string().date().optional(),
  monthlyContribution: moneySchema.nonnegative().optional(),
  notes: z.string().optional(),
  userId: idSchema.optional(),
});
export type Goal = z.infer<typeof goalSchema>;

export const DEBT_TYPES = [
  "credit_card",
  "student_loan",
  "mortgage",
  "auto_loan",
  "personal_loan",
  "medical",
  "other",
] as const;
export const PAYOFF_STRATEGIES = ["snowball", "avalanche", "custom"] as const;

export const debtSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  type: z.enum(DEBT_TYPES),
  balance: moneySchema.nonnegative(),
  originalBalance: moneySchema.nonnegative().optional(),
  interestRate: z.number().min(0).max(100),
  minPayment: moneySchema.nonnegative(),
  payoffDate: z.string().date().optional(),
  strategy: z.enum(PAYOFF_STRATEGIES).default("avalanche"),
  notes: z.string().optional(),
  userId: idSchema.optional(),
});
export type Debt = z.infer<typeof debtSchema>;

export const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "investment",
  "retirement",
  "credit_card",
  "cash",
  "other",
] as const;

export const accountSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES),
  institution: z.string().optional(),
  balance: moneySchema,
  asOfDate: z.string().date(),
  isAsset: z.boolean(),
  notes: z.string().optional(),
});
export type Account = z.infer<typeof accountSchema>;

export const netWorthSnapshotSchema = baseEntitySchema.extend({
  date: z.string().date(),
  assets: moneySchema.nonnegative(),
  liabilities: moneySchema.nonnegative(),
  netWorth: moneySchema,
});
export type NetWorthSnapshot = z.infer<typeof netWorthSnapshotSchema>;

/* -------------------------------------------------------------------------- */
/*                               Home management                              */
/* -------------------------------------------------------------------------- */

export const TASK_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export const taskStatusSchema = z.enum(TASK_STATUSES);

export const taskSchema = baseEntitySchema.extend({
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: idSchema.optional(),
  dueDate: z.string().date().optional(),
  priority: prioritySchema.default("medium"),
  status: taskStatusSchema.default("pending"),
  frequency: frequencySchema.default("once"),
  parentId: idSchema.optional(),
  completedAt: isoDateSchema.optional(),
  tags: z.array(z.string()).default([]),
});
export type Task = z.infer<typeof taskSchema>;

export const MAINTENANCE_CATEGORIES = [
  "hvac",
  "plumbing",
  "electrical",
  "appliance",
  "exterior",
  "yard",
  "cleaning",
  "safety",
  "seasonal",
  "other",
] as const;

export const maintenanceItemSchema = baseEntitySchema.extend({
  title: z.string().min(1),
  category: z.enum(MAINTENANCE_CATEGORIES),
  frequency: frequencySchema,
  lastDone: z.string().date().optional(),
  nextDue: z.string().date(),
  assigneeId: idSchema.optional(),
  notes: z.string().optional(),
});
export type MaintenanceItem = z.infer<typeof maintenanceItemSchema>;

export const INVENTORY_CATEGORIES = [
  "appliance",
  "electronics",
  "furniture",
  "tool",
  "vehicle",
  "jewelry",
  "other",
] as const;

export const inventoryItemSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  category: z.enum(INVENTORY_CATEGORIES),
  purchaseDate: z.string().date().optional(),
  purchasePrice: moneySchema.nonnegative().optional(),
  warrantyExpiry: z.string().date().optional(),
  serialNumber: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const PROJECT_STATUSES = [
  "planning",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export const projectSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(PROJECT_STATUSES).default("planning"),
  budget: moneySchema.nonnegative().optional(),
  spent: moneySchema.nonnegative().default(0),
  startDate: z.string().date().optional(),
  targetDate: z.string().date().optional(),
  contractorContactIds: z.array(idSchema).default([]),
  notes: z.string().optional(),
});
export type Project = z.infer<typeof projectSchema>;

export const SHOPPING_LIST_TYPES = [
  "grocery",
  "pantry",
  "household",
  "general",
] as const;

export const shoppingListSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  type: z.enum(SHOPPING_LIST_TYPES).default("grocery"),
  sharedUserIds: z.array(idSchema).default([]),
});
export type ShoppingList = z.infer<typeof shoppingListSchema>;

export const shoppingItemSchema = baseEntitySchema.extend({
  listId: idSchema,
  name: z.string().min(1),
  category: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  acquired: z.boolean().default(false),
  notes: z.string().optional(),
});
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export const mealSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  date: z.string().date(),
  mealType: z.enum(MEAL_TYPES),
  ingredients: z.array(z.string()).default([]),
  recipeUrl: z.string().url().optional(),
  notes: z.string().optional(),
});
export type Meal = z.infer<typeof mealSchema>;

/* -------------------------------------------------------------------------- */
/*                             Household & Family                             */
/* -------------------------------------------------------------------------- */

export const EVENT_CATEGORIES = [
  "appointment",
  "school",
  "activity",
  "birthday",
  "anniversary",
  "travel",
  "work",
  "general",
] as const;

export const familyEventSchema = baseEntitySchema.extend({
  title: z.string().min(1),
  start: isoDateSchema,
  end: isoDateSchema.optional(),
  allDay: z.boolean().default(false),
  category: z.enum(EVENT_CATEGORIES).default("general"),
  attendeeIds: z.array(idSchema).default([]),
  location: z.string().optional(),
  notes: z.string().optional(),
});
export type FamilyEvent = z.infer<typeof familyEventSchema>;

export const petSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  species: z.string().min(1),
  breed: z.string().optional(),
  birthDate: z.string().date().optional(),
  feedingSchedule: z.string().optional(),
  lastVetVisit: z.string().date().optional(),
  nextVetVisit: z.string().date().optional(),
  medications: z.array(z.string()).default([]),
  groomingSchedule: z.string().optional(),
  notes: z.string().optional(),
});
export type Pet = z.infer<typeof petSchema>;

export const vehicleSchema = baseEntitySchema.extend({
  nickname: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  vin: z.string().optional(),
  licensePlate: z.string().optional(),
  registrationExpiry: z.string().date().optional(),
  insuranceExpiry: z.string().date().optional(),
  lastOilChange: z.string().date().optional(),
  mileage: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});
export type Vehicle = z.infer<typeof vehicleSchema>;

export const CONTACT_ROLES = [
  "doctor",
  "dentist",
  "plumber",
  "electrician",
  "hvac",
  "contractor",
  "landscaper",
  "insurance_agent",
  "lawyer",
  "accountant",
  "emergency",
  "school",
  "other",
] as const;

export const contactSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  role: z.enum(CONTACT_ROLES),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  website: z.string().url().optional(),
  notes: z.string().optional(),
});
export type Contact = z.infer<typeof contactSchema>;

/* -------------------------------------------------------------------------- */
/*                               Records & Admin                              */
/* -------------------------------------------------------------------------- */

export const DOCUMENT_CATEGORIES = [
  "tax",
  "insurance",
  "warranty",
  "will",
  "passport",
  "id",
  "medical",
  "property",
  "vehicle",
  "financial",
  "other",
] as const;

export const documentSchema = baseEntitySchema.extend({
  title: z.string().min(1),
  category: z.enum(DOCUMENT_CATEGORIES),
  fileUrl: z.string().url().optional(),
  expiryDate: z.string().date().optional(),
  relatedMemberId: idSchema.optional(),
  uploadedByUserId: idSchema,
  notes: z.string().optional(),
});
export type Document = z.infer<typeof documentSchema>;

export const INSURANCE_TYPES = [
  "home",
  "auto",
  "health",
  "life",
  "disability",
  "umbrella",
  "pet",
  "other",
] as const;

export const insurancePolicySchema = baseEntitySchema.extend({
  type: z.enum(INSURANCE_TYPES),
  provider: z.string().min(1),
  policyNumber: z.string().min(1),
  premium: moneySchema.positive(),
  frequency: frequencySchema,
  renewalDate: z.string().date(),
  coverageAmount: moneySchema.nonnegative().optional(),
  agentContactId: idSchema.optional(),
  documentId: idSchema.optional(),
  notes: z.string().optional(),
});
export type InsurancePolicy = z.infer<typeof insurancePolicySchema>;

export const HEALTH_RECORD_TYPES = [
  "appointment",
  "medication",
  "claim",
  "vaccination",
  "allergy",
  "condition",
  "lab_result",
] as const;

export const healthRecordSchema = baseEntitySchema.extend({
  memberId: idSchema,
  type: z.enum(HEALTH_RECORD_TYPES),
  date: z.string().date(),
  provider: z.string().optional(),
  title: z.string().min(1),
  details: z.string().optional(),
  documentId: idSchema.optional(),
});
export type HealthRecord = z.infer<typeof healthRecordSchema>;

export const accountIndexSchema = baseEntitySchema.extend({
  service: z.string().min(1),
  username: z.string().optional(),
  url: z.string().url().optional(),
  category: z.string().optional(),
  twoFactor: z.boolean().default(false),
  notes: z.string().optional(),
});
export type AccountIndex = z.infer<typeof accountIndexSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Collections                               */
/* -------------------------------------------------------------------------- */

// Central registry of every persisted collection.
// Adding a collection here makes it available to the storage layer.
export const COLLECTIONS = {
  users: userSchema,
  familyMembers: familyMemberSchema,
  expenses: expenseSchema,
  recurringExpenses: recurringExpenseSchema,
  incomes: incomeSchema,
  budgets: budgetSchema,
  bills: billSchema,
  goals: goalSchema,
  debts: debtSchema,
  accounts: accountSchema,
  netWorthSnapshots: netWorthSnapshotSchema,
  tasks: taskSchema,
  maintenanceItems: maintenanceItemSchema,
  inventoryItems: inventoryItemSchema,
  projects: projectSchema,
  shoppingLists: shoppingListSchema,
  shoppingItems: shoppingItemSchema,
  meals: mealSchema,
  familyEvents: familyEventSchema,
  pets: petSchema,
  vehicles: vehicleSchema,
  contacts: contactSchema,
  documents: documentSchema,
  insurancePolicies: insurancePolicySchema,
  healthRecords: healthRecordSchema,
  accountIndex: accountIndexSchema,
} as const;

export type CollectionName = keyof typeof COLLECTIONS;
export type CollectionItem<K extends CollectionName> = z.infer<
  (typeof COLLECTIONS)[K]
>;
