import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return(
    <main className="bg-white flex flex-col items-center justify-center px-6 h-screen gap-6">
      <Image className="mb-6" src="/bloub-forward.gif" height={120} width={120} alt="mascot" />
      <h1 className="text-4xl text-center font-semibold font-syne">Hi, Diva Let{"\'"}s Get You Onboarded</h1>
      <Link className="text-2xl hover:bg-lime-400 shadow-xl bg-lime-300 duration-300 text-black border-2 border-b-6 border-black rounded-xl px-12 py-4 font-semibold font-grotesque" href="/weight">Let{"\'"}s Go</Link>
    </main>
  );
}
