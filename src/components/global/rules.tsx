import { Modal } from "@components/includes/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCalculator,
  faStar,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";

type RulesProps = {
  close: () => void;
};

export function Rules({ close }: RulesProps) {
  return (
    <Modal
      canClose={true}
      closeModal={close}
      classname="max-w-[800px] max-h-[85vh] overflow-auto"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-200 pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <FontAwesomeIcon icon={faBook} className="text-sky-600 text-2xl" />
            <h1 className="text-3xl font-bold text-gray-900">Game Rules</h1>
            <FontAwesomeIcon icon={faBook} className="text-sky-600 text-2xl" />
          </div>
          <p className="text-gray-600">Learn how to play Mathable</p>
        </div>

        {/* General Description */}
        <section className="bg-sky-50 border-2 border-sky-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faCalculator} className="text-sky-600" />
            General Description
          </h2>
          <p className="text-gray-700 mb-2">
            Mathable is a game based upon mathematical operations which must be
            formed on the playing board, described as being like playing
            Scrabble but using numbers.
          </p>
          <p className="text-gray-700">
            The game challenges players to use basic math operations including
            addition, subtraction, multiplication and division to achieve the
            highest score.
          </p>
        </section>

        {/* Components */}
        <section className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Components</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>
              A playing board with normal squares, squares with a restriction
              (pink squares) and squares with an award (blue squares marked 2x,
              and white squares marked 3x and 4 numbered squares)
            </li>
            <li>108 numbered tiles</li>
          </ul>
        </section>

        {/* How to Play */}
        <section className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Play</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Mathematical Operations
              </h3>
              <p className="text-gray-700 mb-2">
                A mathematical operation is one of the following: adding,
                subtracting, multiplying or dividing two adjacent numbers
                putting a tile with the result on the next empty square, be it
                to the right or left, below or above the two original numbers.
              </p>
              <p className="text-gray-700">
                Operations may be made horizontally or vertically, but never
                diagonally.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Scoring
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>
                  Each tile has a point value equal to the number on the tile
                </li>
                <li>
                  The total amount of points earned per turn is the total sum of
                  the value of all tiles placed in that turn
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Special Squares */}
        <section className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faStar} className="text-amber-600" />
            Special Squares
          </h2>

          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-pink-700 mb-2">
                Restriction "Pink" Squares
              </h3>
              <p className="text-gray-700">
                The pink squares are marked with an addition, subtraction,
                multiplication or division sign, and force the player to answer
                to an operation of that particular nature, should he wish to
                occupy said square. If a player places a tile on a pink
                restriction square, he may at that moment take an extra tile
                from the bag if he so wishes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                Award "Blue"/"White" Squares
              </h3>
              <p className="text-gray-700">
                A blue square marked 2x doubles the amount of points of the tile
                on that square, a white square marked 3x triples the amount of
                points.
              </p>
            </div>
          </div>
        </section>

        {/* Bonuses */}
        <section className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bonuses</h2>

          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Multiple Equations Bonus
              </h3>
              <p className="text-gray-700">
                If a tile, when being placed, completes more than one operation,
                and the player is aware of this, the points are gained for each
                operation completed.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Extra Bonus (50 points)
              </h3>
              <p className="text-gray-700">
                If a player manages to place all the tiles he has in hand in one
                turn, he earns an extra bonus of 50 points (only applies if
                starting the turn with 7 tiles).
              </p>
            </div>
          </div>
        </section>

        {/* Additional Rules */}
        <section className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Additional Rules
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>
              A player may make use of his turn to exchange one or more tiles on
              his holder for new ones instead of playing tiles on the board
            </li>
            <li>
              After having placed a tile on the board, one may not take it back
            </li>
            <li>
              At the end of his turn, each player takes tiles randomly from the
              pile, to bring the amount on his holder back to 7
            </li>
          </ol>
        </section>

        {/* End of Game */}
        <section className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faTrophy} className="text-emerald-600" />
            End of Game
          </h2>
          <p className="text-gray-700 mb-2">
            The game continues until there are no tokens left in the pile, and
            one of the players has used up all the tokens on his holder, or
            until no more equations can be made. At the end of the game, each
            player deducts the value of the tokens still on his holder from the
            total amount of points accumulated during the game.
          </p>
          <p className="text-gray-700 font-semibold">
            The player who at the end of the game has obtained most points is
            proclaimed winner.
          </p>
        </section>
      </div>
    </Modal>
  );
}
