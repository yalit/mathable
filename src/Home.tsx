import { CreateGameCard } from "@components/home/createGameCard";
import { SelectGame } from "@components/home/selectGame";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalculator,
  faPuzzlePiece,
  faBrain,
} from "@fortawesome/free-solid-svg-icons";

function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-100 via-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <FontAwesomeIcon
              icon={faCalculator}
              className="text-sky-600 text-4xl animate-bounce"
              style={{ animationDelay: "0s" }}
            />
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600">
              Mathable
            </h1>
            <FontAwesomeIcon
              icon={faBrain}
              className="text-purple-600 text-4xl animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <FontAwesomeIcon
              icon={faPuzzlePiece}
              className="text-pink-500 text-xl"
            />
            <p className="text-xl text-gray-700 font-medium">
              Challenge your mind with mathematical puzzles!
            </p>
            <FontAwesomeIcon
              icon={faPuzzlePiece}
              className="text-pink-500 text-xl"
            />
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border-2 border-sky-200">
              <span className="text-sm font-semibold text-sky-700">
                🎯 Strategy
              </span>
            </div>
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border-2 border-purple-200">
              <span className="text-sm font-semibold text-purple-700">
                🧮 Mathematics
              </span>
            </div>
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border-2 border-pink-200">
              <span className="text-sm font-semibold text-pink-700">
                👥 Multiplayer
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center gap-12">
          {/* Ongoing Games Section */}
          <SelectGame />

          {/* Divider */}
          <div className="w-full max-w-4xl">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-gradient-to-br from-sky-100 via-purple-50 to-pink-100 text-sm font-semibold text-gray-600">
                  OR
                </span>
              </div>
            </div>
          </div>

          {/* Create Game Section */}
          <CreateGameCard />
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>Play solo or with up to 4 players • Challenge your friends!</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
