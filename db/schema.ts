import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export const cars = sqliteTable("cars", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  regNr: text("reg_nr").notNull().unique(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const taskSuggestions = sqliteTable("task_suggestions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  carId: integer("car_id")
    .notNull()
    .references(() => cars.id),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  estimatedMinutes: integer("estimated_minutes"),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  carId: integer("car_id")
    .notNull()
    .references(() => cars.id),
  title: text("title").notNull(),
  description: text("description"),
  suggestionId: integer("suggestion_id").references(() => taskSuggestions.id),
  status: text("status", { enum: ["pending", "in_progress", "completed"] })
    .notNull()
    .default(TaskStatus.PENDING)
    .$type<TaskStatus>(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});
