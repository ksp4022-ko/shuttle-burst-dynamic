import { V8CalligraphyName } from "./V8CalligraphyName";

const previewCases = [
  { label: "A.", name: "柯 Sammy", note: "asset" },
  { label: "B.", name: "Peggy", note: "fallback" },
  { label: "C.", name: "Alexander Chen", note: "fallback" },
];

const descenderCases = ["Qing", "Ajay", "Peggy", "Jasper"];

export function V8CalligraphyP009BPreview() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#efe6d2] px-4 py-6 text-[#18120b] sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold tracking-[0.18em] text-[#6b4b26]">
            P-009B
          </p>
          <h1 className="text-2xl font-black sm:text-3xl">
            書法人名 Hybrid Renderer
          </h1>
        </header>

        <section className="grid gap-4">
          {previewCases.map((item) => (
            <article
              key={item.name}
              className="grid gap-3 rounded-md border border-[#2c2114]/20 bg-[#f8f1e3] p-4 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:items-center"
            >
              <div className="text-lg font-black">{item.label}</div>
              <div className="h-32 min-w-0 overflow-visible rounded-sm bg-[#fff9ee] px-3 py-4 sm:h-36">
                <V8CalligraphyName name={item.name} />
              </div>
              <div className="text-sm font-semibold text-[#6b4b26] sm:col-start-2">
                {item.note}
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-3 rounded-md border border-[#2c2114]/20 bg-[#f8f1e3] p-4">
          <h2 className="text-base font-black">descender check</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {descenderCases.map((name) => (
              <div
                key={name}
                className="h-24 overflow-visible rounded-sm bg-[#fff9ee] px-2 py-3"
              >
                <V8CalligraphyName name={name} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
