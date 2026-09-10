export default function HowItWorksLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col animate-pulse">
      {/* Hero section skeleton */}
      <section className="border-b border-neutral-900 bg-black px-6 pt-20 pb-16 text-center space-y-6">
        <div className="mx-auto max-w-4xl space-y-6 flex flex-col items-center">
          <div className="h-6 w-64 bg-neutral-900 rounded-full" />
          <div className="space-y-4 w-full max-w-2xl">
            <div className="h-12 w-full bg-neutral-900 rounded-lg" />
            <div className="h-12 w-3/4 bg-neutral-900 rounded-lg mx-auto" />
          </div>
          <div className="space-y-2 w-full max-w-xl">
            <div className="h-4 w-full bg-neutral-900 rounded" />
            <div className="h-4 w-5/6 bg-neutral-900 rounded mx-auto" />
          </div>
        </div>
      </section>

      {/* Steps section skeleton */}
      <section className="bg-neutral-950 px-6 py-20 border-b border-neutral-900">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4 flex flex-col items-center">
            <div className="h-4 w-48 bg-neutral-900 rounded" />
            <div className="h-10 w-96 bg-neutral-900 rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`rounded-2xl p-7 space-y-5 border ${i % 2 === 1 ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-800'}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${i % 2 === 1 ? 'bg-black' : 'bg-white'}`} />
                  <div className="space-y-2">
                    <div className={`h-3 w-16 rounded ${i % 2 === 1 ? 'bg-neutral-200' : 'bg-neutral-800'}`} />
                    <div className={`h-5 w-48 rounded ${i % 2 === 1 ? 'bg-neutral-200' : 'bg-neutral-800'}`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className={`h-3 w-full rounded ${i % 2 === 1 ? 'bg-neutral-100' : 'bg-neutral-800'}`} />
                  <div className={`h-3 w-5/6 rounded ${i % 2 === 1 ? 'bg-neutral-100' : 'bg-neutral-800'}`} />
                </div>
                <div className={`pt-4 border-t space-y-3 ${i % 2 === 1 ? 'border-neutral-100' : 'border-neutral-800'}`}>
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className={`h-3.5 w-3.5 rounded-full ${i % 2 === 1 ? 'bg-black' : 'bg-white'}`} />
                      <div className={`h-3 w-48 rounded ${i % 2 === 1 ? 'bg-neutral-200' : 'bg-neutral-800'}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
