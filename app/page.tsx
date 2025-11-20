'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';

export default function Home() {
  const [regNr, setRegNr] = useState('');
  const { data: cars, isLoading, refetch } = trpc.getCars.useQuery();
  const createCar = trpc.createCar.useMutation({
    onSuccess: () => {
      setRegNr('');
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regNr.trim()) {
      createCar.mutate({ regNr: regNr.trim() });
    }
  };

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl mb-8">Bilregister</h1>
      
      {/* Create Car Form */}
      <section className="mb-12">
        <h2 className="text-xl mb-4">Legg til ny bil</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-start">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Skriv inn registreringsnummer (f.eks. EK12345)"
              value={regNr}
              onChange={(e) => setRegNr(e.target.value)}
              disabled={createCar.isPending}
              className="w-full px-3 py-3 text-base border border-gray-300 rounded"
            />
          </div>
          <button
            type="submit"
            disabled={createCar.isPending || !regNr.trim()}
            className="px-6 py-3 text-base bg-blue-600 text-white border-none rounded whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer hover:bg-blue-700 transition-colors"
          >
            {createCar.isPending ? 'Legger til...' : 'Legg til bil'}
          </button>
        </form>

        {createCar.error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">
            <p className="m-0">Feil: {createCar.error.message}</p>
          </div>
        )}

        {createCar.isSuccess && (
          <div className="mt-4 p-4 bg-green-50 text-green-600 rounded">
            <p className="m-0">Bil lagt til!</p>
          </div>
        )}
      </section>

      {/* Cars List */}
      <section>
        <h2 className="text-xl mb-4">Registrerte biler</h2>
        
        {isLoading && (
          <div className="p-8 text-center text-gray-600">
            Laster biler...
          </div>
        )}

        {!isLoading && (!cars || cars.length === 0) && (
          <div className="p-8 text-center text-gray-600">
            Ingen biler registrert ennå. Legg til en over for å komme i gang!
          </div>
        )}

        {!isLoading && cars && cars.length > 0 && (
          <div className="grid gap-4">
            {cars.map((car) => (
              <Link
                key={car.id}
                href={`/cars/${car.id}`}
                className="block no-underline text-inherit"
              >
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-blue-600 hover:-translate-y-0.5">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Registreringsnummer
                    </div>
                    <div className="text-xl font-bold">
                      {car.regNr}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Merke & Modell
                    </div>
                    <div className="text-base font-medium">
                      {car.make} {car.model}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      År
                    </div>
                    <div className="text-base">{car.year}</div>
                  </div>
                  {car.color && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Farge
                      </div>
                      <div className="text-base">{car.color}</div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
