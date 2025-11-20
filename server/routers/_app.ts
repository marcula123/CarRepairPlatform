import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { db } from "../../db/drizzle";
import { cars, tasks, taskSuggestions, TaskStatus } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { generateTaskSuggestions } from "../services/ai";
import { carLookUp } from "../services/vegvesen";
const MAX_TASKS_PER_CAR = 10; // setter 10 som maksgrense per bil

export const appRouter = router({
  getCars: publicProcedure.query(async () => {
    return await db.select().from(cars).orderBy(desc(cars.id));
  }),

  getCarById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const [car] = await db
        .select()
        .from(cars)
        .where(eq(cars.id, input.id))
        .limit(1);
      if (!car) {
        throw new Error("Bil ikke funnet");
      }
      return car;
    }),

  createCar: publicProcedure
    .input(
      z.object({
        regNr: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const regNr = input.regNr.trim().toUpperCase();
      try {
        const information = await carLookUp(regNr);
        const [newCar] = await db
          .insert(cars)
          .values({
            regNr: input.regNr.toUpperCase(),
            make: information.make,
            model: information.model,
            year: information.year,
            color: information.color,
          })
          .returning();
        return newCar;
      } catch (error) {
        console.error("Feil ved oppslag:", error);
        throw new Error(
          "Fant ingen gyldig bil hos Statens vegvesen for dette registreringsnummeret."
        );
      }
    }),

  // Task Suggestions
  getTaskSuggestions: publicProcedure
    .input(z.object({ carId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await db
        .select()
        .from(taskSuggestions)
        .where(eq(taskSuggestions.carId, input.carId));
    }),

  fetchAISuggestions: publicProcedure
    .input(z.object({ carId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      // Get car information
      const [car] = await db
        .select()
        .from(cars)
        .where(eq(cars.id, input.carId))
        .limit(1);

      if (!car) {
        throw new Error("Bil ikke funnet");
      }

      // Generate AI suggestions
      const suggestions = await generateTaskSuggestions(car);

      // Save suggestions to database
      const insertedSuggestions = await db
        .insert(taskSuggestions)
        .values(
          suggestions.map((suggestion) => ({
            carId: input.carId,
            title: suggestion.title,
            description: suggestion.description,
            estimatedMinutes: suggestion.estimatedMinutes ?? null,
          }))
        )
        .returning();

      return insertedSuggestions;
    }),

  // Tasks
  getTasks: publicProcedure
    .input(z.object({ carId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await db.select().from(tasks).where(eq(tasks.carId, input.carId));
    }),

  createTask: publicProcedure
    .input(
      z.object({
        carId: z.number().int().positive(),
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        suggestionId: z.number().int().positive().optional().nullable(),
        estimatedMinutes: z
          .number()
          .int()
          .positive()
          .max(50 * 60)
          .optional()
          .nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const existingTasks = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.carId, input.carId));
      // gjør en sjekk på om antall tasks for bilen er lengre enn den satte maksgrensen på 10
      if (existingTasks.length >= MAX_TASKS_PER_CAR) {
        throw new Error(
          `Denne bilen har nådd maks antall oppgaver (${MAX_TASKS_PER_CAR}).`
        );
      }
      const [newTask] = await db
        .insert(tasks)
        .values({
          carId: input.carId,
          title: input.title,
          description: input.description ?? null,
          suggestionId: input.suggestionId ?? null,
          status: TaskStatus.PENDING,
          completed: false,
          estimatedMinutes: input.estimatedMinutes ?? null,
        })
        .returning();

      return newTask;
    }),

  updateTaskStatus: publicProcedure
    .input(
      z.object({
        taskId: z.number().int().positive(),
        status: z.nativeEnum(TaskStatus),
        completed: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [updatedTask] = await db
        .update(tasks)
        .set({
          status: input.status,
          completed: input.completed ?? input.status === TaskStatus.COMPLETED,
        })
        .where(eq(tasks.id, input.taskId))
        .returning();

      if (!updatedTask) {
        throw new Error("Oppgave ikke funnet");
      }

      return updatedTask;
    }),
  //Slette forslag

  deleteTaskSuggestion: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      // Finn forslaget
      const [suggestion] = await db
        .select()
        .from(taskSuggestions)
        .where(eq(taskSuggestions.id, input.id))
        .limit(1);

      if (!suggestion) {
        throw new Error("Oppgaveforslag ikke funnet");
      }

      // Sjekk om forslaget allerede er i bruk til en opprettet oppgave
      const linkedTasks = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.suggestionId, input.id));

      if (linkedTasks.length > 0) {
        throw new Error(
          "Kan ikke slette forslag som allerede er brukt til å opprette oppgaver."
        );
      }

      // Slett forslaget
      await db.delete(taskSuggestions).where(eq(taskSuggestions.id, input.id));

      return { success: true };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
