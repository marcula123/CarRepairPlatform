"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TaskStatus } from "@/db/schema";

export default function CarPage() {
  const { id } = useParams() as { id: string };
  const carId = parseInt(id);
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskEstimate, setTaskEstimate] = useState<string>("");

  const {
    data: car,
    isLoading,
    error,
  } = trpc.getCarById.useQuery({ id: carId });

  const { data: suggestions, refetch: refetchSuggestions } =
    trpc.getTaskSuggestions.useQuery({ carId }, { enabled: !!carId });

  const { data: tasks, refetch: refetchTasks } = trpc.getTasks.useQuery(
    { carId },
    { enabled: !!carId }
  );
  const pendingTasks = (tasks ?? []).filter(
    (t) => t.status === TaskStatus.PENDING
  );
  const inProgressTasks = (tasks ?? []).filter(
    (t) => t.status === TaskStatus.IN_PROGRESS
  );
  const completedTasks = (tasks ?? []).filter(
    (t) => t.status === TaskStatus.COMPLETED
  );

  const fetchAISuggestions = trpc.fetchAISuggestions.useMutation({
    onSuccess: () => {
      refetchSuggestions();
    },
  });

  const createTask = trpc.createTask.useMutation({
    onSuccess: () => {
      setTaskTitle("");
      setTaskDescription("");
      setShowCreateTaskForm(false);
      refetchTasks();
      setTaskEstimate("");
    },
  });

  const updateTaskStatus = trpc.updateTaskStatus.useMutation({
    onSuccess: () => {
      refetchTasks();
    },
  });
  const deleteTaskSuggestion = trpc.deleteTaskSuggestion.useMutation({
    onSuccess: () => {
      refetchSuggestions();
    },
  });

  const handleCreateTaskFromSuggestion = (suggestionId: number) => {
    const suggestion = suggestions?.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    createTask.mutate({
      carId,
      title: suggestion.title,
      description: suggestion.description ?? undefined,
      suggestionId,
      estimatedMinutes:
        typeof suggestion.estimatedMinutes === "number"
          ? suggestion.estimatedMinutes
          : undefined,
    });
  };
  const handleDeleteSuggestion = (suggestionId: number) => {
    deleteTaskSuggestion.mutate({ id: suggestionId });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      createTask.mutate({
        carId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        estimatedMinutes:
          taskEstimate.trim() === ""
            ? undefined
            : Number.parseInt(taskEstimate, 10),
      });
    }
  };

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    updateTaskStatus.mutate({
      taskId,
      status: newStatus,
    });
  };

  if (isLoading) {
    return (
      <main className="p-8 max-w-2xl mx-auto">
        <div className="p-8 text-center text-gray-600">
          Laster bildetaljer...
        </div>
      </main>
    );
  }

  if (error || !car) {
    return (
      <main className="p-8 max-w-2xl mx-auto">
        <div className="p-8 bg-red-50 text-red-600 rounded-lg mb-4">
          <p className="m-0 mb-4">{error?.message || "Bil ikke funnet"}</p>
          <Link href="/" className="text-blue-600 underline">
            ← Tilbake til biliste
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <Link href="/" className="inline-block mb-8 text-blue-600 no-underline">
        ← Tilbake til biliste
      </Link>

      <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg">
        <h1 className="text-2xl mb-8">Bildetaljer</h1>

        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
          <div>
            <div className="text-sm text-gray-600 mb-2 uppercase tracking-wider">
              Registreringsnummer
            </div>
            <div className="text-2xl font-bold">{car.regNr}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2 uppercase tracking-wider">
              Merke
            </div>
            <div className="text-xl font-medium">{car.make}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2 uppercase tracking-wider">
              Modell
            </div>
            <div className="text-xl font-medium">{car.model}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2 uppercase tracking-wider">
              År
            </div>
            <div className="text-xl">{car.year}</div>
          </div>

          {car.color && (
            <div>
              <div className="text-sm text-gray-600 mb-2 uppercase tracking-wider">
                Farge
              </div>
              <div className="text-xl">{car.color}</div>
            </div>
          )}

          {car.createdAt && (
            <div>
              <div className="text-sm text-gray-600 mb-2 uppercase tracking-wider">
                Lagt til i register
              </div>
              <div className="text-base text-gray-600">
                {new Date(car.createdAt).toLocaleString("no-NO")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Suggestions Section */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Oppgaveforslag</h2>
          <button
            onClick={() => fetchAISuggestions.mutate({ carId })}
            disabled={fetchAISuggestions.isPending}
            className="px-4 py-2 text-sm bg-purple-600 text-white border-none rounded whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer hover:bg-purple-700 transition-colors"
          >
            {fetchAISuggestions.isPending
              ? "Henter forslag..."
              : "Hent AI-forslag"}
          </button>
        </div>

        {fetchAISuggestions.error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">
            <p className="m-0">Feil: {fetchAISuggestions.error.message}</p>
          </div>
        )}
        {deleteTaskSuggestion.error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">
            <p className="m-0">
              Feil ved sletting: {deleteTaskSuggestion.error.message}
            </p>
          </div>
        )}

        {!suggestions || suggestions.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
            Ingen forslag ennå. Klikk på &quot;Hent AI-forslag&quot; for å
            generere forslag.
          </div>
        ) : (
          <div className="grid gap-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {suggestion.title}
                  </h3>
                  {suggestion.description && (
                    <p className="text-gray-600 m-0">
                      {suggestion.description}
                    </p>
                  )}
                  {typeof suggestion.estimatedMinutes === "number" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Anslått tid: {suggestion.estimatedMinutes} min
                    </p>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      handleCreateTaskFromSuggestion(suggestion.id)
                    }
                    disabled={createTask.isPending}
                    className="px-4 py-2 text-sm bg-purple-600 text-white border-none rounded whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer hover:bg-purple-700 transition-colors"
                  >
                    Opprett oppgave
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSuggestion(suggestion.id)}
                    disabled={deleteTaskSuggestion.isPending}
                    className="px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    Slett
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tasks Section */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Oppgaver</h2>
          <button
            onClick={() => setShowCreateTaskForm(!showCreateTaskForm)}
            className="px-4 py-2 text-sm bg-blue-600 text-white border-none rounded whitespace-nowrap cursor-pointer hover:bg-blue-700 transition-colors"
          >
            {showCreateTaskForm ? "Avbryt" : "+ Opprett oppgave"}
          </button>
        </div>

        {showCreateTaskForm && (
          <form
            onSubmit={handleCreateTask}
            className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div className="mb-4">
              <label
                htmlFor="task-title"
                className="block text-sm font-medium mb-2"
              >
                Tittel *
              </label>
              <input
                id="task-title"
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                disabled={createTask.isPending}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded"
                placeholder="F.eks. Service"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="task-description"
                className="block text-sm font-medium mb-2"
              >
                Beskrivelse
              </label>
              <textarea
                id="task-description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                disabled={createTask.isPending}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded"
                placeholder="Beskrivelse av oppgaven..."
                rows={3}
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="task-title"
                className="block text-sm font-medium mb-2"
              >
                Tidsestimat
              </label>
              <input
                id="task-estimate"
                type="number"
                value={taskEstimate}
                onChange={(e) => setTaskEstimate(e.target.value)}
                disabled={createTask.isPending}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded"
                placeholder="F.eks. 45"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createTask.isPending || !taskTitle.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white border-none rounded disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer hover:bg-blue-700 transition-colors"
              >
                {createTask.isPending ? "Oppretter..." : "Opprett oppgave"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateTaskForm(false);
                  setTaskTitle("");
                  setTaskDescription("");
                }}
                className="px-4 py-2 text-sm bg-gray-300 text-gray-700 border-none rounded cursor-pointer hover:bg-gray-400 transition-colors"
              >
                Avbryt
              </button>
            </div>
            {createTask.error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded text-sm">
                Feil: {createTask.error.message}
              </div>
            )}
          </form>
        )}

        {!tasks || tasks.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
            Ingen oppgaver ennå. Opprett en oppgave eller konverter et forslag
            til oppgave.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Venter */}
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Venter ({pendingTasks.length})
                </h3>
                <div className="grid gap-3">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-lg ${
                        task.status === TaskStatus.COMPLETED
                          ? "bg-green-50 border-green-200"
                          : task.status === TaskStatus.IN_PROGRESS
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-gray-600 m-0 mb-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                            <span>
                              Status:{" "}
                              <span className="font-medium">
                                {task.status === TaskStatus.PENDING
                                  ? "Venter"
                                  : task.status === TaskStatus.IN_PROGRESS
                                  ? "Pågår"
                                  : "Fullført"}
                              </span>
                            </span>
                            {task.createdAt && (
                              <span>
                                Opprettet:{" "}
                                {new Date(task.createdAt).toLocaleDateString(
                                  "no-NO"
                                )}
                              </span>
                            )}
                            {typeof task.estimatedMinutes === "number" && (
                              <span>
                                Tidsestimat:{" "}
                                <span className="font-medium">
                                  {task.estimatedMinutes} min
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, TaskStatus.PENDING)
                          }
                          disabled={
                            updateTaskStatus.isPending ||
                            task.status === TaskStatus.PENDING
                          }
                          className={`px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                            task.status === TaskStatus.PENDING
                              ? "bg-gray-200 text-gray-700 border-gray-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          Venter
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, TaskStatus.IN_PROGRESS)
                          }
                          disabled={
                            updateTaskStatus.isPending ||
                            task.status === TaskStatus.IN_PROGRESS
                          }
                          className={`px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                            task.status === TaskStatus.IN_PROGRESS
                              ? "bg-yellow-200 text-yellow-800 border-yellow-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-yellow-50"
                          }`}
                        >
                          Pågår
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, TaskStatus.COMPLETED)
                          }
                          disabled={
                            updateTaskStatus.isPending ||
                            task.status === TaskStatus.COMPLETED
                          }
                          className={`px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                            task.status === TaskStatus.COMPLETED
                              ? "bg-green-200 text-green-800 border-green-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-green-50"
                          }`}
                        >
                          Fullført
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pågår */}
            {inProgressTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Pågår ({inProgressTasks.length})
                </h3>
                <div className="grid gap-3">
                  {inProgressTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-lg ${
                        task.status === TaskStatus.COMPLETED
                          ? "bg-green-50 border-green-200"
                          : task.status === TaskStatus.IN_PROGRESS
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-gray-600 m-0 mb-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                            <span>
                              Status:{" "}
                              <span className="font-medium">
                                {task.status === TaskStatus.PENDING
                                  ? "Venter"
                                  : task.status === TaskStatus.IN_PROGRESS
                                  ? "Pågår"
                                  : "Fullført"}
                              </span>
                            </span>
                            {task.createdAt && (
                              <span>
                                Opprettet:{" "}
                                {new Date(task.createdAt).toLocaleDateString(
                                  "no-NO"
                                )}
                              </span>
                            )}
                            {typeof task.estimatedMinutes === "number" && (
                              <span>
                                Tidsestimat:{" "}
                                <span className="font-medium">
                                  {task.estimatedMinutes} min
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, TaskStatus.PENDING)
                          }
                          disabled={
                            updateTaskStatus.isPending ||
                            task.status === TaskStatus.PENDING
                          }
                          className={`px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                            task.status === TaskStatus.PENDING
                              ? "bg-gray-200 text-gray-700 border-gray-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          Venter
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, TaskStatus.IN_PROGRESS)
                          }
                          disabled={
                            updateTaskStatus.isPending ||
                            task.status === TaskStatus.IN_PROGRESS
                          }
                          className={`px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                            task.status === TaskStatus.IN_PROGRESS
                              ? "bg-yellow-200 text-yellow-800 border-yellow-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-yellow-50"
                          }`}
                        >
                          Pågår
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, TaskStatus.COMPLETED)
                          }
                          disabled={
                            updateTaskStatus.isPending ||
                            task.status === TaskStatus.COMPLETED
                          }
                          className={`px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                            task.status === TaskStatus.COMPLETED
                              ? "bg-green-200 text-green-800 border-green-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-green-50"
                          }`}
                        >
                          Fullført
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fullført */}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Fullført ({completedTasks.length})
                </h3>
                <div className="grid gap-3">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-lg ${
                        task.status === TaskStatus.COMPLETED
                          ? "bg-green-50 border-green-200"
                          : task.status === TaskStatus.IN_PROGRESS
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-gray-600 m-0 mb-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                            <span>
                              Status:{" "}
                              <span className="font-medium">
                                {task.status === TaskStatus.PENDING
                                  ? "Venter"
                                  : task.status === TaskStatus.IN_PROGRESS
                                  ? "Pågår"
                                  : "Fullført"}
                              </span>
                            </span>
                            {task.createdAt && (
                              <span>
                                Opprettet:{" "}
                                {new Date(task.createdAt).toLocaleDateString(
                                  "no-NO"
                                )}
                              </span>
                            )}
                            {typeof task.estimatedMinutes === "number" && (
                              <span>
                                Tidsestimat:{" "}
                                <span className="font-medium">
                                  {task.estimatedMinutes} min
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, TaskStatus.PENDING)
                          }
                          disabled={
                            updateTaskStatus.isPending ||
                            task.status === TaskStatus.PENDING
                          }
                          className={`px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                            task.status === TaskStatus.PENDING
                              ? "bg-gray-200 text-gray-700 border-gray-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          Venter
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, TaskStatus.IN_PROGRESS)
                          }
                          disabled={
                            updateTaskStatus.isPending ||
                            task.status === TaskStatus.IN_PROGRESS
                          }
                          className={`px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                            task.status === TaskStatus.IN_PROGRESS
                              ? "bg-yellow-200 text-yellow-800 border-yellow-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-yellow-50"
                          }`}
                        >
                          Pågår
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, TaskStatus.COMPLETED)
                          }
                          disabled={
                            updateTaskStatus.isPending ||
                            task.status === TaskStatus.COMPLETED
                          }
                          className={`px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                            task.status === TaskStatus.COMPLETED
                              ? "bg-green-200 text-green-800 border-green-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-green-50"
                          }`}
                        >
                          Fullført
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
