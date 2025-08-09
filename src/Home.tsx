import { CreateGameCard } from "@components/home/createGameCard";
import { SelectGame } from "@components/home/selectGame";

function Home() {
  return (
    <div className="w-screen h-screen inset-0 grid grid-rows-3 gap-4">
      <div className="h-full flex justify-center items-end font-bold text-4xl">
        Mathable - game
      </div>
      <div className="row-span-2">
        <div className="container border-amber-400 grid grid-cols-2 items-stretch gap-6">
          <SelectGame />
          <CreateGameCard />
        </div>
      </div>
    </div>
  );
}

export default Home;
