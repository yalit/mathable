Each Cell is "impacted" by potentially 8 cells:
- the 2 cells directly on the right
- the 2 cells directly on the left
- the 2 cells directly at the top
- the 2 cells directly at the bottom

In the grid, the rows are counted increasingly from top to bottom and the columns increasingly from left to right

Currently, there is a computation that stores at the Cell level the "allowedValues" getting the unique values from the 4 arithmetic operations from each direction. If 2 values are the same from different directions they should be kept as 2 "different" values in the list for them to be counted twice in the score

However, when we'll want to compute if a tile is removable from a cell during a turn, we need to ensure that this tile is not used in the computation of another cell... We need to find a way to keep from where the value of the tile in a cell comes from (which allowed value and also from which direction)

the idea would be to keep at the cell level, an object for each of the direction that would provide:
- which 2 cells are impacting this one cell from that direction
- which values are allowed from that direction

Maybe should we also keep a list of the impacted cells on each direction at the cell level

Then when we want to remove a tile from a cell, we can compute if that cell is impacting another one and see, if it's impacting, if the value of the tile on that cell is coming from that direction or not...



OR:
we just allow only to remove the last placed tile which would remove the need to see if it's impacting another one... that might save performance on the cancelling tentative...

But in this way, how to keep the fact that the cell is cancellable as being the last move on the turn...?
