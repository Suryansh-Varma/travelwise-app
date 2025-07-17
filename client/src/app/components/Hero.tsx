'use client';

import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/login');
  };

  return (
    <div className="flex justify-center items-center px-6 py-10 min-h-[480px] bg-cover bg-center bg-no-repeat rounded-xl"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4)),
          url("https://lh3.googleusercontent.com/aida-public/AB6AXuCaKLwrMZhfCjUiKm41-_pXIMvxSspQwfh-hhZh3EsHld13eVUvAWAEgtEP-fUsAbf4hhCNzSDncgiq_7FeDHJLKKVmZidGImbEW_1AT6-0EOkGW0vQTkWfDyJK-gTjYQne7UQ647q4_-EEUszDzSCT5hFQ9YjlQnhmx24DgcoQvPO9wNdGi-B6xWc6G1mpdO5iaWgXlbVwLk_5BhEH7xSmC1jBJ5WmYjOWDoSa9WKPfyxyShrPfcTBNwIIKbMArkUjk_e7lKQHus6f")
        `
      }}
    >
      <div className="flex flex-col items-center text-center gap-4 max-w-[90%]">
        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Plan smarter. Travel wiser.
        </h1>
        <h2 className="text-base font-normal text-white/80">
          Smart AI itineraries for budget-friendly travel.
        </h2>
        <button onClick={handleClick} className="mt-6 px-6 py-3 rounded-xl bg-white/10 text-white text-sm font-medium backdrop-blur border border-white/20 hover:border-white hover:bg-white/20 transition duration-200 shadow-sm hover:shadow-md">
  Start Planning
</button>
      </div>
    </div>
  );
}