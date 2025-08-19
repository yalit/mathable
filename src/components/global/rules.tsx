import { Modal } from "@components/includes/modal";

type RulesProps = {
  close: () => void;
};

export function Rules({ close }: RulesProps) {
  return (
    <Modal
      canClose={true}
      closeModal={close}
      classname="max-w-[80vw] max-h-[80vh] overflow-auto rules"
    >
      <h2>General Description</h2>
      <div className="onetab">
        Mathable is a game based upon mathematical operations which must be
        formed on the playing board, described as being like playing Scrabble
        but using numbers.
      </div>
      <div className="onetab">
        The game challenges players to use basic math operations including
        addition, subtraction, multiplication and division to achieve the
        highest score.
      </div>

      <h2>Components</h2>
      <ul className="onetab">
        <li className="onetab">
          A playing board with normal squares, squares with a restriction (pink
          squares) and squares with an award (blue squares marked 2x, and white
          squares marked 3x and 4 numbered squares.
        </li>
        <li className="onetab">108 numbered tiles</li>
      </ul>

      <h2>How to play</h2>
      <h3 className="onetab">Mathematical operations</h3>
      <div className="twotab">
        A mathematical operation is one of the following : adding, subtracting,
        multiplying or dividing two adjacent numbers putting a tile with the
        result on the next empty square, be it to the right or left, below or
        above the two original numbers.
      </div>
      <div className="twotab">
        Operations may be made horizontally or vertically, but never diagonally.
      </div>

      <h3 className="onetab">Scoring</h3>
      <ul className="twotab">
        <li className="twotab">
          Each tile has a point value equal to the number on the tile
        </li>
        <li className="twotab">
          The total amount of points earned per turn is the total sum of the
          value of all tiles placed in that turn
        </li>
      </ul>

      <h3 className="onetab">Special Squares</h3>
      <div className="twotab font-semibold">Restriction "Pink" squares</div>
      <div className="twotab">
        The pink squares are marked with an addition, subtraction,
        multiplication or division sign, and force the player to answer to an
        operation of that particular nature, should he wish to occupy said
        square. If a player places a tile on a pink restriction square, he may
        at that moment take an extra tile from the bag if he so wishes.
      </div>

      <div className="twotab font-semibold">Award "Blue"/"White" squares</div>
      <div className="twotab">
        A blue square marked 2x doubles the amount of points of the tile on that
        square, a white square marked 3x triples the amount of points.
      </div>

      <h3 className="onetab">Multiple equations bonus</h3>
      <div className="twotab">
        If a tile, when being placed, completes more than one operation, and the
        player is aware of this, the points are gained for each operation
        completed.
      </div>

      <h3 className="onetab">Extra bonus</h3>
      <div className="twotab">
        If a player manages to place all the tiles he has in hand in one turn,
        he earns an extra bonus of 50 points (only applies if starting the turn
        with 7 tiles).
      </div>

      <h3 className="onetab">Additional rules</h3>
      <ol className="twotab list-decimal">
        <li className="twotab">
          A player may make use of his turn to exchange one or more tiles on his
          holder for new ones instead of playing tiles on the board.
        </li>
        <li className="twotab">
          After having placed a tile on the board, one may not take it back
        </li>
        <li className="twotab">
          At the end of his turn, each player takes tiles randomly from the
          pile, to bring the amount on his holder back to 7
        </li>
      </ol>

      <h2>End of game</h2>
      <div className="onetab">
        The game continues until there are no tokens left in the pile, and one
        of the players has used up all the tokens on his holder, or until no
        more equations can be made. At the end of the game, each player deducts
        the value of the tokens still on his holder from the total amount of
        points accumulated during the game.
      </div>
      <div className="onetab">
        The player who at the end of the game has obtained most points is
        proclaimed winner.
      </div>
    </Modal>
  );
}
