import Form from "next/form";
import AgeSlider from "@/components/age/slider";

export default function Page(){
    return(
        <main className="bg-white h-screen flex flex-col items-center justify-center gap-12 px-6">
            <div className="text-center">
                <h1 className="text-4xl font-semibold font-syne">Let{"\'"}s Know Your Age</h1>
            </div>
            {/* Submits the slider's `age` field: navigates to /weight?age=28 */}
            <Form action="/weight" className="flex w-full max-w-md flex-col items-center gap-12">
                <AgeSlider />
                <button
                    type="submit"
                    className="w-full text-2xl hover:bg-lime-400 shadow-xl bg-lime-300 duration-300 text-black border-2 border-b-6 border-black rounded-xl px-12 py-4 font-semibold font-grotesque cursor-pointer active:border-b-2 active:translate-y-1"
                >
                    Continue
                </button>
            </Form>
        </main>
    );
}
